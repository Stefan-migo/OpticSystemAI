const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const REFERENCE_COMMIT = 'f8e9340ebf1b01ec18629c4f2699f9a0afd54d37'; // Commit antes de Phase SaaS 0

// Secciones relacionadas con Administradores y Sucursales
const SECTIONS = [
  {
    name: 'Administradores - Frontend',
    paths: [
      'src/app/admin/admin-users',
      'src/components/admin/admin-users',
      'src/components/admin/CreateAdminUserForm',
    ],
  },
  {
    name: 'Administradores - API Routes',
    paths: [
      'src/app/api/admin/admin-users',
    ],
  },
  {
    name: 'Sucursales - Frontend',
    paths: [
      'src/app/admin/branches',
      'src/components/admin/branches',
      'src/components/admin/CreateBranchForm',
    ],
  },
  {
    name: 'Sucursales - API Routes',
    paths: [
      'src/app/api/admin/branches',
    ],
  },
  {
    name: 'Administradores y Sucursales - Migraciones',
    paths: [
      'supabase/migrations',
    ],
    isMigration: true,
  },
  {
    name: 'Administradores y Sucursales - Hooks y Utilidades',
    paths: [
      'src/hooks/useBranch',
      'src/lib/branches',
      'src/lib/api/branch-middleware',
    ],
  },
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
    } else {
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
  console.log(`\n📦 Analizando sección: ${section.name}`);
  console.log('='.repeat(60));
  
  const deletedFiles = [];
  const modifiedFiles = [];
  const currentFiles = [];
  
  // Obtener todos los archivos actuales en las rutas
  section.paths.forEach(sectionPath => {
    const fullPath = path.join(PROJECT_ROOT, sectionPath);
    if (fs.existsSync(fullPath)) {
      const files = getAllFilesInDirectory(fullPath);
      
      // Si es migración, filtrar solo las relacionadas con admin-users o branches
      if (section.isMigration) {
        const relevantFiles = files.filter(file => {
          const fileName = path.basename(file).toLowerCase();
          const content = fs.readFileSync(file, 'utf8');
          return fileName.includes('admin') || 
                 fileName.includes('branch') ||
                 fileName.includes('sucursal') ||
                 content.includes('admin_users') ||
                 content.includes('admin_branch_access') ||
                 content.includes('branches') ||
                 content.includes('CREATE TABLE.*admin') ||
                 content.includes('CREATE TABLE.*branch');
        });
        currentFiles.push(...relevantFiles);
      } else {
        currentFiles.push(...files);
      }
    }
  });
  
  // Analizar cada archivo actual
  currentFiles.forEach(filePath => {
    const relativePath = path.relative(PROJECT_ROOT, filePath);
    
    // Verificar si existe en el commit de referencia
    if (fileExistsInGit(REFERENCE_COMMIT, filePath)) {
      const currentContent = fs.readFileSync(filePath, 'utf8');
      const referenceContent = getFileContentFromGit(REFERENCE_COMMIT, filePath);
      
      if (referenceContent) {
        const current = countLinesAndFunctions(currentContent);
        const reference = countLinesAndFunctions(referenceContent);
        
        const linesLost = reference.lines - current.lines;
        const functionsLost = reference.functions - current.functions;
        
        // Si se perdió más del 20% de líneas o más de 5 funciones, marcar como significativo
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
  
  // Buscar archivos que existían en el commit de referencia pero no ahora
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
          // Si es migración, filtrar solo las relacionadas con admin-users o branches
          if (section.isMigration) {
            const fileName = path.basename(refFile).toLowerCase();
            if (!fileName.includes('admin') && 
                !fileName.includes('branch') &&
                !fileName.includes('sucursal') &&
                !refFile.toLowerCase().includes('admin') &&
                !refFile.toLowerCase().includes('branch')) {
              return; // Skip non-relevant migrations
            }
          }
          
          const currentFilePath = path.join(PROJECT_ROOT, refFile);
          if (!fs.existsSync(currentFilePath)) {
            deletedFiles.push(refFile);
          }
        }
      });
    });
  } catch (error) {
    console.error(`Error buscando archivos eliminados: ${error.message}`);
  }
  
  return {
    name: section.name,
    deletedFiles,
    modifiedFiles,
    totalFiles: currentFiles.length,
  };
}

function main() {
  console.log('🔍 Análisis Exhaustivo de Secciones: Administradores y Sucursales');
  console.log(`📌 Commit de referencia: ${REFERENCE_COMMIT}`);
  console.log('='.repeat(60));
  
  const results = SECTIONS.map(section => analyzeSection(section));
  
  console.log('\n\n📊 RESUMEN DE ANÁLISIS');
  console.log('='.repeat(60));
  
  let totalDeleted = 0;
  let totalModified = 0;
  
  results.forEach(result => {
    console.log(`\n${result.name}:`);
    console.log(`  - Archivos actuales: ${result.totalFiles}`);
    console.log(`  - Archivos eliminados: ${result.deletedFiles.length}`);
    console.log(`  - Archivos con pérdida significativa: ${result.modifiedFiles.length}`);
    
    if (result.deletedFiles.length > 0) {
      console.log(`\n  ❌ Archivos eliminados:`);
      result.deletedFiles.forEach(file => {
        console.log(`     - ${file}`);
      });
    }
    
    if (result.modifiedFiles.length > 0) {
      console.log(`\n  ⚠️  Archivos con pérdida significativa:`);
      result.modifiedFiles
        .sort((a, b) => b.linesLost - a.linesLost)
        .forEach(file => {
          console.log(`     - ${file.path}`);
          console.log(`       Líneas: ${file.referenceLines} → ${file.currentLines} (perdidas: ${file.linesLost})`);
          console.log(`       Funciones: ${file.referenceFunctions} → ${file.currentFunctions} (perdidas: ${file.functionsLost})`);
        });
    }
    
    totalDeleted += result.deletedFiles.length;
    totalModified += result.modifiedFiles.length;
  });
  
  console.log(`\n\n📈 TOTALES:`);
  console.log(`  - Archivos eliminados: ${totalDeleted}`);
  console.log(`  - Archivos con pérdida significativa: ${totalModified}`);
  
  // Guardar resultados en JSON
  const outputPath = path.join(PROJECT_ROOT, '.admin-branches-analysis.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Resultados guardados en: ${outputPath}`);
  
  return results;
}

if (require.main === module) {
  main();
}

module.exports = { main, SECTIONS, REFERENCE_COMMIT };
