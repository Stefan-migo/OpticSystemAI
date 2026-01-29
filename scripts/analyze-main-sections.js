// Script para analizar pérdida de código en secciones principales
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');

// Secciones principales a analizar
const MAIN_SECTIONS = {
  'POS/Caja': [
    'src/app/admin/pos',
    'src/app/admin/cash-register',
    'src/app/api/admin/pos',
    'src/app/api/admin/cash-register',
  ],
  'Trabajos (Work Orders)': [
    'src/app/admin/work-orders',
    'src/components/admin/CreateWorkOrderForm',
    'src/app/api/admin/work-orders',
  ],
  'Presupuestos (Quotes)': [
    'src/app/admin/quotes',
    'src/components/admin/CreateQuoteForm',
    'src/app/api/admin/quotes',
  ],
  'Clientes': [
    'src/app/admin/customers',
    'src/components/admin/CreatePrescriptionForm',
    'src/app/api/admin/customers',
  ],
  'Productos': [
    'src/app/admin/products',
    'src/app/api/admin/products',
  ],
};

const REFERENCE_COMMIT = 'f8e9340'; // Commit con funcionalidad completa
const CURRENT_COMMIT = execSync('git rev-parse HEAD', { encoding: 'utf8', cwd: PROJECT_ROOT }).trim();

