const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const BACKUP_DIR = path.join(PROJECT_ROOT, '.system-support-recovery-backup');

// Commits funcionales que pueden tener versiones completas
const FUNCTIONAL_COMMITS = [
  { hash: 'eab64b4', desc: 'Completar Fase 3 - Mejoras de Seguridad' },
  { hash: 'e49441d', desc: 'Completar Fase 2 - Refactorización de componentes' },
  { hash: '047ac80', desc: 'Corregir errores críticos y mejoras de código' },
  { hash: 'e6ed01a', desc: 'Sistema completo de gestión óptica' },
  { hash: 'f8e9340', desc: 'Corregir paths de importación en tests' },
];

// Archivos críticos de Sistema (solo si realmente se necesitan)
const SYSTEM_FILES = [
  // Estos archivos fueron consolidados en /admin/pos/settings
  // 'src/app/admin/system/billing-settings/page.tsx',
  // 'src/app/admin/system/pos-billing-settings/page.tsx',
  // 'src/app/admin/system/pos-settings/page.tsx',
];

// Migraciones relacionadas con Sistema y Soporte
const SYSTEM_MIGRATIONS = [
  'supabase/migrations/20250129000000_add_printer_settings_to_billing.sql',
  'supabase/migrations/20260122000005_create_organization_settings.sql',
  'supabase/migrations/20260123000000_add_system_categories.sql',
  'supabase/migrations/20260124000000_update_system_config_for_optometry.sql',
  'supabase/migrations/20260124000002_fix_system_health_metrics_rls.sql',
  'supabase/migrations/20260125000000_add_addition_support_to_lens_matrices.sql',
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
  console.log('🔄 Recuperación Completa de Secciones: Sistema y Soporte');
  console.log('='.repeat(60));
  
  // Crear directorio de backup
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  let recoveredCount = 0;
  
  // Nota: Los archivos de frontend fueron consolidados en /admin/pos/settings
  console.log('\n📁 Nota: Los archivos de frontend (billing-settings, pos-billing-settings, pos-settings)');
  console.log('   fueron consolidados en /admin/pos/settings/page.tsx');
  console.log('   No se recuperarán estos archivos individuales.\n');
  
  // Recuperar migraciones perdidas
  console.log('📁 Recuperando migraciones perdidas...');
  SYSTEM_MIGRATIONS.forEach(migrationPath => {
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
  console.log(`  - Migraciones recuperadas: ${recoveredCount}`);
  console.log(`  - Backup guardado en: ${BACKUP_DIR}`);
  
  if (recoveredCount > 0) {
    console.log('\n✅ Recuperación completada. Revisa los cambios y prueba la funcionalidad.');
    console.log('⚠️  Nota: Puede que necesites aplicar las migraciones con: npm run supabase:push');
  } else {
    console.log('\n✅ No se encontraron migraciones que necesiten recuperación.');
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, recoverMigration, FUNCTIONAL_COMMITS };
