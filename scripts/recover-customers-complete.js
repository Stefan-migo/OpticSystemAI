const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const BACKUP_DIR = path.join(PROJECT_ROOT, '.customers-recovery-backup');

// Commits funcionales que pueden tener versiones completas
const FUNCTIONAL_COMMITS = [
  { hash: 'eab64b4', desc: 'Completar Fase 3 - Mejoras de Seguridad' },
  { hash: 'e49441d', desc: 'Completar Fase 2 - Refactorización de componentes' },
  { hash: '047ac80', desc: 'Corregir errores críticos y mejoras de código' },
  { hash: 'e6ed01a', desc: 'Sistema completo de gestión óptica' },
  { hash: 'f8e9340', desc: 'Corregir paths de importación en tests' },
];

// Archivos críticos de clientes
const CRITICAL_FILES = [
  'src/app/admin/customers/page.tsx',
  'src/app/admin/customers/new/page.tsx',
  'src/app/admin/customers/[id]/page.tsx',
  'src/app/admin/customers/[id]/edit/page.tsx',
  'src/components/admin/CreatePrescriptionForm.tsx',
  'src/app/api/admin/customers/route.ts',
  'src/app/api/admin/customers/[id]/route.ts',
  'src/app/api/admin/customers/search/route.ts',
  'src/app/api/admin/customers/[id]/prescriptions/route.ts',
  'src/app/api/admin/customers/[id]/prescriptions/[prescriptionId]/route.ts',
  'src/app/api/admin/customers/[id]/appointments/route.ts',
];

// Migraciones relacionadas con clientes
const CUSTOMER_MIGRATIONS = [
  'supabase/migrations/20260122000001_add_customer_own_frame_to_work_orders.sql',
  'supabase/migrations/20260127000003_add_customer_name_to_orders.sql',
];

function createBackup(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }
  
  const relativePath = path.relative(PROJECT_ROOT, filePath);
  const backupPath = path.join(BACKUP_DIR, relativePath);
  const backupDir = path.dirname(backupPath);
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  fs.copyFileSync(filePath, backupPath);
  console.log(`  ✅ Backup creado: ${relativePath}`);
}

function fileExistsInGit(commit, filePath) {
  try {
    const relativePath = path.relative(PROJECT_ROOT, filePath).replace(/\\/g, '/');
    execSync(
      `git show ${commit}:${relativePath} > /dev/null 2>&1`,
      { encoding: 'utf8', cwd: PROJECT_ROOT, stdio: 'ignore' }
    );
    return true;
  } catch (error) {
    return false;
  }
}

function getFileContentFromGit(commit, filePath) {
  try {
    const relativePath = path.relative(PROJECT_ROOT, filePath).replace(/\\/g, '/');
    const content = execSync(
      `git show ${commit}:${relativePath}`,
      { encoding: 'utf8', cwd: PROJECT_ROOT, stdio: ['pipe', 'pipe', 'ignore'] }
    );
    return content;
  } catch (error) {
    return null;
  }
}

