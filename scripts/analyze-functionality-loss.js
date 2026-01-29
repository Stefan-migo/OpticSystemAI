// Script para analizar pérdida de funcionalidad comparando commits específicos
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');

// Commits conocidos que tenían funcionalidad
const KNOWN_GOOD_COMMITS = {
  'f8e9340': 'fix: Corregir paths de importación en tests - tenía useLensPriceCalculation',
  'f136b6c': 'Antes del merge de Phase SaaS 0',
};

// Archivos críticos a analizar
const CRITICAL_FILES = [
  'src/app/admin/pos/page.tsx',
  'src/app/admin/products/page.tsx',
  'src/app/admin/cash-register/page.tsx',
  'src/components/admin/CreateWorkOrderForm/index.tsx',
  'src/components/admin/CreateQuoteForm.tsx',
];

function analyzeFile(filePath, commit1, commit2) {
  try {
    // Verificar si el archivo existe en ambos commits
    const exists1 = execSync(
      `git cat-file -e ${commit1}:${filePath} 2>&1`,
      { encoding: 'utf8', cwd: PROJECT_ROOT, stdio: 'pipe' }
    );
    
    const exists2 = execSync(
      `git cat-file -e ${commit2}:${filePath} 2>&1`,
      { encoding: 'utf8', cwd: PROJECT_ROOT, stdio: 'pipe' }
    );
    
    // Obtener diff
    const diff = execSync(
      `git diff ${commit1} ${commit2} -- ${filePath}`,
      { encoding: 'utf8', cwd: PROJECT_ROOT, stdio: 'pipe' }
    );
    
    if (!diff || diff.trim().length === 0) {
      return { status: 'unchanged' };
    }
    
    // Analizar diff
    const removedLines = (diff.match(/^-[^-]/gm) || []).length;
    const addedLines = (diff.match(/^\+[^+]/gm) || []).length;
    const removedFunctions = (diff.match(/^-\s*(export\s+)?(function|const|class|interface|type)\s+\w+/gm) || []).length;
    const addedFunctions = (diff.match(/^\+\s*(export\s+)?(function|const|class|interface|type)\s+\w+/gm) || []).length;
    
    // Buscar imports eliminados
    const removedImports = (diff.match(/^-\s*import.*from/gm) || []).length;
    const addedImports = (diff.match(/^\+\s*import.*from/gm) || []).length;
    
    return {
      status: 'modified',
      stats: {
        removedLines,
        addedLines,
        removedFunctions,
        addedFunctions,
        removedImports,
        addedImports,
        netLoss: removedLines - addedLines,
        functionLoss: removedFunctions - addedFunctions
      },
      hasSignificantLoss: (removedLines > addedLines * 1.5) || (removedFunctions > addedFunctions * 1.5)
    };
  } catch (error) {
    // Archivo no existe en uno de los commits
    try {
      const exists1 = execSync(
        `git cat-file -e ${commit1}:${filePath} 2>&1`,
        { encoding: 'utf8', cwd: PROJECT_ROOT, stdio: 'pipe' }
      );
      return { status: 'deleted', from: commit1 };
    } catch {
      try {
        const exists2 = execSync(
          `git cat-file -e ${commit2}:${filePath} 2>&1`,
          { encoding: 'utf8', cwd: PROJECT_ROOT, stdio: 'pipe' }
        );
        return { status: 'new', from: commit2 };
      } catch {
        return { status: 'not_found' };
      }
    }
  }
}

function main() {
  console.log('🔍 Analizando pérdida de funcionalidad...\n');
  
  const currentCommit = execSync('git rev-parse HEAD', { encoding: 'utf8', cwd: PROJECT_ROOT }).trim();
  const referenceCommit = 'f8e9340'; // Commit conocido con funcionalidad
  
  console.log(`📊 Comparando:`);
  console.log(`   Referencia: ${referenceCommit.substring(0, 8)} (con funcionalidad)`);
  console.log(`   Actual: ${currentCommit.substring(0, 8)}\n`);
  
  const results = [];
  
  CRITICAL_FILES.forEach(file => {
    console.log(`📄 Analizando: ${file}`);
    const analysis = analyzeFile(file, referenceCommit, currentCommit);
    results.push({ file, ...analysis });
    
    if (analysis.status === 'deleted') {
      console.log(`   ❌ ELIMINADO desde ${referenceCommit}`);
    } else if (analysis.status === 'modified' && analysis.hasSignificantLoss) {
      console.log(`   ⚠️  PÉRDIDA SIGNIFICATIVA:`);
      console.log(`      - Líneas: ${analysis.stats.removedLines} eliminadas, ${analysis.stats.addedLines} agregadas (neto: ${analysis.stats.netLoss})`);
      console.log(`      - Funciones: ${analysis.stats.removedFunctions} eliminadas, ${analysis.stats.addedFunctions} agregadas (neto: ${analysis.stats.functionLoss})`);
      console.log(`      - Imports: ${analysis.stats.removedImports} eliminados, ${analysis.stats.addedImports} agregados`);
    } else if (analysis.status === 'modified') {
      console.log(`   ✅ Modificado (cambios balanceados)`);
    } else if (analysis.status === 'unchanged') {
      console.log(`   ✅ Sin cambios`);
    }
    console.log('');
  });
  
  // Resumen
  const deleted = results.filter(r => r.status === 'deleted');
  const significantLoss = results.filter(r => r.status === 'modified' && r.hasSignificantLoss);
  
  console.log('='.repeat(60));
  console.log('📊 RESUMEN');
  console.log('='.repeat(60));
  console.log(`❌ Archivos eliminados: ${deleted.length}`);
  console.log(`⚠️  Archivos con pérdida significativa: ${significantLoss.length}`);
  console.log(`✅ Archivos sin problemas: ${results.length - deleted.length - significantLoss.length}`);
  
  if (deleted.length > 0 || significantLoss.length > 0) {
    console.log('\n💡 RECOMENDACIÓN:');
    console.log('   Revisa estos archivos y recupera la funcionalidad desde el commit de referencia.');
  }
}

if (require.main === module) {
  main();
}

module.exports = { analyzeFile };
