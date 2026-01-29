const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const REFERENCE_COMMIT = 'f8e9340ebf1b01ec18629c4f2699f9a0afd54d37'; // Commit antes de Phase SaaS 0
const BACKUP_DIR = path.join(PROJECT_ROOT, '.final-recovery-backup');

// Todas las secciones del sistema
const ALL_SECTIONS = [
  // Frontend - Admin Sections
  { name: 'Productos', paths: ['src/app/admin/products', 'src/components/admin/products'], type: 'frontend' },
  { name: 'Clientes', paths: ['src/app/admin/customers', 'src/components/admin/customers'], type: 'frontend' },
  { name: 'POS y Caja', paths: ['src/app/admin/pos', 'src/app/admin/cash-register'], type: 'frontend' },
  { name: 'Trabajos', paths: ['src/app/admin/work-orders', 'src/components/admin/CreateWorkOrderForm'], type: 'frontend' },
  { name: 'Presupuestos', paths: ['src/app/admin/quotes', 'src/components/admin/CreateQuoteForm'], type: 'frontend' },
  { name: 'Citas y Agendas', paths: ['src/app/admin/appointments'], type: 'frontend' },
  { name: 'Analíticas', paths: ['src/app/admin/analytics'], type: 'frontend' },
  { name: 'Administradores', paths: ['src/app/admin/admin-users'], type: 'frontend' },
  { name: 'Sucursales', paths: ['src/app/admin/branches'], type: 'frontend' },
  { name: 'Sistema', paths: ['src/app/admin/system'], type: 'frontend' },
  { name: 'Soporte', paths: ['src/app/admin/support'], type: 'frontend' },
  
  // API Routes
  { name: 'API Productos', paths: ['src/app/api/admin/products', 'src/app/api/categories'], type: 'api' },
  { name: 'API Clientes', paths: ['src/app/api/admin/customers'], type: 'api' },
  { name: 'API POS y Caja', paths: ['src/app/api/admin/orders', 'src/app/api/admin/pos'], type: 'api' },
  { name: 'API Trabajos', paths: ['src/app/api/admin/work-orders'], type: 'api' },
  { name: 'API Presupuestos', paths: ['src/app/api/admin/quotes'], type: 'api' },
  { name: 'API Citas', paths: ['src/app/api/admin/appointments', 'src/app/api/admin/customers/[id]/appointments'], type: 'api' },
  { name: 'API Analíticas', paths: ['src/app/api/admin/analytics'], type: 'api' },
  { name: 'API Administradores', paths: ['src/app/api/admin/admin-users'], type: 'api' },
  { name: 'API Sucursales', paths: ['src/app/api/admin/branches'], type: 'api' },
  { name: 'API Sistema y Soporte', paths: ['src/app/api/admin/support', 'src/app/api/admin/settings'], type: 'api' },
  
  // Hooks y Utilidades
  { name: 'Hooks', paths: ['src/hooks'], type: 'hooks' },
  { name: 'Utilidades', paths: ['src/lib'], type: 'utils' },
  
  // Componentes Admin
  { name: 'Componentes Admin', paths: ['src/components/admin'], type: 'components' },
  
  // Migraciones
  { name: 'Migraciones', paths: ['supabase/migrations'], type: 'migrations', isMigration: true },
];

// Commits funcionales para recuperación
const FUNCTIONAL_COMMITS = [
  { hash: 'eab64b4', desc: 'Completar Fase 3 - Mejoras de Seguridad' },
  { hash: 'e49441d', desc: 'Completar Fase 2 - Refactorización de componentes' },
  { hash: '047ac80', desc: 'Corregir errores críticos y mejoras de código' },
  { hash: 'e6ed01a', desc: 'Sistema completo de gestión óptica' },
  { hash: 'f8e9340', desc: 'Corregir paths de importación en tests' },
];

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
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.sql')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
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

