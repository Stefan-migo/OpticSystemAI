const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const BACKUP_DIR = path.join(PROJECT_ROOT, '.pos-cash-recovery-backup');

// Commits funcionales que pueden tener versiones completas
const FUNCTIONAL_COMMITS = [
  { hash: 'eab64b4', desc: 'Completar Fase 3 - Mejoras de Seguridad' },
  { hash: 'e49441d', desc: 'Completar Fase 2 - Refactorización de componentes' },
  { hash: '047ac80', desc: 'Corregir errores críticos y mejoras de código' },
  { hash: 'e6ed01a', desc: 'Sistema completo de gestión óptica' },
  { hash: 'f8e9340', desc: 'Corregir paths de importación en tests' },
];

// Archivos críticos de POS/Caja
const CRITICAL_FILES = [
  'src/app/admin/pos/page.tsx',
  'src/app/admin/cash-register/page.tsx',
];

// Rutas de API críticas
const CRITICAL_API_ROUTES = [
  'src/app/api/admin/orders/[id]/cancel/route.ts',
  'src/app/api/admin/orders/[id]/delete/route.ts',
  'src/app/api/admin/orders/[id]/payments/route.ts',
];

// Migraciones relacionadas con POS/Caja
const POS_CASH_MIGRATIONS = [
  'supabase/migrations/20250127000000_fix_cash_register_status_and_reopen.sql',
  'supabase/migrations/20250130000000_update_payment_methods_and_add_session.sql',
  'supabase/migrations/20260122000003_add_billing_fields_to_orders.sql',
  'supabase/migrations/20260122000004_add_branch_id_to_orders.sql',
  'supabase/migrations/20260122000006_create_order_payments.sql',
  'supabase/migrations/20260122000007_add_on_hold_payment_status.sql',
  'supabase/migrations/20260124000003_add_pos_session_to_closures.sql',
  'supabase/migrations/20260124000004_add_cancellation_reason_to_orders.sql',
  'supabase/migrations/20260126000000_create_pos_settings.sql',
  'supabase/migrations/20260126000001_update_get_min_deposit_for_branch.sql',
  'supabase/migrations/20260126000002_remove_order_notification_trigger.sql',
  'supabase/migrations/20260127000000_update_orders_payment_status_for_partial.sql',
  'supabase/migrations/20260127000001_update_orders_payment_method_type_for_deposit.sql',
  'supabase/migrations/20260127000002_add_pos_session_to_orders.sql',
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

function recoverFile(filePath, force = false) {
  const relativePath = path.relative(PROJECT_ROOT, filePath);
  const commitInfo = findBestCommitForFile(filePath);
  
  if (!commitInfo) {
    console.log(`  ⚠️  No encontrado en commits funcionales: ${relativePath}`);
    return false;
  }
  
  const referenceContent = getFileContentFromGit(commitInfo.hash, filePath);
  if (!referenceContent) {
    console.log(`  ⚠️  No se pudo obtener contenido: ${relativePath}`);
    return false;
  }
  
  const exists = fs.existsSync(filePath);
  
  if (exists && !force) {
    console.log(`  ✅ Ya existe: ${relativePath}`);
    return false;
  }
  
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
  console.log(`  ✅ Recuperado desde ${commitInfo.hash}: ${relativePath}`);
  console.log(`     ${commitInfo.desc}`);
  return true;
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
  console.log('🔄 Recuperación Completa de Sección POS y Caja');
  console.log('='.repeat(60));
  
  // Crear directorio de backup
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  let recoveredCount = 0;
  
  // Recuperar archivos críticos faltantes
  console.log('\n📁 Recuperando archivos críticos faltantes...');
  CRITICAL_FILES.forEach(filePath => {
    const fullPath = path.join(PROJECT_ROOT, filePath);
    if (!fs.existsSync(fullPath)) {
      if (recoverFile(fullPath, true)) {
        recoveredCount++;
      }
    } else {
      console.log(`  ✅ Ya existe: ${path.relative(PROJECT_ROOT, fullPath)}`);
    }
  });
  
  // Recuperar rutas de API faltantes
  console.log('\n📁 Recuperando rutas de API faltantes...');
  CRITICAL_API_ROUTES.forEach(routePath => {
    const fullPath = path.join(PROJECT_ROOT, routePath);
    if (!fs.existsSync(fullPath)) {
      if (recoverFile(fullPath, true)) {
        recoveredCount++;
      }
    } else {
      console.log(`  ✅ Ya existe: ${path.relative(PROJECT_ROOT, fullPath)}`);
    }
  });
  
  // Recuperar migraciones perdidas
  console.log('\n📁 Recuperando migraciones perdidas...');
  POS_CASH_MIGRATIONS.forEach(migrationPath => {
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
  console.log(`  - Archivos recuperados: ${recoveredCount}`);
  console.log(`  - Backup guardado en: ${BACKUP_DIR}`);
  
  if (recoveredCount > 0) {
    console.log('\n✅ Recuperación completada. Revisa los cambios y prueba la funcionalidad.');
    console.log('⚠️  Nota: Puede que necesites aplicar las migraciones con: npm run supabase:push');
  } else {
    console.log('\n✅ No se encontraron archivos que necesiten recuperación.');
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, recoverFile, recoverMigration, FUNCTIONAL_COMMITS };
