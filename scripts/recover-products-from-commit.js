const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
// Commits que restauraron funcionalidad de productos
const FUNCTIONAL_COMMITS = [
  { hash: '0338e2c', desc: 'Restaurar funcionalidad completa de operaciones masivas en products page' },
  { hash: '8d963e5', desc: 'Restaurar funcionalidad completa de gestión de categorías en products page' },
  { hash: 'e49441d', desc: 'Completar Fase 2 - Refactorización de componentes (Products, System, CreateWorkOrderForm) y fix de categorías' },
  { hash: 'ea40644', desc: 'Refactorizar página principal de Products usando componentes extraídos' },
];

const BACKUP_DIR = path.join(PROJECT_ROOT, '.products-recovery-backup');

// Archivos críticos a recuperar
const CRITICAL_FILES = [
  'src/app/api/admin/products/route.ts',
  'src/app/api/admin/products/[id]/route.ts',
  'src/app/api/admin/products/search/route.ts',
  'src/app/admin/products/page.tsx',
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

function recoverFile(filePath) {
  const relativePath = path.relative(PROJECT_ROOT, filePath);
  const gitPath = relativePath.replace(/\\/g, '/');
  
  // Verificar directamente con git
  let commitInfo = null;
  for (const ci of FUNCTIONAL_COMMITS) {
    try {
      execSync(
        `git show ${ci.hash}:${gitPath} > /dev/null 2>&1`,
        { encoding: 'utf8', cwd: PROJECT_ROOT, stdio: 'ignore' }
      );
      commitInfo = ci;
      break;
    } catch (error) {
      // Continue to next commit
    }
  }
  
  if (!commitInfo) {
    console.log(`  ⚠️  No encontrado en commits funcionales: ${relativePath}`);
    return false;
  }
  
  const referenceContent = getFileContentFromGit(commitInfo.hash, filePath);
  if (!referenceContent) {
    console.log(`  ⚠️  No se pudo obtener contenido: ${relativePath}`);
    return false;
  }
  
  // Crear backup
  if (fs.existsSync(filePath)) {
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

function main() {
  console.log('🔄 Recuperando funcionalidad de Productos desde commits funcionales');
  console.log('='.repeat(60));
  
  // Crear directorio de backup
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  let recoveredCount = 0;
  
  console.log('\n📁 Recuperando archivos críticos...');
  CRITICAL_FILES.forEach(filePath => {
    const fullPath = path.join(PROJECT_ROOT, filePath);
    if (recoverFile(fullPath)) {
      recoveredCount++;
    }
  });
  
  console.log('\n\n📊 RESUMEN');
  console.log('='.repeat(60));
  console.log(`  - Archivos recuperados: ${recoveredCount}`);
  console.log(`  - Backup guardado en: ${BACKUP_DIR}`);
  
  if (recoveredCount > 0) {
    console.log('\n✅ Recuperación completada. Revisa los cambios y prueba la funcionalidad.');
    console.log('⚠️  Nota: Puede que necesites ajustar el código para que funcione con los cambios de SaaS.');
  } else {
    console.log('\n✅ No se encontraron archivos para recuperar.');
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, recoverFile, FUNCTIONAL_COMMITS };