function analyzeSection(section) {
  const deletedFiles = [];
  const modifiedFiles = [];
  const currentFiles = [];
  
  // Obtener todos los archivos actuales
  section.paths.forEach(sectionPath => {
    const fullPath = path.join(PROJECT_ROOT, sectionPath);
    if (fs.existsSync(fullPath)) {
      const files = getAllFilesInDirectory(fullPath);
      currentFiles.push(...files);
    }
  });
  
  // Analizar cada archivo actual
  currentFiles.forEach(filePath => {
    const relativePath = path.relative(PROJECT_ROOT, filePath);
    
    if (fileExistsInGit(REFERENCE_COMMIT, filePath)) {
      const currentContent = fs.readFileSync(filePath, 'utf8');
      const referenceContent = getFileContentFromGit(REFERENCE_COMMIT, filePath);
      
      if (referenceContent) {
        const current = countLinesAndFunctions(currentContent);
        const reference = countLinesAndFunctions(referenceContent);
        
        const linesLost = reference.lines - current.lines;
        const functionsLost = reference.functions - current.functions;
        
        if (linesLost > 50 || functionsLost > 5 || (linesLost > 0 && linesLost / reference.lines > 0.2)) {
          modifiedFiles.push({
            path: relativePath,
            currentLines: current.lines,
            referenceLines: reference.lines,
            linesLost,
            currentFunctions: current.functions,
            referenceFunctions: reference.functions,
            functionsLost,
          });
        }
      }
    }
  });
  
  // Buscar archivos eliminados
  try {
    const allFilesInRef = execSync(
      `git ls-tree -r --name-only ${REFERENCE_COMMIT}`,
      { encoding: 'utf8', cwd: PROJECT_ROOT }
    ).split('\n').filter(Boolean);
    
    section.paths.forEach(sectionPath => {
      const fullPath = path.join(PROJECT_ROOT, sectionPath);
      const relativePath = path.relative(PROJECT_ROOT, fullPath).replace(/\\/g, '/');
      
      allFilesInRef.forEach(refFile => {
        if (refFile.startsWith(relativePath)) {
          // Si es migración, verificar que sea relevante
          if (section.isMigration) {
            const fileName = path.basename(refFile).toLowerCase();
            // Incluir todas las migraciones
          }
          
          const currentFilePath = path.join(PROJECT_ROOT, refFile);
          if (!fs.existsSync(currentFilePath)) {
            deletedFiles.push(refFile);
          }
        }
      });
    });
  } catch (error) {
    console.error(`Error buscando archivos eliminados en ${section.name}: ${error.message}`);
  }
  
  return {
    name: section.name,
    type: section.type,
    deletedFiles,
    modifiedFiles,
    totalFiles: currentFiles.length,
  };
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
  const commitInfo = findBestCommitForFile(filePath);
  
  if (!commitInfo) {
    // Buscar en todo el historial
    try {
      const allCommits = execSync(
        `git log --all --oneline --format="%H" -- "${filePath.replace(/\\/g, '/')}"`,
        { encoding: 'utf8', cwd: PROJECT_ROOT }
      ).trim().split('\n').filter(Boolean);
      
      if (allCommits.length > 0) {
        const commit = allCommits[0];
        const content = getFileContentFromGit(commit, filePath);
        if (content) {
          const dir = path.dirname(filePath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          fs.writeFileSync(filePath, content, 'utf8');
          return { success: true, commit: commit, desc: 'Encontrado en historial' };
        }
      }
    } catch (error) {
      // Continue
    }
    return { success: false, reason: 'No encontrado en commits funcionales ni historial' };
  }
  
  const referenceContent = getFileContentFromGit(commitInfo.hash, filePath);
  if (!referenceContent) {
    return { success: false, reason: 'No se pudo obtener contenido' };
  }
  
  // Crear backup si existe
  if (fs.existsSync(filePath)) {
    const backupPath = path.join(BACKUP_DIR, relativePath);
    const backupDir = path.dirname(backupPath);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    fs.copyFileSync(filePath, backupPath);
  }
  
  // Crear directorio si no existe
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Recuperar archivo
  fs.writeFileSync(filePath, referenceContent, 'utf8');
  return { success: true, commit: commitInfo.hash, desc: commitInfo.desc };
}

function main() {
  console.log('🔍 SALVATAJE GENERAL FINAL - Análisis Exhaustivo');
  console.log(`📌 Commit de referencia: ${REFERENCE_COMMIT}`);
  console.log('='.repeat(80));
  
  // Crear directorio de backup
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  const results = ALL_SECTIONS.map(section => analyzeSection(section));
  
  console.log('\n\n📊 RESUMEN DE ANÁLISIS');
  console.log('='.repeat(80));
  
  let totalDeleted = 0;
  let totalModified = 0;
  const allDeletedFiles = [];
  const allModifiedFiles = [];
  
  results.forEach(result => {
    console.log(`\n${result.name} (${result.type}):`);
    console.log(`  - Archivos actuales: ${result.totalFiles}`);
    console.log(`  - Archivos eliminados: ${result.deletedFiles.length}`);
    console.log(`  - Archivos con pérdida significativa: ${result.modifiedFiles.length}`);
    
    if (result.deletedFiles.length > 0) {
      result.deletedFiles.forEach(file => {
        allDeletedFiles.push({ section: result.name, file });
      });
    }
    
    if (result.modifiedFiles.length > 0) {
      result.modifiedFiles.forEach(file => {
        allModifiedFiles.push({ section: result.name, ...file });
      });
    }
    
    totalDeleted += result.deletedFiles.length;
    totalModified += result.modifiedFiles.length;
  });
  
  console.log(`\n\n📈 TOTALES GENERALES:`);
  console.log(`  - Archivos eliminados: ${totalDeleted}`);
  console.log(`  - Archivos con pérdida significativa: ${totalModified}`);
  
  // Mostrar archivos eliminados
  if (allDeletedFiles.length > 0) {
    console.log(`\n\n❌ ARCHIVOS ELIMINADOS ENCONTRADOS:`);
    console.log('='.repeat(80));
    allDeletedFiles.forEach(({ section, file }) => {
      console.log(`  [${section}] ${file}`);
    });
  }
  
  // Mostrar archivos con pérdida significativa
  if (allModifiedFiles.length > 0) {
    console.log(`\n\n⚠️  ARCHIVOS CON PÉRDIDA SIGNIFICATIVA:`);
    console.log('='.repeat(80));
    allModifiedFiles
      .sort((a, b) => b.linesLost - a.linesLost)
      .slice(0, 20) // Top 20
      .forEach(file => {
        console.log(`  [${file.section}] ${file.path}`);
        console.log(`    Líneas: ${file.referenceLines} → ${file.currentLines} (perdidas: ${file.linesLost})`);
        console.log(`    Funciones: ${file.referenceFunctions} → ${file.currentFunctions} (perdidas: ${file.functionsLost})`);
      });
  }
  
  // Intentar recuperar archivos eliminados
  let recoveredCount = 0;
  if (allDeletedFiles.length > 0) {
    console.log(`\n\n🔄 INTENTANDO RECUPERAR ARCHIVOS ELIMINADOS...`);
    console.log('='.repeat(80));
    
    allDeletedFiles.forEach(({ section, file }) => {
      const fullPath = path.join(PROJECT_ROOT, file);
      const result = recoverFile(fullPath);
      
      if (result.success) {
        console.log(`  ✅ Recuperado: ${file}`);
        console.log(`     Desde: ${result.commit} - ${result.desc}`);
        recoveredCount++;
      } else {
        console.log(`  ⚠️  No recuperado: ${file}`);
        console.log(`     Razón: ${result.reason}`);
      }
    });
  }
  
  // Guardar resultados
  const outputPath = path.join(PROJECT_ROOT, '.final-recovery-analysis.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    summary: {
      totalDeleted,
      totalModified,
      recoveredCount,
    },
    deletedFiles: allDeletedFiles,
    modifiedFiles: allModifiedFiles,
    sections: results,
  }, null, 2));
  
  console.log(`\n\n📊 RESUMEN FINAL:`);
  console.log('='.repeat(80));
  console.log(`  - Archivos eliminados encontrados: ${totalDeleted}`);
  console.log(`  - Archivos recuperados: ${recoveredCount}`);
  console.log(`  - Archivos con pérdida significativa: ${totalModified}`);
  console.log(`  - Backup guardado en: ${BACKUP_DIR}`);
  console.log(`  - Análisis guardado en: ${outputPath}`);
  
  if (recoveredCount > 0) {
    console.log(`\n✅ Se recuperaron ${recoveredCount} archivos. Revisa los cambios.`);
  } else if (totalDeleted === 0) {
    console.log(`\n✅ No se encontraron archivos eliminados. El sistema está completo.`);
  } else {
    console.log(`\n⚠️  Se encontraron ${totalDeleted} archivos eliminados pero no se pudieron recuperar.`);
  }
  
  return {
    totalDeleted,
    totalModified,
    recoveredCount,
    deletedFiles: allDeletedFiles,
    modifiedFiles: allModifiedFiles,
  };
}

if (require.main === module) {
  main();
}

module.exports = { main, ALL_SECTIONS, REFERENCE_COMMIT };