function countLinesAndFunctions(content) {
  if (!content) return { lines: 0, functions: 0 };
  
  const lines = content.split('\n').length;
  const functionMatches = content.match(/(?:^|\n)\s*(?:export\s+)?(?:async\s+)?function\s+\w+|(?:^|\n)\s*(?:export\s+)?(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?\([^)]*\)\s*=>|(?:^|\n)\s*(?:export\s+)?(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?function/g);
  const functions = functionMatches ? functionMatches.length : 0;
  
  return { lines, functions };
}

function findBestCommitForFile(filePath) {
  for (const commitInfo of FUNCTIONAL_COMMITS) {
    if (fileExistsInGit(commitInfo.hash, filePath)) {
      return commitInfo;
    }
  }
  return null;
}

function analyzeAndRecoverFile(filePath) {
  const relativePath = path.relative(PROJECT_ROOT, filePath);
  const commitInfo = findBestCommitForFile(filePath);
  
  if (!commitInfo) {
    console.log(`  ⚠️  No encontrado en commits funcionales: ${relativePath}`);
    return { recovered: false, reason: 'not_found' };
  }
  
  const referenceContent = getFileContentFromGit(commitInfo.hash, filePath);
  if (!referenceContent) {
    console.log(`  ⚠️  No se pudo obtener contenido: ${relativePath}`);
    return { recovered: false, reason: 'no_content' };
  }
  
  const exists = fs.existsSync(filePath);
  let shouldRecover = false;
  let reason = '';
  
  if (exists) {
    const currentContent = fs.readFileSync(filePath, 'utf8');
    const current = countLinesAndFunctions(currentContent);
    const reference = countLinesAndFunctions(referenceContent);
    
    const linesLost = reference.lines - current.lines;
    const functionsLost = reference.functions - current.functions;
    
    // Recuperar si se perdió más del 30% de líneas o más de 10 funciones
    shouldRecover = linesLost > 100 || functionsLost > 10 || (linesLost > 0 && linesLost / reference.lines > 0.3);
    
    if (shouldRecover) {
      console.log(`  📉 Pérdida detectada: ${relativePath}`);
      console.log(`     Líneas: ${reference.lines} → ${current.lines} (perdidas: ${linesLost})`);
      console.log(`     Funciones: ${reference.functions} → ${current.functions} (perdidas: ${functionsLost})`);
      reason = `loss: ${linesLost} lines, ${functionsLost} functions`;
    } else {
      console.log(`  ✅ Sin pérdida significativa: ${relativePath} (${current.lines} líneas, ${current.functions} funciones)`);
      return { recovered: false, reason: 'no_loss' };
    }
  } else {
    console.log(`  ❌ Archivo faltante: ${relativePath}`);
    shouldRecover = true;
    reason = 'missing';
  }
  
  if (shouldRecover) {
    // Crear backup
    if (exists) {
      createBackup(filePath);
    }
    
    // Crear directorio si no existe
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Recuperar archivo
    fs.writeFileSync(filePath, referenceContent, 'utf8');
    console.log(`  ✅ Recuperado desde ${commitInfo.hash}: ${relativePath}`);
    console.log(`     ${commitInfo.desc}`);
    return { recovered: true, reason, commit: commitInfo.hash };
  }
  
  return { recovered: false, reason };
}

function recoverMigration(migrationPath) {
  const relativePath = path.relative(PROJECT_ROOT, migrationPath);
  
  // Buscar en todos los commits
  for (const commitInfo of FUNCTIONAL_COMMITS) {
    if (fileExistsInGit(commitInfo.hash, migrationPath)) {
      const content = getFileContentFromGit(commitInfo.hash, migrationPath);
      if (content) {
        // Crear directorio si no existe
        const dir = path.dirname(migrationPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Recuperar migración
        fs.writeFileSync(migrationPath, content, 'utf8');
        console.log(`  ✅ Migración recuperada desde ${commitInfo.hash}: ${relativePath}`);
        return true;
      }
    }
  }
  
  // Buscar en todo el historial de Git
  try {
    const allCommits = execSync(
      `git log --all --oneline --format="%H" -- "${migrationPath.replace(/\\/g, '/')}"`,
      { encoding: 'utf8', cwd: PROJECT_ROOT }
    ).trim().split('\n').filter(Boolean);
    
    if (allCommits.length > 0) {
      const commit = allCommits[0];
      const content = getFileContentFromGit(commit, migrationPath);
      if (content) {
        const dir = path.dirname(migrationPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(migrationPath, content, 'utf8');
        console.log(`  ✅ Migración recuperada desde ${commit}: ${relativePath}`);
        return true;
      }
    }
  } catch (error) {
    // Continue
  }
  
  console.log(`  ⚠️  No se encontró migración: ${relativePath}`);
  return false;
}

function main() {
  console.log('🔄 Recuperación Completa de Sección de Clientes');
  console.log('='.repeat(60));
  
  // Crear directorio de backup
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  let recoveredCount = 0;
  let checkedCount = 0;
  const recoveryDetails = [];
  
  // Recuperar archivos críticos
  console.log('\n📁 Analizando y recuperando archivos críticos...');
  CRITICAL_FILES.forEach(filePath => {
    const fullPath = path.join(PROJECT_ROOT, filePath);
    checkedCount++;
    const result = analyzeAndRecoverFile(fullPath);
    if (result.recovered) {
      recoveredCount++;
      recoveryDetails.push({
        file: filePath,
        commit: result.commit,
        reason: result.reason,
      });
    }
  });
  
  // Recuperar migraciones perdidas
  console.log('\n📁 Recuperando migraciones perdidas...');
  CUSTOMER_MIGRATIONS.forEach(migrationPath => {
    const fullPath = path.join(PROJECT_ROOT, migrationPath);
    if (recoverMigration(fullPath)) {
      recoveredCount++;
      recoveryDetails.push({
        file: migrationPath,
        commit: 'various',
        reason: 'migration',
      });
    }
  });
  
  console.log('\n\n📊 RESUMEN');
  console.log('='.repeat(60));
  console.log(`  - Archivos verificados: ${checkedCount}`);
  console.log(`  - Archivos recuperados: ${recoveredCount}`);
  console.log(`  - Backup guardado en: ${BACKUP_DIR}`);
  
  if (recoveredCount > 0) {
    console.log('\n📋 Detalles de recuperación:');
    recoveryDetails.forEach(detail => {
      console.log(`  - ${detail.file}`);
      console.log(`    Commit: ${detail.commit}, Razón: ${detail.reason}`);
    });
    console.log('\n✅ Recuperación completada. Revisa los cambios y prueba la funcionalidad.');
    console.log('⚠️  Nota: Puede que necesites ajustar el código para que funcione con los cambios de SaaS.');
  } else {
    console.log('\n✅ No se encontraron archivos que necesiten recuperación.');
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, analyzeAndRecoverFile, recoverMigration };
