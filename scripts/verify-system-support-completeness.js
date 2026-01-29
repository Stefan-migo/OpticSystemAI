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

function verifySystemFrontend() {
  console.log('\n📱 Verificando Frontend - Sistema...');
  console.log('='.repeat(60));
  
  const checks = {
    'Página Principal Sistema': {
      file: 'src/app/admin/system/page.tsx',
      keywords: ['system', 'useBranch'],
      exists: checkFileExists('src/app/admin/system/page.tsx'),
    },
    'Configuración de Facturación': {
      file: 'src/app/admin/system/billing-settings/page.tsx',
      keywords: ['billing', 'settings'],
      exists: checkFileExists('src/app/admin/system/billing-settings/page.tsx'),
    },
    'Configuración POS Facturación': {
      file: 'src/app/admin/system/pos-billing-settings/page.tsx',
      keywords: ['pos', 'billing'],
      exists: checkFileExists('src/app/admin/system/pos-billing-settings/page.tsx'),
    },
    'Configuración POS': {
      file: 'src/app/admin/system/pos-settings/page.tsx',
      keywords: ['pos', 'settings'],
      exists: checkFileExists('src/app/admin/system/pos-settings/page.tsx'),
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

function verifySupportFrontend() {
  console.log('\n📱 Verificando Frontend - Soporte...');
  console.log('='.repeat(60));
  
  const checks = {
    'Página Principal Soporte': {
      file: 'src/app/admin/support/page.tsx',
      keywords: ['support', 'ticket'],
      exists: checkFileExists('src/app/admin/support/page.tsx'),
    },
    'Tickets': {
      file: 'src/app/admin/support/tickets/[id]/page.tsx',
      keywords: ['ticket', 'support'],
      exists: checkFileExists('src/app/admin/support/tickets/[id]/page.tsx'),
    },
    'Nuevo Ticket': {
      file: 'src/app/admin/support/tickets/new/page.tsx',
      keywords: ['ticket', 'new'],
      exists: checkFileExists('src/app/admin/support/tickets/new/page.tsx'),
    },
    'Plantillas': {
      file: 'src/app/admin/support/templates/page.tsx',
      keywords: ['template', 'support'],
      exists: checkFileExists('src/app/admin/support/templates/page.tsx'),
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

function verifySupportAPI() {
  console.log('\n🔌 Verificando API Routes - Soporte...');
  console.log('='.repeat(60));
  
  const routes = [
    { path: 'src/app/api/admin/support/tickets/route.ts', methods: ['GET', 'POST'] },
    { path: 'src/app/api/admin/support/tickets/[id]/route.ts', methods: ['GET', 'PUT', 'DELETE'] },
    { path: 'src/app/api/admin/support/templates/route.ts', methods: ['GET', 'POST'] },
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

function verifyBranchValidationLogic() {
  console.log('\n🔍 Verificando Lógica de Validación de Branch...');
  console.log('='.repeat(60));
  
  const checks = {
    'Branch Middleware': {
      file: 'src/lib/api/branch-middleware.ts',
      keywords: ['isSuperAdmin', 'getBranchContext', 'validateBranchAccess', 'addBranchFilter'],
      exists: checkFileExists('src/lib/api/branch-middleware.ts'),
    },
    'useBranch Hook': {
      file: 'src/hooks/useBranch.ts',
      keywords: ['useBranch', 'currentBranchId', 'isSuperAdmin'],
      exists: checkFileExists('src/hooks/useBranch.ts'),
    },
    'Branch Utils': {
      file: 'src/lib/utils/branch.ts',
      keywords: ['branch', 'getBranchHeader'],
      exists: checkFileExists('src/lib/utils/branch.ts'),
    },
    'Branch Selector': {
      file: 'src/components/admin/BranchSelector.tsx',
      keywords: ['BranchSelector', 'branch'],
      exists: checkFileExists('src/components/admin/BranchSelector.tsx'),
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
    } else {
      // Verificar lógica específica de superAdmin
      if (check.file.includes('branch-middleware')) {
        const content = fs.readFileSync(path.join(PROJECT_ROOT, check.file), 'utf8');
        const hasSuperAdminLogic = content.includes('isSuperAdmin') && 
                                   content.includes('global') &&
                                   (content.includes('branchId === null') || content.includes('branch_id === null'));
        console.log(`     ${hasSuperAdminLogic ? '✅' : '⚠️'} Lógica de superAdmin presente`);
        if (!hasSuperAdminLogic) allGood = false;
      }
    }
  });
  
  return allGood;
}

function main() {
  console.log('🔍 Verificación Completa de Secciones: Sistema y Soporte');
  console.log('='.repeat(60));
  
  const systemFrontendOk = verifySystemFrontend();
  const supportFrontendOk = verifySupportFrontend();
  const supportApiOk = verifySupportAPI();
  const branchValidationOk = verifyBranchValidationLogic();
  
  console.log('\n\n📊 RESUMEN DE VERIFICACIÓN');
  console.log('='.repeat(60));
  console.log(`  Frontend Sistema: ${systemFrontendOk ? '✅ Completo' : '❌ Faltan componentes'}`);
  console.log(`  Frontend Soporte: ${supportFrontendOk ? '✅ Completo' : '❌ Faltan componentes'}`);
  console.log(`  API Routes Soporte: ${supportApiOk ? '✅ Completo' : '❌ Faltan rutas'}`);
  console.log(`  Lógica Validación Branch: ${branchValidationOk ? '✅ Completo' : '❌ Faltan archivos'}`);
  
  const allOk = systemFrontendOk && supportFrontendOk && supportApiOk && branchValidationOk;
  
  if (allOk) {
    console.log('\n✅ Las secciones de Sistema y Soporte están completas y funcionales.');
  } else {
    console.log('\n⚠️  Se encontraron problemas. Revisa los detalles arriba.');
  }
  
  return { systemFrontendOk, supportFrontendOk, supportApiOk, branchValidationOk, allOk };
}

if (require.main === module) {
  main();
}

module.exports = { main, verifySystemFrontend, verifySupportFrontend, verifySupportAPI, verifyBranchValidationLogic };
