const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const BACKUP_DIR = path.join(PROJECT_ROOT, '.products-recovery-backup');

// Commits funcionales que pueden tener versiones completas
const FUNCTIONAL_COMMITS = [
  { hash: 'eab64b4', desc: 'Completar Fase 3 - Mejoras de Seguridad' },
  { hash: 'e49441d', desc: 'Completar Fase 2 - Refactorización de componentes' },
  { hash: '047ac80', desc: 'Corregir errores críticos y mejoras de código' },
  { hash: 'e6ed01a', desc: 'Sistema completo de gestión óptica' },
  { hash: 'f8e9340', desc: 'Corregir paths de importación en tests' },
];

// Archivos críticos de productos
const CRITICAL_FILES = [
  'src/app/admin/products/page.tsx',
  'src/app/admin/products/add/page.tsx',
  'src/app/admin/products/edit/[id]/page.tsx',
  'src/app/admin/products/[id]/page.tsx',
  'src/app/admin/categories/page.tsx',
  'src/app/admin/lens-families/page.tsx',
  'src/app/admin/lens-matrices/page.tsx',
];

// Migraciones relacionadas con productos
const PRODUCT_MIGRATIONS = [
  'supabase/migrations/20260120000000_refactor_separate_products_inventory.sql',
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

function findBestCommitForFile(filePath) {
  for (const commitInfo of FUNCTIONAL_COMMITS) {
    if (fileExistsInGit(commitInfo.hash, filePath)) {
      return commitInfo;
    }
  }
  return null;
}

function recoverFile(filePath, force = false) {
  const relativePath = path.relative(PROJECT_ROOT, filePath);
  const commitInfo = findBestCommitForFile(filePath);
  
  if (!commitInfo) {
    console.log(`  ⚠️  No encontrado en commits funcionales: ${relativePath}`);
    return false;
  }
  
  const referenceContent = getFileContentFromGit(commitInfo.hash, filePath);
  if (!referenceContent) {
    console.log(`  ⚠️  No se pudo obtener contenido: ${relativePath}`);
    return false;
  }
  
  const exists = fs.existsSync(filePath);
  
  if (exists && !force) {
    console.log(`  ✅ Ya existe: ${relativePath}`);
    return false;
  }
  
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
  return true;
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
  console.log('🔄 Recuperación Completa de Sección de Productos');
  console.log('='.repeat(60));
  
  // Crear directorio de backup
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  let recoveredCount = 0;
  
  // Recuperar archivos críticos faltantes
  console.log('\n📁 Recuperando archivos críticos faltantes...');
  CRITICAL_FILES.forEach(filePath => {
    const fullPath = path.join(PROJECT_ROOT, filePath);
    if (!fs.existsSync(fullPath)) {
      if (recoverFile(fullPath, true)) {
        recoveredCount++;
      }
    } else {
      console.log(`  ✅ Ya existe: ${path.relative(PROJECT_ROOT, fullPath)}`);
    }
  });
  
  // Recuperar migraciones perdidas
  console.log('\n📁 Recuperando migraciones perdidas...');
  PRODUCT_MIGRATIONS.forEach(migrationPath => {
    const fullPath = path.join(PROJECT_ROOT, migrationPath);
    if (!fs.existsSync(fullPath)) {
      if (recoverMigration(fullPath)) {
        recoveredCount++;
      }
    } else {
      console.log(`  ✅ Ya existe: ${path.relative(PROJECT_ROOT, fullPath)}`);
    }
  });
  
  console.log('\n\n📊 RESUMEN');
  console.log('='.repeat(60));
  console.log(`  - Archivos recuperados: ${recoveredCount}`);
  console.log(`  - Backup guardado en: ${BACKUP_DIR}`);
  
  if (recoveredCount > 0) {
    console.log('\n✅ Recuperación completada. Revisa los cambios y prueba la funcionalidad.');
  } else {
    console.log('\n✅ No se encontraron archivos que necesiten recuperación.');
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, recoverFile, recoverMigration, FUNCTIONAL_COMMITS };
