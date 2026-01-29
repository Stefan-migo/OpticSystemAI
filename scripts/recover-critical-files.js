// Script para recuperar archivos críticos identificados en el análisis
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const REFERENCE_COMMIT = 'f8e9340';
const BACKUP_DIR = path.join(PROJECT_ROOT, '.recovery-backup');

// Archivos críticos a recuperar (de mayor a menor prioridad)
const CRITICAL_FILES = {
  'POS/Caja': [
    // Archivos eliminados
    'src/app/admin/pos/settings/page.tsx',
    'src/app/api/admin/pos/pending-balance/pay/route.ts',
    'src/app/api/admin/pos/pending-balance/route.ts',
    'src/app/api/admin/pos/settings/route.ts',
    'src/app/api/admin/cash-register/open/route.ts',
    'src/app/api/admin/cash-register/reopen/route.ts',
    'src/app/api/admin/cash-register/session-movements/route.ts',
    // Archivos con pérdida significativa
    'src/app/api/admin/pos/process-sale/route.ts',
    'src/app/api/admin/cash-register/close/route.ts',
  ],
  'Presupuestos': [
    'src/app/api/admin/quotes/[id]/load-to-pos/route.ts',
    'src/app/api/admin/quotes/[id]/route.ts',
  ],
  'Trabajos': [
    'src/app/api/admin/work-orders/[id]/deliver/route.ts',
  ],
  'Productos': [
    'src/app/api/admin/products/[id]/route.ts',
    'src/app/api/admin/products/bulk/route.ts',
    'src/app/api/admin/products/import/route.ts',
    'src/app/api/admin/products/route.ts',
    'src/app/api/admin/products/search/route.ts',
  ],
  'Clientes': [
    'src/app/admin/customers/[id]/edit/page.tsx',
  ],
};

function recoverFile(filePath, section) {
  const fullPath = path.join(PROJECT_ROOT, filePath);
  const dir = path.dirname(fullPath);
  const backupPath = path.join(BACKUP_DIR, section.toLowerCase().replace(/\s+/g, '-'), path.basename(filePath) + '.backup');
  
  try {
    // Verificar que el archivo existe en el commit de referencia
    execSync(
      `git cat-file -e ${REFERENCE_COMMIT}:${filePath} 2>&1`,
      { encoding: 'utf8', cwd: PROJECT_ROOT, stdio: 'pipe' }
    );
    
    // Crear directorio si no existe
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Hacer backup del archivo actual si existe
    if (fs.existsSync(fullPath)) {
      const backupDir = path.dirname(backupPath);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      fs.copyFileSync(fullPath, backupPath);
    }
    
    // Recuperar archivo
    const content = execSync(
      `git show ${REFERENCE_COMMIT}:${filePath}`,
      { encoding: 'utf8', cwd: PROJECT_ROOT, stdio: 'pipe' }
    );
    
    fs.writeFileSync(fullPath, content, 'utf8');
    return { success: true, wasNew: !fs.existsSync(backupPath) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function main() {
  console.log('🚀 RECUPERACIÓN DE ARCHIVOS CRÍTICOS');
  console.log('='.repeat(60));
  console.log(`📅 Commit de referencia: ${REFERENCE_COMMIT.substring(0, 8)}\n`);
  
  const results = {
    recovered: [],
    failed: [],
    skipped: []
  };
  
  Object.entries(CRITICAL_FILES).forEach(([section, files]) => {
    console.log(`\n📦 ${section.toUpperCase()}`);
    console.log('-'.repeat(60));
    
    files.forEach(file => {
      console.log(`\n📄 ${file}`);
      const result = recoverFile(file, section);
      
      if (result.success) {
        console.log(`   ✅ ${result.wasNew ? 'Creado' : 'Recuperado'} exitosamente`);
        if (!result.wasNew) {
          console.log(`   💾 Backup guardado`);
        }
        results.recovered.push({ section, file, wasNew: result.wasNew });
      } else {
        console.log(`   ❌ Error: ${result.error}`);
        results.failed.push({ section, file, error: result.error });
      }
    });
  });
  
  // Resumen
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE RECUPERACIÓN');
  console.log('='.repeat(60));
  console.log(`✅ Recuperados: ${results.recovered.length}`);
  console.log(`   - Nuevos: ${results.recovered.filter(r => r.wasNew).length}`);
  console.log(`   - Reemplazados: ${results.recovered.filter(r => !r.wasNew).length}`);
  console.log(`❌ Fallidos: ${results.failed.length}`);
  
  if (results.failed.length > 0) {
    console.log('\n⚠️  Archivos que no se pudieron recuperar:');
    results.failed.forEach(({ file, error }) => {
      console.log(`   - ${file}`);
      console.log(`     ${error}`);
    });
  }
  
  console.log(`\n💾 Todos los backups están en: ${BACKUP_DIR}`);
  console.log('\n⚠️  IMPORTANTE:');
  console.log('   1. Revisa los archivos recuperados');
  console.log('   2. Verifica que no haya conflictos con cambios de SaaS');
  console.log('   3. Ejecuta: npm run type-check && npm run build');
}

if (require.main === module) {
  main();
}

module.exports = { recoverFile, CRITICAL_FILES };