function analyzeSection(sectionName, paths) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📦 ${sectionName.toUpperCase()}`);
  console.log('='.repeat(60));
  
  const results = {
    deleted: [],
    modified: [],
    significantLoss: [],
    new: [],
    unchanged: [],
    totalFiles: 0,
    totalLinesLost: 0,
    totalFunctionsLost: 0,
  };
  
  paths.forEach(sectionPath => {
    try {
      // Obtener archivos en ambos commits
      let filesRef = [];
      let filesCurrent = [];
      
      try {
        const refFiles = execSync(
          `git ls-tree -r --name-only ${REFERENCE_COMMIT} -- "${sectionPath}"`,
          { encoding: 'utf8', cwd: PROJECT_ROOT, stdio: 'pipe' }
        );
        filesRef = refFiles.trim().split('\n').filter(f => f && (f.endsWith('.ts') || f.endsWith('.tsx')));
      } catch (e) {
        // Sección no existe en referencia
      }
      
      try {
        const currentFiles = execSync(
          `git ls-tree -r --name-only ${CURRENT_COMMIT} -- "${sectionPath}"`,
          { encoding: 'utf8', cwd: PROJECT_ROOT, stdio: 'pipe' }
        );
        filesCurrent = currentFiles.trim().split('\n').filter(f => f && (f.endsWith('.ts') || f.endsWith('.tsx')));
      } catch (e) {
        // Sección no existe actualmente
      }
      
      const refSet = new Set(filesRef);
      const currentSet = new Set(filesCurrent);
      
      // Archivos eliminados
      filesRef.forEach(file => {
        if (!currentSet.has(file)) {
          results.deleted.push(file);
          results.totalFiles++;
        }
      });
      
      // Archivos nuevos
      filesCurrent.forEach(file => {
        if (!refSet.has(file)) {
          results.new.push(file);
        }
      });
      
      // Archivos modificados
      filesRef.forEach(file => {
        if (currentSet.has(file)) {
          try {
            const diff = execSync(
              `git diff ${REFERENCE_COMMIT} ${CURRENT_COMMIT} -- "${file}"`,
              { encoding: 'utf8', cwd: PROJECT_ROOT, stdio: 'pipe' }
            );
            
            if (diff && diff.trim().length > 0) {
              const removedLines = (diff.match(/^-[^-]/gm) || []).length;
                  const addedLines = (diff.match(/^\+[^+]/gm) || []).length;
                  const removedFunctions = (diff.match(/^-\s*(export\s+)?(function|const|class|interface|type)\s+\w+/gm) || []).length;
                  const addedFunctions = (diff.match(/^\+\s*(export\s+)?(function|const|class|interface|type)\s+\w+/gm) || []).length;
                  
                  const netLoss = removedLines - addedLines;
                  const functionLoss = removedFunctions - addedFunctions;
                  
                  if (netLoss > 0 || functionLoss > 0) {
                    results.modified.push({
                      file,
                      removedLines,
                      addedLines,
                      netLoss,
                      removedFunctions,
                      addedFunctions,
                      functionLoss,
                      hasSignificantLoss: netLoss > 50 || functionLoss > 5
                    });
                    
                    if (netLoss > 50 || functionLoss > 5) {
                      results.significantLoss.push({
                        file,
                        netLoss,
                        functionLoss,
                        removedLines,
                        addedLines,
                        removedFunctions,
                        addedFunctions
                      });
                      results.totalLinesLost += netLoss;
                      results.totalFunctionsLost += functionLoss;
                    }
                  } else {
                    results.unchanged.push(file);
                  }
                } else {
                  results.unchanged.push(file);
                }
          } catch (error) {
            // Error al analizar, continuar
          }
        }
      });
      
    } catch (error) {
      console.log(`   ⚠️  Error analizando ${sectionPath}: ${error.message}`);
    }
  });
  
  // Mostrar resultados
  if (results.deleted.length > 0) {
    console.log(`\n❌ Archivos ELIMINADOS (${results.deleted.length}):`);
    results.deleted.forEach(file => {
      console.log(`   - ${file}`);
    });
  }
  
  if (results.significantLoss.length > 0) {
    console.log(`\n⚠️  PÉRDIDA SIGNIFICATIVA (${results.significantLoss.length} archivos):`);
    results.significantLoss.forEach(({ file, netLoss, functionLoss, removedLines, addedLines, removedFunctions, addedFunctions }) => {
      console.log(`   📄 ${file}`);
      console.log(`      Líneas: ${removedLines} eliminadas, ${addedLines} agregadas (neto: -${netLoss})`);
      if (removedFunctions !== undefined && addedFunctions !== undefined) {
        console.log(`      Funciones: ${removedFunctions} eliminadas, ${addedFunctions} agregadas (neto: -${functionLoss})`);
      }
    });
  }
  
  if (results.modified.length > 0 && results.modified.length > results.significantLoss.length) {
    console.log(`\n📝 Archivos modificados (${results.modified.length - results.significantLoss.length} con cambios menores):`);
    results.modified
      .filter(m => !m.hasSignificantLoss)
      .slice(0, 5)
      .forEach(({ file, netLoss }) => {
        console.log(`   - ${file} (neto: ${netLoss > 0 ? '-' : '+'}${Math.abs(netLoss)} líneas)`);
      });
    if (results.modified.filter(m => !m.hasSignificantLoss).length > 5) {
      console.log(`   ... y ${results.modified.filter(m => !m.hasSignificantLoss).length - 5} más`);
    }
  }
  
  if (results.new.length > 0) {
    console.log(`\n✅ Archivos nuevos (${results.new.length}):`);
    results.new.slice(0, 5).forEach(file => {
      console.log(`   + ${file}`);
    });
    if (results.new.length > 5) {
      console.log(`   ... y ${results.new.length - 5} más`);
    }
  }
  
  // Resumen
  console.log(`\n📊 RESUMEN ${sectionName}:`);
  console.log(`   ❌ Eliminados: ${results.deleted.length}`);
  console.log(`   ⚠️  Pérdida significativa: ${results.significantLoss.length} archivos`);
  console.log(`   📉 Líneas perdidas: ${results.totalLinesLost}`);
  console.log(`   📉 Funciones perdidas: ${results.totalFunctionsLost}`);
  console.log(`   ✅ Nuevos: ${results.new.length}`);
  console.log(`   ✅ Sin cambios: ${results.unchanged.length}`);
  
  return results;
}

function main() {
  console.log('🔍 ANÁLISIS COMPLETO DE SECCIONES PRINCIPALES');
  console.log('='.repeat(60));
  console.log(`📅 Commit de referencia: ${REFERENCE_COMMIT.substring(0, 8)} (con funcionalidad completa)`);
  console.log(`📅 Commit actual: ${CURRENT_COMMIT.substring(0, 8)}`);
  
  const allResults = {};
  
  // Analizar cada sección
  Object.entries(MAIN_SECTIONS).forEach(([sectionName, paths]) => {
    allResults[sectionName] = analyzeSection(sectionName, paths);
  });
  
  // Resumen general
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN GENERAL');
  console.log('='.repeat(60));
  
  let totalDeleted = 0;
  let totalSignificantLoss = 0;
  let totalLinesLost = 0;
  let totalFunctionsLost = 0;
  
  Object.entries(allResults).forEach(([sectionName, results]) => {
    totalDeleted += results.deleted.length;
    totalSignificantLoss += results.significantLoss.length;
    totalLinesLost += results.totalLinesLost;
    totalFunctionsLost += results.totalFunctionsLost;
    
    if (results.deleted.length > 0 || results.significantLoss.length > 0) {
      console.log(`\n${sectionName}:`);
      if (results.deleted.length > 0) {
        console.log(`   ❌ ${results.deleted.length} archivos eliminados`);
      }
      if (results.significantLoss.length > 0) {
        console.log(`   ⚠️  ${results.significantLoss.length} archivos con pérdida significativa`);
        console.log(`   📉 ${results.totalLinesLost} líneas perdidas`);
        console.log(`   📉 ${results.totalFunctionsLost} funciones perdidas`);
      }
    }
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 TOTALES');
  console.log('='.repeat(60));
  console.log(`❌ Archivos eliminados: ${totalDeleted}`);
  console.log(`⚠️  Archivos con pérdida significativa: ${totalSignificantLoss}`);
  console.log(`📉 Total líneas perdidas: ${totalLinesLost}`);
  console.log(`📉 Total funciones perdidas: ${totalFunctionsLost}`);
  
  if (totalDeleted > 0 || totalSignificantLoss > 0) {
    console.log('\n💡 RECOMENDACIÓN:');
    console.log('   Revisa los archivos identificados y recupera la funcionalidad desde:');
    console.log(`   git show ${REFERENCE_COMMIT}:ruta/archivo.tsx > ruta/archivo.tsx`);
  } else {
    console.log('\n✅ No se encontró pérdida significativa de código');
  }
  
  // Guardar reporte
  const reportPath = path.join(PROJECT_ROOT, '.recovery-backup', 'sections-analysis.json');
  if (!fs.existsSync(path.dirname(reportPath))) {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  }
  
  fs.writeFileSync(
    reportPath,
    JSON.stringify({
      referenceCommit: REFERENCE_COMMIT,
      currentCommit: CURRENT_COMMIT,
      timestamp: new Date().toISOString(),
      sections: allResults,
      summary: {
        totalDeleted,
        totalSignificantLoss,
        totalLinesLost,
        totalFunctionsLost
      }
    }, null, 2)
  );
  
  console.log(`\n📄 Reporte guardado en: ${reportPath}`);
}

if (require.main === module) {
  main();
}

module.exports = { analyzeSection, MAIN_SECTIONS };
