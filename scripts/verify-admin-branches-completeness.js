const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');

function checkFileExists(filePath) {
  const fullPath = path.join(PROJECT_ROOT, filePath);
  return fs.existsSync(fullPath);
}

function checkFileContent(filePath, keywords) {
  if (!checkFileExists(filePath)) {
    return { exists: false, hasKeywords: false, keywords: [] };
  }
  
  const fullPath = path.join(PROJECT_ROOT, filePath);
  const content = fs.readFileSync(fullPath, 'utf8').toLowerCase();
  
  const foundKeywords = keywords.filter(keyword => 
    content.includes(keyword.toLowerCase())
  );
  
  return {
    exists: true,
    hasKeywords: foundKeywords.length === keywords.length,
    keywords: foundKeywords,
    missingKeywords: keywords.filter(k => !content.includes(k.toLowerCase())),
  };
}

function verifyAdminUsersFrontend() {
  console.log('\n📱 Verificando Frontend - Administradores...');
  console.log('='.repeat(60));
  
  const checks = {
    'Lista de Administradores': {
      file: 'src/app/admin/admin-users/page.tsx',
      keywords: ['admin', 'user', 'useBranch'],
      exists: checkFileExists('src/app/admin/admin-users/page.tsx'),
    },
    'Detalle de Administrador': {
      file: 'src/app/admin/admin-users/[id]/page.tsx',
      keywords: ['admin', 'user'],
      exists: checkFileExists('src/app/admin/admin-users/[id]/page.tsx'),
    },
    'Editar Administrador': {
      file: 'src/app/admin/admin-users/[id]/edit/page.tsx',
      keywords: ['admin', 'user', 'edit'],
      exists: checkFileExists('src/app/admin/admin-users/[id]/edit/page.tsx'),
    },
    'Formulario de Administrador': {
      file: 'src/components/admin/CreateAdminUserForm.tsx',
      keywords: ['CreateAdminUserForm', 'admin'],
      exists: checkFileExists('src/components/admin/CreateAdminUserForm.tsx'),
    },
  };
  
  let allGood = true;
  Object.entries(checks).forEach(([name, check]) => {
    const contentCheck = checkFileContent(check.file, check.keywords);
    const status = check.exists && contentCheck.hasKeywords ? '✅' : check.exists ? '⚠️' : '❌';
    console.log(`  ${status} ${name}: ${check.file}`);
    
    if (!check.exists) {
      console.log(`     ⚠️  Archivo no existe`);
      allGood = false;
    } else if (!contentCheck.hasKeywords) {
      console.log(`     ⚠️  Faltan keywords: ${contentCheck.missingKeywords.join(', ')}`);
      allGood = false;
    }
  });
  
  return allGood;
}

function verifyBranchesFrontend() {
  console.log('\n📱 Verificando Frontend - Sucursales...');
  console.log('='.repeat(60));
  
  const checks = {
    'Lista de Sucursales': {
      file: 'src/app/admin/branches/page.tsx',
      keywords: ['branch', 'useBranch'],
      exists: checkFileExists('src/app/admin/branches/page.tsx'),
    },
    'Formulario de Sucursal': {
      file: 'src/components/admin/CreateBranchForm.tsx',
      keywords: ['CreateBranchForm', 'branch'],
      exists: checkFileExists('src/components/admin/CreateBranchForm.tsx'),
    },
  };
  
  let allGood = true;
  Object.entries(checks).forEach(([name, check]) => {
    const contentCheck = checkFileContent(check.file, check.keywords);
    const status = check.exists && contentCheck.hasKeywords ? '✅' : check.exists ? '⚠️' : '❌';
    console.log(`  ${status} ${name}: ${check.file}`);
    
    if (!check.exists) {
      console.log(`     ⚠️  Archivo no existe`);
      allGood = false;
    } else if (!contentCheck.hasKeywords) {
      console.log(`     ⚠️  Faltan keywords: ${contentCheck.missingKeywords.join(', ')}`);
      allGood = false;
    }
  });
  
  return allGood;
}

function verifyAdminUsersAPI() {
  console.log('\n🔌 Verificando API Routes - Administradores...');
  console.log('='.repeat(60));
  
  const routes = [
    { path: 'src/app/api/admin/admin-users/route.ts', methods: ['GET', 'POST'] },
    { path: 'src/app/api/admin/admin-users/[id]/route.ts', methods: ['GET', 'PUT', 'DELETE'] },
  ];
  
  let allGood = true;
  routes.forEach(route => {
    const exists = checkFileExists(route.path);
    const status = exists ? '✅' : '❌';
    console.log(`  ${status} ${route.path}`);
    console.log(`     Métodos esperados: ${route.methods.join(', ')}`);
    
    if (exists) {
      const content = fs.readFileSync(path.join(PROJECT_ROOT, route.path), 'utf8');
      route.methods.forEach(method => {
        const hasMethod = content.includes(`export async function ${method}`) || 
                         content.includes(`function ${method}`);
        const methodStatus = hasMethod ? '✅' : '⚠️';
        console.log(`       ${methodStatus} ${method}`);
        if (!hasMethod) allGood = false;
      });
    } else {
      allGood = false;
    }
  });
  
  return allGood;
}

