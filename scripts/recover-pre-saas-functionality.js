// scripts/recover-pre-saas-functionality.js
// Script para recuperar funcionalidad antes del Phase 0 de SaaS
// Evalúa diffs y selecciona la versión con mejor funcionalidad

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const PHASE_0_DATE = '2026-01-27'; // Fecha de inicio del Phase 0 según docs
const BACKUP_DIR = path.join(PROJECT_ROOT, '.recovery-backup');

// Directorios y archivos que NO debemos tocar (SaaS y Testing)
const PRESERVE_PATTERNS = [
  /supabase\/migrations\/20260128/, // Migraciones de SaaS
  /supabase\/migrations\/20260129/, // Migraciones recientes
  /src\/__tests__/, // Tests
  /vitest\.config/, // Config de testing
  /\.test\./, // Archivos de test
  /\.spec\./, // Archivos de spec
  /organizations/, // Tablas de SaaS
  /subscriptions/, // Tablas de SaaS
  /subscription_tiers/, // Tablas de SaaS
  /multi.?tenant/i, // Cualquier cosa multi-tenant
  /phase.?saas/i, // Documentación de SaaS
];

// Archivos que SÍ debemos recuperar (funcionalidad core)
const RECOVER_PATTERNS = [
  /src\/app\/admin\/pos/, // POS system
  /src\/app\/admin\/products/, // Productos
  /src\/app\/admin\/customers/, // Clientes
  /src\/app\/admin\/quotes/, // Presupuestos
  /src\/app\/admin\/work-orders/, // Órdenes de trabajo
  /src\/components\/admin/, // Componentes admin
  /src\/hooks/, // Hooks
  /src\/lib\/presbyopia/, // Helpers de presbicia
  /src\/lib\/api/, // APIs
  /src\/components\/ui\/pagination/, // Componentes UI
  /src\/app\/api\/admin/, // API routes
];

/**
 * Encuentra el commit justo antes del Phase 0
 */
