const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const REFERENCE_COMMIT = 'f8e9340ebf1b01ec18629c4f2699f9a0afd54d37';
const BACKUP_DIR = path.join(PROJECT_ROOT, '.products-recovery-backup');

// Archivos críticos a verificar y potencialmente recuperar
const CRITICAL_FILES = [
  // API Routes - Productos
  'src/app/api/admin/products/route.ts',
  'src/app/api/admin/products/[id]/route.ts',
  'src/app/api/admin/products/search/route.ts',
  'src/app/api/admin/products/bulk/route.ts',
  
  // API Routes - Categorías
  'src/app/api/admin/categories/route.ts',
  'src/app/api/admin/categories/[id]/route.ts',
  
  // API Routes - Lens Families
  'src/app/api/admin/lens-families/route.ts',
  'src/app/api/admin/lens-families/[id]/route.ts',
  
  // API Routes - Lens Matrices
  'src/app/api/admin/lens-matrices/route.ts',
  'src/app/api/admin/lens-matrices/[id]/route.ts',
  'src/app/api/admin/lens-matrices/calculate/route.ts',
  
  // Frontend - Página principal de productos
  'src/app/admin/products/page.tsx',
  
  // Hooks
  'src/hooks/useProducts.ts',
  'src/hooks/useProductStats.ts',
  'src/hooks/useCategories.ts',
  
  // Components
  'src/components/admin/products',
  'src/components/admin/categories',
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
    const relativePath = path.relative(PROJECT_ROOT, filePath);
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
    const relativePath = path.relative(PROJECT_ROOT, filePath);
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
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
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

function main() {
  console.log('🔄 Recuperando funcionalidad de Productos');
  console.log(`📌 Commit de referencia: ${REFERENCE_COMMIT}`);
  console.log('='.repeat(60));
  
  // Crear directorio de backup
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  let recoveredCount = 0;
  let checkedCount = 0;
  
  // Recuperar archivos críticos individuales
  console.log('\n📁 Recuperando archivos críticos...');
  CRITICAL_FILES.forEach(filePath => {
    const fullPath = path.join(PROJECT_ROOT, filePath);
    
    // Si es un directorio, obtener todos los archivos
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
      const files = getAllFilesInDirectory(fullPath);
      files.forEach(file => {
        checkedCount++;
        if (recoverFile(file)) {
          recoveredCount++;
        }
      });
    } else {
      checkedCount++;
      if (recoverFile(fullPath)) {
        recoveredCount++;
      }
    }
  });
  
  // Buscar archivos adicionales en directorios de productos
  console.log('\n📁 Buscando archivos adicionales en sección de productos...');
  const productDirs = [
    'src/app/admin/products',
    'src/app/api/admin/products',
    'src/app/api/admin/categories',
    'src/app/api/admin/lens-families',
    'src/app/api/admin/lens-matrices',
  ];
  
  productDirs.forEach(dir => {
    const fullPath = path.join(PROJECT_ROOT, dir);
    if (fs.existsSync(fullPath)) {
      const files = getAllFilesInDirectory(fullPath);
      files.forEach(file => {
        // Solo verificar si no está en CRITICAL_FILES
        const relativePath = path.relative(PROJECT_ROOT, file);
        const isCritical = CRITICAL_FILES.some(cf => {
          const criticalPath = path.join(PROJECT_ROOT, cf);
          return file === criticalPath || file.startsWith(criticalPath + path.sep);
        });
        
        if (!isCritical) {
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

if (require.main === module) {
  main();
}

module.exports = { main, recoverFile, REFERENCE_COMMIT };