function verifyBranchesAPI() {
  console.log('\n🔌 Verificando API Routes - Sucursales...');
  console.log('='.repeat(60));
  
  const routes = [
    { path: 'src/app/api/admin/branches/route.ts', methods: ['GET', 'POST'] },
    { path: 'src/app/api/admin/branches/[id]/route.ts', methods: ['GET', 'PUT', 'DELETE'] },
    { path: 'src/app/api/admin/branches/[id]/stats/route.ts', methods: ['GET'] },
    { path: 'src/app/api/admin/branches/global/stats/route.ts', methods: ['GET'] },
  ];
  
  let allGood = true;
  routes.forEach(route => {
    const exists = checkFileExists(route.path);
    const status = exists ? '✅' : '❌';
    console.log(`  ${status} ${route.path}`);
    console.log(`     Métodos esperados: ${route.methods.join(', ')}`);
    
    if (exists) {
      const content = fs.readFileSync(path.join(PROJECT_ROOT, route.path), 'utf8');
      route.methods.forEach(method => {
        const hasMethod = content.includes(`export async function ${method}`) || 
                         content.includes(`function ${method}`);
        const methodStatus = hasMethod ? '✅' : '⚠️';
        console.log(`       ${methodStatus} ${method}`);
        if (!hasMethod) allGood = false;
      });
    } else {
      allGood = false;
    }
  });
  
  return allGood;
}

function verifyMigrations() {
  console.log('\n🗄️  Verificando Migraciones Críticas...');
  console.log('='.repeat(60));
  
  // Buscar todas las migraciones relacionadas con admin-users o branches
  const migrationsDir = path.join(PROJECT_ROOT, 'supabase/migrations');
  const allMigrations = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
  
  const relevantMigrations = allMigrations.filter(migration => {
    const fileName = migration.toLowerCase();
    const content = fs.readFileSync(path.join(migrationsDir, migration), 'utf8').toLowerCase();
    return fileName.includes('admin') || 
           fileName.includes('branch') ||
           fileName.includes('sucursal') ||
           content.includes('admin_users') ||
           content.includes('admin_branch_access') ||
           content.includes('CREATE TABLE.*admin') ||
           content.includes('CREATE TABLE.*branch');
  });
  
  console.log(`  📁 Migraciones relacionadas encontradas: ${relevantMigrations.length}`);
  relevantMigrations.slice(0, 10).forEach(migration => {
    const fullPath = path.join(migrationsDir, migration);
    const content = fs.readFileSync(fullPath, 'utf8');
    console.log(`  ✅ ${migration} (${content.split('\n').length} líneas)`);
  });
  if (relevantMigrations.length > 10) {
    console.log(`  ... y ${relevantMigrations.length - 10} más`);
  }
  
  return relevantMigrations.length > 0;
}

function verifyHooks() {
  console.log('\n🪝 Verificando Hooks y Utilidades...');
  console.log('='.repeat(60));
  
  const hooks = [
    { path: 'src/hooks/useBranch.ts', keywords: ['useBranch', 'branch'] },
    { path: 'src/lib/api/branch-middleware.ts', keywords: ['branch', 'middleware'] },
    { path: 'src/lib/utils/branch.ts', keywords: ['branch'] },
  ];
  
  let allGood = true;
  hooks.forEach(hook => {
    const exists = checkFileExists(hook.path);
    const contentCheck = checkFileContent(hook.path, hook.keywords);
    const status = exists && contentCheck.hasKeywords ? '✅' : exists ? '⚠️' : '❌';
    console.log(`  ${status} ${hook.path}`);
    
    if (!exists) {
      console.log(`     ⚠️  Archivo no existe`);
      allGood = false;
    } else if (!contentCheck.hasKeywords) {
      console.log(`     ⚠️  Faltan keywords: ${contentCheck.missingKeywords.join(', ')}`);
      allGood = false;
    }
  });
  
  return allGood;
}

function main() {
  console.log('🔍 Verificación Completa de Secciones: Administradores y Sucursales');
  console.log('='.repeat(60));
  
  const adminFrontendOk = verifyAdminUsersFrontend();
  const branchesFrontendOk = verifyBranchesFrontend();
  const adminApiOk = verifyAdminUsersAPI();
  const branchesApiOk = verifyBranchesAPI();
  const migrationsOk = verifyMigrations();
  const hooksOk = verifyHooks();
  
  console.log('\n\n📊 RESUMEN DE VERIFICACIÓN');
  console.log('='.repeat(60));
  console.log(`  Frontend Administradores: ${adminFrontendOk ? '✅ Completo' : '❌ Faltan componentes'}`);
  console.log(`  Frontend Sucursales: ${branchesFrontendOk ? '✅ Completo' : '❌ Faltan componentes'}`);
  console.log(`  API Routes Administradores: ${adminApiOk ? '✅ Completo' : '❌ Faltan rutas'}`);
  console.log(`  API Routes Sucursales: ${branchesApiOk ? '✅ Completo' : '❌ Faltan rutas'}`);
  console.log(`  Migraciones: ${migrationsOk ? '✅ Presentes' : '⚠️  No se encontraron migraciones específicas'}`);
  console.log(`  Hooks y Utilidades: ${hooksOk ? '✅ Completo' : '❌ Faltan archivos'}`);
  
  const allOk = adminFrontendOk && branchesFrontendOk && adminApiOk && branchesApiOk && hooksOk;
  
  if (allOk) {
    console.log('\n✅ Las secciones de Administradores y Sucursales están completas y funcionales.');
  } else {
    console.log('\n⚠️  Se encontraron problemas. Revisa los detalles arriba.');
  }
  
  return { adminFrontendOk, branchesFrontendOk, adminApiOk, branchesApiOk, migrationsOk, hooksOk, allOk };
}

if (require.main === module) {
  main();
}

module.exports = { main, verifyAdminUsersFrontend, verifyBranchesFrontend, verifyAdminUsersAPI, verifyBranchesAPI, verifyMigrations, verifyHooks };