function findPrePhase0Commit() {
  try {
    // Usar el commit antes del merge de Phase SaaS 0 directamente
    // Este es el commit f136b6c - "docs: Actualizar progreso - Phase 5 completada y mergeada a main"
    const prePhase0Hash = 'f136b6c';
    
    try {
      // Verificar que el commit existe y obtener su información
      const commitInfo = execSync(
        `git log ${prePhase0Hash} --format="%H|%ad|%s" --date=short -1`,
        { encoding: 'utf8', cwd: PROJECT_ROOT }
      ).trim();
      
      if (commitInfo) {
        const [hash, date, ...messageParts] = commitInfo.split('|');
        return {
          hash: hash.trim(),
          date: date.trim(),
          message: messageParts.join('|')
        };
      }
    } catch (error) {
      // Continuar con otros métodos
    }
    
    // Buscar el commit del merge de Phase SaaS 0
    const mergeCommit = execSync(
      `git log --all --oneline --grep="Merge.*phase-saas-0\|Merge.*SaaS" -i -1 --format="%H"`,
      { encoding: 'utf8', cwd: PROJECT_ROOT }
    ).trim();
    
    if (mergeCommit) {
      // Obtener el commit padre (antes del merge) usando ^1 explícitamente
      try {
        const parentCommit = execSync(
          `git log "${mergeCommit}^1" --format="%H|%ad|%s" --date=short -1`,
          { encoding: 'utf8', cwd: PROJECT_ROOT }
        ).trim();
        
        if (parentCommit) {
          const [hash, date, ...messageParts] = parentCommit.split('|');
          return {
            hash: hash.trim(),
            date: date.trim(),
            message: messageParts.join('|')
          };
        }
      } catch (error) {
        // Si falla, continuar
      }
    }
    
    // Buscar commits antes de la fecha del Phase 0
    const result = execSync(
      `git log --before="${PHASE_0_DATE}" --format="%H|%ad|%s" --date=short -1`,
      { encoding: 'utf8', cwd: PROJECT_ROOT }
    );
    
    if (result.trim()) {
      const [hash, date, ...messageParts] = result.trim().split('|');
      return {
        hash: hash.trim(),
        date: date.trim(),
        message: messageParts.join('|')
      };
    }
    
    // Si no hay commits antes, buscar el más reciente que no sea Phase 0
    const allCommits = execSync(
      `git log --format="%H|%ad|%s" --date=short --all -100`,
      { encoding: 'utf8', cwd: PROJECT_ROOT }
    );
    
    const commits = allCommits.trim().split('\n');
    for (const commit of commits) {
      const [hash, date, ...messageParts] = commit.split('|');
      const message = messageParts.join('|').toLowerCase();
      
      // Saltar commits relacionados con Phase 0 o SaaS
      if (!message.includes('phase') && !message.includes('saas') && !message.includes('multi-tenant') && !message.includes('organization') && !message.includes('subscription')) {
        return {
          hash: hash.trim(),
          date: date.trim(),
          message: messageParts.join('|')
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error buscando commit pre-Phase 0:', error.message);
    return null;
  }
}

/**
 * Verifica si un archivo debe ser preservado (SaaS/Testing)
 */
function shouldPreserve(filePath) {
  return PRESERVE_PATTERNS.some(pattern => pattern.test(filePath));
}

/**
 * Verifica si un archivo debe ser recuperado (funcionalidad core)
 */
function shouldRecover(filePath) {
  return RECOVER_PATTERNS.some(pattern => pattern.test(filePath));
}

/**
 * Analiza el diff de un archivo para determinar qué versión es mejor
 */
function analyzeDiff(filePath, prePhase0Commit, currentCommit) {
  try {
    // Obtener diff completo
    const diff = execSync(
      `git diff ${prePhase0Commit} ${currentCommit} -- ${filePath}`,
      { encoding: 'utf8', cwd: PROJECT_ROOT, stdio: 'pipe' }
    );
    
    if (!diff || diff.trim().length === 0) {
      return { action: 'unchanged', reason: 'Sin cambios' };
    }
    
    // Contar líneas agregadas/eliminadas
    const addedLines = (diff.match(/^\+/gm) || []).length;
    const removedLines = (diff.match(/^-/gm) || []).length;
    const totalChanges = addedLines + removedLines;
    
    // Analizar el contenido del diff
    const hasSaaSChanges = /organization|subscription|multi.?tenant|tenant/i.test(diff);
    const hasFunctionality = /function|export|const|interface|type|class/.test(diff);
    const hasTestChanges = /test|spec|describe|it\(/.test(diff);
    
    // Determinar acción
    let action = 'review';
    let reason = '';
    let confidence = 0.5;
    
    // Si tiene cambios de SaaS, preservar versión actual
    if (hasSaaSChanges && !hasTestChanges) {
      action = 'preserve';
      reason = 'Contiene cambios de SaaS';
      confidence = 0.9;
    }
    // Si solo tiene cambios de testing, preservar
    else if (hasTestChanges && !hasFunctionality) {
      action = 'preserve';
      reason = 'Cambios de testing';
      confidence = 0.8;
    }
    // Si tiene mucha funcionalidad eliminada, recuperar
    else if (removedLines > addedLines * 2 && hasFunctionality) {
      action = 'recover';
      reason = `Mucha funcionalidad eliminada (${removedLines} líneas vs ${addedLines})`;
      confidence = 0.8;
    }
    // Si tiene funcionalidad nueva importante, preservar
    else if (addedLines > removedLines * 2 && hasFunctionality) {
      action = 'preserve';
      reason = `Funcionalidad nueva agregada (${addedLines} líneas vs ${removedLines})`;
      confidence = 0.7;
    }
    // Si los cambios son balanceados, necesita revisión manual
    else {
      action = 'review';
      reason = `Cambios balanceados (${addedLines} agregadas, ${removedLines} eliminadas)`;
      confidence = 0.5;
    }
    
    return {
      action,
      reason,
      confidence,
      stats: {
        added: addedLines,
        removed: removedLines,
        total: totalChanges
      },
      hasSaaSChanges,
      hasFunctionality,
      hasTestChanges
    };
  } catch (error) {
    return {
      action: 'error',
      reason: error.message,
      confidence: 0
    };
  }
}

/**
 * Compara archivos entre dos commits con análisis de diff
 */
function compareFiles(currentCommit, prePhase0Commit) {
  try {
    // Obtener lista de archivos en ambos commits
    const currentFiles = execSync(
      `git ls-tree -r --name-only ${currentCommit}`,
      { encoding: 'utf8', cwd: PROJECT_ROOT }
    ).trim().split('\n').filter(f => f);
    
    const prePhase0Files = execSync(
      `git ls-tree -r --name-only ${prePhase0Commit}`,
      { encoding: 'utf8', cwd: PROJECT_ROOT }
    ).trim().split('\n').filter(f => f);
    
    const currentSet = new Set(currentFiles);
    const prePhase0Set = new Set(prePhase0Files);
    
    const results = {
      deleted: [], // Archivos eliminados que debemos recuperar
      modified: [], // Archivos modificados con análisis
      new: [], // Archivos nuevos (probablemente SaaS)
      unchanged: [] // Archivos que no cambiaron
    };
    
    // Archivos eliminados
    prePhase0Files.forEach(file => {
      if (!currentSet.has(file) && shouldRecover(file) && !shouldPreserve(file)) {
        results.deleted.push({
          file,
          action: 'recover',
          reason: 'Archivo eliminado, debe recuperarse'
        });
      }
    });
    
    // Archivos modificados (comparar con análisis de diff)
    prePhase0Files.forEach(file => {
      if (currentSet.has(file) && shouldRecover(file) && !shouldPreserve(file)) {
        const analysis = analyzeDiff(file, prePhase0Commit, currentCommit);
        
        if (analysis.action !== 'unchanged') {
          results.modified.push({
            file,
            ...analysis
          });
        } else {
          results.unchanged.push(file);
        }
      }
    });
    
    // Archivos nuevos (probablemente SaaS/Testing)
    currentFiles.forEach(file => {
      if (!prePhase0Set.has(file)) {
        results.new.push(file);
      }
    });
    
    return results;
  } catch (error) {
    console.error('Error comparando archivos:', error.message);
    return null;
  }
}

/**
 * Crea backup de archivos actuales antes de recuperar
 */
function createBackup() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  console.log(`📦 Creando backup en ${BACKUP_DIR}...`);
  
  // Guardar lista de archivos a recuperar
  const backupInfo = {
    timestamp: new Date().toISOString(),
    currentCommit: execSync('git rev-parse HEAD', { encoding: 'utf8', cwd: PROJECT_ROOT }).trim(),
    files: []
  };
  
  fs.writeFileSync(
    path.join(BACKUP_DIR, 'backup-info.json'),
    JSON.stringify(backupInfo, null, 2)
  );
  
  console.log('✅ Backup creado');
}

/**
 * Recupera un archivo desde un commit específico
 */
function recoverFile(filePath, commitHash) {
  try {
    const content = execSync(
      `git show ${commitHash}:${filePath}`,
      { encoding: 'utf8', cwd: PROJECT_ROOT, stdio: 'pipe' }
    );
    
    const fullPath = path.join(PROJECT_ROOT, filePath);
    const dir = path.dirname(fullPath);
    
    // Crear directorio si no existe
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Hacer backup del archivo actual si existe
    if (fs.existsSync(fullPath)) {
      const backupPath = path.join(BACKUP_DIR, filePath.replace(/\//g, '_'));
      const backupDir = path.dirname(backupPath);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      fs.copyFileSync(fullPath, backupPath);
    }
    
    // Escribir archivo recuperado
    fs.writeFileSync(fullPath, content, 'utf8');
    return true;
  } catch (error) {
    console.error(`Error recuperando ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Función principal
 */
function main() {
  const execute = process.argv.includes('--execute');
  
  console.log('🔍 Recuperando funcionalidad pre-Phase 0 de SaaS...\n');
  console.log('⚠️  IMPORTANTE: Este script preservará todo el trabajo de SaaS y Testing\n');
  
  // 1. Encontrar commit pre-Phase 0
  console.log('1️⃣ Buscando commit antes del Phase 0...');
  const prePhase0Commit = findPrePhase0Commit();
  
  if (!prePhase0Commit) {
    console.error('❌ No se pudo encontrar commit pre-Phase 0');
    process.exit(1);
  }
  
  console.log(`   ✅ Encontrado: ${prePhase0Commit.hash.substring(0, 8)}`);
  console.log(`   📅 Fecha: ${prePhase0Commit.date}`);
  console.log(`   💬 Mensaje: ${prePhase0Commit.message}\n`);
  
  // 2. Obtener commit actual
  const currentCommit = execSync('git rev-parse HEAD', { encoding: 'utf8', cwd: PROJECT_ROOT }).trim();
  console.log(`2️⃣ Commit actual: ${currentCommit.substring(0, 8)}\n`);
  
  // 3. Comparar archivos con análisis de diff
  console.log('3️⃣ Comparando archivos y analizando diffs...');
  const comparison = compareFiles(currentCommit, prePhase0Commit.hash);
  
  if (!comparison) {
    console.error('❌ Error al comparar archivos');
    process.exit(1);
  }
  
  console.log(`   📊 Archivos eliminados: ${comparison.deleted.length}`);
  console.log(`   📊 Archivos modificados: ${comparison.modified.length}`);
  console.log(`   📊 Archivos nuevos (SaaS/Testing): ${comparison.new.length}`);
  console.log(`   📊 Archivos sin cambios: ${comparison.unchanged.length}\n`);
  
  // 4. Crear backup
  createBackup();
  
  // 5. Analizar y categorizar archivos modificados
  const toRecover = [];
  const toPreserve = [];
  const toReview = [];
  
  comparison.modified.forEach(item => {
    if (item.action === 'recover' && item.confidence >= 0.7) {
      toRecover.push(item);
    } else if (item.action === 'preserve' && item.confidence >= 0.7) {
      toPreserve.push(item);
    } else {
      toReview.push(item);
    }
  });
  
  // 6. Mostrar resumen
  console.log('\n' + '='.repeat(60));
  console.log('📋 RESUMEN DE ANÁLISIS');
  console.log('='.repeat(60));
  
  if (comparison.deleted.length > 0) {
    console.log(`\n📦 Archivos eliminados a recuperar (${comparison.deleted.length}):`);
    comparison.deleted.forEach(({ file }) => {
      console.log(`   ✅ ${file}`);
    });
  }
  
  if (toRecover.length > 0) {
    console.log(`\n🔄 Archivos a recuperar (${toRecover.length}):`);
    toRecover.forEach(({ file, reason, confidence }) => {
      console.log(`   ✅ ${file}`);
      console.log(`      Razón: ${reason} (confianza: ${(confidence * 100).toFixed(0)}%)`);
    });
  }
  
  if (toPreserve.length > 0) {
    console.log(`\n💾 Archivos a preservar (${toPreserve.length}):`);
    toPreserve.slice(0, 10).forEach(({ file, reason }) => {
      console.log(`   ⏭️  ${file}`);
      console.log(`      Razón: ${reason}`);
    });
    if (toPreserve.length > 10) {
      console.log(`   ... y ${toPreserve.length - 10} más`);
    }
  }
  
  if (toReview.length > 0) {
    console.log(`\n⚠️  Archivos que requieren revisión manual (${toReview.length}):`);
    toReview.slice(0, 10).forEach(({ file, reason, stats }) => {
      console.log(`   🔍 ${file}`);
      console.log(`      ${reason}`);
      console.log(`      Cambios: +${stats.added} -${stats.removed}`);
    });
    if (toReview.length > 10) {
      console.log(`   ... y ${toReview.length - 10} más`);
    }
  }
  
  // 7. Guardar reporte
  const report = {
    prePhase0Commit,
    currentCommit,
    comparison,
    categorized: {
      toRecover: toRecover.length,
      toPreserve: toPreserve.length,
      toReview: toReview.length
    },
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync(
    path.join(BACKUP_DIR, 'recovery-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log(`\n✅ Reporte guardado en: ${path.join(BACKUP_DIR, 'recovery-report.json')}`);
  
  // 8. Ejecutar recuperación si se solicita
  if (execute) {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 EJECUTANDO RECUPERACIÓN');
    console.log('='.repeat(60));
    
    let recovered = 0;
    let failed = 0;
    
    // Recuperar archivos eliminados
    comparison.deleted.forEach(({ file }) => {
      console.log(`\n📥 Recuperando: ${file}`);
      if (recoverFile(file, prePhase0Commit.hash)) {
        console.log(`   ✅ Recuperado exitosamente`);
        recovered++;
      } else {
        console.log(`   ❌ Error al recuperar`);
        failed++;
      }
    });
    
    // Recuperar archivos modificados con alta confianza
    toRecover.forEach(({ file }) => {
      console.log(`\n📥 Recuperando: ${file}`);
      if (recoverFile(file, prePhase0Commit.hash)) {
        console.log(`   ✅ Recuperado exitosamente`);
        recovered++;
      } else {
        console.log(`   ❌ Error al recuperar`);
        failed++;
      }
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE RECUPERACIÓN');
    console.log('='.repeat(60));
    console.log(`✅ Recuperados: ${recovered}`);
    console.log(`❌ Fallidos: ${failed}`);
    console.log(`\n💡 Revisa los archivos marcados para revisión manual`);
    console.log(`💡 Todos los backups están en: ${BACKUP_DIR}`);
  } else {
    console.log('\n' + '='.repeat(60));
    console.log('📝 PRÓXIMOS PASOS');
    console.log('='.repeat(60));
    console.log('1. Revisa el reporte detallado en:');
    console.log(`   ${path.join(BACKUP_DIR, 'recovery-report.json')}`);
    console.log('\n2. Para ejecutar la recuperación automática:');
    console.log('   node scripts/recover-pre-saas-functionality.js --execute');
    console.log('\n3. Para recuperar archivos individuales:');
    console.log(`   git show ${prePhase0Commit.hash.substring(0, 8)}:ruta/archivo.tsx > ruta/archivo.tsx`);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = { main, findPrePhase0Commit, compareFiles, recoverFile, analyzeDiff };
