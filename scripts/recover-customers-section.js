const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const REFERENCE_COMMIT = 'f8e9340ebf1b01ec18629c4f2699f9a0afd54d37';
const BACKUP_DIR = path.join(PROJECT_ROOT, '.customers-recovery-backup');

// Archivos críticos de clientes a verificar
const CRITICAL_CUSTOMER_FILES = [
  // Frontend
  'src/app/admin/customers/page.tsx',
  'src/app/admin/customers/new/page.tsx',
  'src/app/admin/customers/[id]/page.tsx',
  'src/app/admin/customers/[id]/edit/page.tsx',
  'src/components/admin/CreatePrescriptionForm.tsx',
  
  // API Routes
  'src/app/api/admin/customers/route.ts',
  'src/app/api/admin/customers/[id]/route.ts',
  'src/app/api/admin/customers/search/route.ts',
  'src/app/api/admin/customers/[id]/prescriptions/route.ts',
  'src/app/api/admin/customers/[id]/prescriptions/[prescriptionId]/route.ts',
  'src/app/api/admin/customers/[id]/appointments/route.ts',
  
  // Hooks
  'src/hooks/useCustomers.ts',
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

function recoverFile(filePath, force = false) {
  const relativePath = path.relative(PROJECT_ROOT, filePath);
  
  if (!fileExistsInGit(REFERENCE_COMMIT, filePath)) {
    console.log(`  ⚠️  No existe en commit de referencia: ${relativePath}`);
    return false;
  }
  
  const referenceContent = getFileContentFromGit(REFERENCE_COMMIT, filePath);
  if (!referenceContent) {
    console.log(`  ⚠️  No se pudo obtener contenido: ${relativePath}`);
    return false;
  }
  
  const exists = fs.existsSync(filePath);
  let shouldRecover = force;
  
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
    }
  } else {
    console.log(`  ❌ Archivo faltante: ${relativePath}`);
    shouldRecover = true;
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
    console.log(`  ✅ Recuperado: ${relativePath}`);
    return true;
  }
  
  return false;
}

function recoverMigration(migrationPath) {
  const relativePath = path.relative(PROJECT_ROOT, migrationPath);
  
  // Buscar en todos los commits
  const commits = [
    'f8e9340',
    '047ac80',
    'e6ed01a',
    'e49441d',
    '0338e2c',
  ];
  
  for (const commit of commits) {
    if (fileExistsInGit(commit, migrationPath)) {
      const content = getFileContentFromGit(commit, migrationPath);
      if (content) {
        // Crear directorio si no existe
        const dir = path.dirname(migrationPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Recuperar migración
        fs.writeFileSync(migrationPath, content, 'utf8');
        console.log(`  ✅ Migración recuperada desde ${commit}: ${relativePath}`);
        return true;
      }
    }
  }
  
  console.log(`  ⚠️  No se encontró migración: ${relativePath}`);
  return false;
}

function main() {
  console.log('🔄 Recuperando funcionalidad completa de Clientes');
  console.log(`📌 Commit de referencia: ${REFERENCE_COMMIT}`);
  console.log('='.repeat(60));
  
  // Crear directorio de backup
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  let recoveredCount = 0;
  let checkedCount = 0;
  
  // Recuperar archivos críticos
  console.log('\n📁 Recuperando archivos críticos...');
  CRITICAL_CUSTOMER_FILES.forEach(filePath => {
    const fullPath = path.join(PROJECT_ROOT, filePath);
    checkedCount++;
    if (recoverFile(fullPath)) {
      recoveredCount++;
    }
  });
  
  // Recuperar migraciones perdidas
  console.log('\n📁 Recuperando migraciones perdidas...');
  CUSTOMER_MIGRATIONS.forEach(migrationPath => {
    const fullPath = path.join(PROJECT_ROOT, migrationPath);
    if (recoverMigration(fullPath)) {
      recoveredCount++;
    }
  });
  
  // Buscar archivos adicionales en directorios de clientes
  console.log('\n📁 Buscando archivos adicionales...');
  const customerDirs = [
    'src/app/admin/customers',
    'src/app/api/admin/customers',
    'src/components/admin',
  ];
  
  customerDirs.forEach(dir => {
    const fullPath = path.join(PROJECT_ROOT, dir);
    if (fs.existsSync(fullPath)) {
      const files = getAllFilesInDirectory(fullPath);
      files.forEach(file => {
        // Solo verificar si no está en CRITICAL_CUSTOMER_FILES
        const relativePath = path.relative(PROJECT_ROOT, file);
        const isCritical = CRITICAL_CUSTOMER_FILES.some(cf => {
          const criticalPath = path.join(PROJECT_ROOT, cf);
          return file === criticalPath || file.startsWith(criticalPath + path.sep);
        });
        
        if (!isCritical && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
          checkedCount++;
          if (recoverFile(file)) {
            recoveredCount++;
          }
        }
      });
    }
  });
  
  console.log('\n\n📊 RESUMEN');
  console.log('='.repeat(60));
  console.log(`  - Archivos verificados: ${checkedCount}`);
  console.log(`  - Archivos recuperados: ${recoveredCount}`);
  console.log(`  - Backup guardado en: ${BACKUP_DIR}`);
  
  if (recoveredCount > 0) {
    console.log('\n✅ Recuperación completada. Revisa los cambios y prueba la funcionalidad.');
  } else {
    console.log('\n✅ No se encontraron archivos que necesiten recuperación.');
  }
}

function getAllFilesInDirectory(dir, fileList = []) {
  if (!fs.existsSync(dir)) {
    return fileList;
  }
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getAllFilesInDirectory(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

if (require.main === module) {
  main();
}

module.exports = { main, recoverFile, recoverMigration, REFERENCE_COMMIT };
