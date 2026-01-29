const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const TARGET_FILE = 'src/app/admin/products/edit/[id]/page.tsx';
const BACKUP_DIR = path.join(PROJECT_ROOT, '.products-recovery-backup');

// Commits que pueden tener versiones funcionales
const FUNCTIONAL_COMMITS = [
  { hash: '0338e2c', desc: 'Restaurar funcionalidad completa de operaciones masivas en products page' },
  { hash: '8d963e5', desc: 'Restaurar funcionalidad completa de gestión de categorías en products page' },
  { hash: 'e49441d', desc: 'Completar Fase 2 - Refactorización de componentes (Products, System, CreateWorkOrderForm) y fix de categorías' },
  { hash: 'ea40644', desc: 'Refactorizar página principal de Products usando componentes extraídos' },
  { hash: '047ac80', desc: 'Corregir errores críticos y mejoras de código' },
  { hash: 'e6ed01a', desc: 'Sistema completo de gestión óptica' },
  { hash: 'f8e9340', desc: 'Corregir paths de importación en tests de integración' },
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
    const gitPath = filePath.replace(/\\/g, '/');
    execSync(
      `git show ${commit}:${gitPath} > /dev/null 2>&1`,
      { encoding: 'utf8', cwd: PROJECT_ROOT, stdio: 'ignore' }
    );
    return true;
  } catch (error) {
    return false;
  }
}

function getFileContentFromGit(commit, filePath) {
  try {
    const gitPath = filePath.replace(/\\/g, '/');
    const content = execSync(
      `git show ${commit}:${gitPath}`,
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

function analyzeFile(filePath) {
  const relativePath = path.relative(PROJECT_ROOT, filePath);
  const gitPath = relativePath.replace(/\\/g, '/');
  
  console.log(`\n📄 Analizando: ${relativePath}`);
  console.log('='.repeat(60));
  
  if (!fs.existsSync(filePath)) {
    console.log('  ❌ Archivo no existe actualmente');
    return null;
  }
  
  const currentContent = fs.readFileSync(filePath, 'utf8');
  const current = countLinesAndFunctions(currentContent);
  
  console.log(`  📊 Versión actual:`);
  console.log(`     Líneas: ${current.lines}`);
  console.log(`     Funciones: ${current.functions}`);
  
  // Buscar la versión con más funcionalidad
  let bestVersion = null;
  let bestStats = { lines: 0, functions: 0 };
  
  console.log(`\n  🔍 Buscando en commits funcionales...`);
  
  for (const commitInfo of FUNCTIONAL_COMMITS) {
    if (fileExistsInGit(commitInfo.hash, filePath)) {
      const content = getFileContentFromGit(commitInfo.hash, filePath);
      if (content) {
        const stats = countLinesAndFunctions(content);
        console.log(`     ${commitInfo.hash}: ${stats.lines} líneas, ${stats.functions} funciones`);
        
        // Preferir versión con más líneas y funciones
        if (stats.lines > bestStats.lines || 
            (stats.lines === bestStats.lines && stats.functions > bestStats.functions)) {
          bestVersion = {
            commit: commitInfo.hash,
            desc: commitInfo.desc,
            content,
            stats,
          };
          bestStats = stats;
        }
      }
    }
  }
  
  if (bestVersion) {
    console.log(`\n  ✅ Mejor versión encontrada: ${bestVersion.commit}`);
    console.log(`     ${bestVersion.desc}`);
    console.log(`     Líneas: ${bestVersion.stats.lines} (actual: ${current.lines})`);
    console.log(`     Funciones: ${bestVersion.stats.functions} (actual: ${current.functions})`);
    
    const linesDiff = bestVersion.stats.lines - current.lines;
    const functionsDiff = bestVersion.stats.functions - current.functions;
    
    if (linesDiff > 50 || functionsDiff > 5 || (linesDiff > 0 && linesDiff / bestVersion.stats.lines > 0.1)) {
      console.log(`\n  ⚠️  Pérdida significativa detectada:`);
      console.log(`     Líneas perdidas: ${linesDiff}`);
      console.log(`     Funciones perdidas: ${functionsDiff}`);
      return {
        shouldRecover: true,
        bestVersion,
        current,
      };
    } else {
      console.log(`\n  ✅ No hay pérdida significativa de funcionalidad`);
      return {
        shouldRecover: false,
        bestVersion,
        current,
      };
    }
  } else {
    console.log(`\n  ⚠️  No se encontró versión en commits funcionales`);
    return null;
  }
}

function recoverFile(filePath, commit, content) {
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
  fs.writeFileSync(filePath, content, 'utf8');
  const relativePath = path.relative(PROJECT_ROOT, filePath);
  console.log(`  ✅ Recuperado: ${relativePath}`);
}

function main() {
  console.log('🔄 Analizando y recuperando formulario de edición de productos');
  console.log('='.repeat(60));
  
  // Crear directorio de backup
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  const fullPath = path.join(PROJECT_ROOT, TARGET_FILE);
  const analysis = analyzeFile(fullPath);
  
  if (!analysis) {
    console.log('\n❌ No se pudo analizar el archivo');
    return;
  }
  
  if (analysis.shouldRecover) {
    console.log('\n\n🔄 RECUPERANDO ARCHIVO...');
    console.log('='.repeat(60));
    recoverFile(fullPath, analysis.bestVersion.commit, analysis.bestVersion.content);
    
    console.log('\n\n📊 RESUMEN');
    console.log('='.repeat(60));
    console.log(`  - Archivo recuperado desde: ${analysis.bestVersion.commit}`);
    console.log(`  - ${analysis.bestVersion.desc}`);
    console.log(`  - Líneas recuperadas: ${analysis.bestVersion.stats.lines - analysis.current.lines}`);
    console.log(`  - Funciones recuperadas: ${analysis.bestVersion.stats.functions - analysis.current.functions}`);
    console.log(`  - Backup guardado en: ${BACKUP_DIR}`);
    console.log('\n✅ Recuperación completada. Revisa los cambios y prueba la funcionalidad.');
    console.log('⚠️  Nota: Puede que necesites ajustar el código para que funcione con los cambios de SaaS.');
  } else {
    console.log('\n✅ No se necesita recuperación - la versión actual parece estar completa.');
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, analyzeFile, recoverFile };
