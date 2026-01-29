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

function verifyFrontend() {
  console.log('\n📱 Verificando Frontend...');
  console.log('='.repeat(60));
  
  const checks = {
    'Lista de Presupuestos': {
      file: 'src/app/admin/quotes/page.tsx',
      keywords: ['quote', 'useBranch', 'BranchSelector'],
      exists: checkFileExists('src/app/admin/quotes/page.tsx'),
    },
    'Detalle de Presupuesto': {
      file: 'src/app/admin/quotes/[id]/page.tsx',
      keywords: ['quote', 'status'],
      exists: checkFileExists('src/app/admin/quotes/[id]/page.tsx'),
    },
    'Configuración de Presupuestos': {
      file: 'src/app/admin/quotes/settings/page.tsx',
      keywords: ['quote', 'settings', 'useBranch'],
      exists: checkFileExists('src/app/admin/quotes/settings/page.tsx'),
    },
    'Formulario de Presupuesto': {
      file: 'src/components/admin/CreateQuoteForm.tsx',
      keywords: ['CreateQuoteForm', 'quote'],
      exists: checkFileExists('src/components/admin/CreateQuoteForm.tsx'),
    },
  };
  
  let allGood = true;
  Object.entries(checks).forEach(([name, check]) => {
    const contentCheck = checkFileContent(check.file, check.keywords);
    const status = check.exists && contentCheck.hasKeywords ? '✅' : '❌';
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

function verifyAPI() {
  console.log('\n🔌 Verificando API Routes...');
  console.log('='.repeat(60));
  
  const routes = [
    { path: 'src/app/api/admin/quotes/route.ts', methods: ['GET', 'POST'] },
    { path: 'src/app/api/admin/quotes/[id]/route.ts', methods: ['GET', 'PUT', 'DELETE'] },
    { path: 'src/app/api/admin/quotes/[id]/status/route.ts', methods: ['PUT', 'PATCH'] },
    { path: 'src/app/api/admin/quotes/[id]/convert/route.ts', methods: ['POST'] },
    { path: 'src/app/api/admin/quotes/[id]/send/route.ts', methods: ['POST'] },
    { path: 'src/app/api/admin/quotes/[id]/load-to-pos/route.ts', methods: ['POST'] },
    { path: 'src/app/api/admin/quote-settings/route.ts', methods: ['GET', 'PUT'] },
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
  
  const migrations = [
    'supabase/migrations/20260123000000_add_near_frame_fields_to_quotes.sql',
  ];
  
  let allGood = true;
  migrations.forEach(migration => {
    const exists = checkFileExists(migration);
    const status = exists ? '✅' : '❌';
    console.log(`  ${status} ${migration}`);
    
    if (!exists) {
      allGood = false;
    } else {
      const content = fs.readFileSync(path.join(PROJECT_ROOT, migration), 'utf8');
      console.log(`     Líneas: ${content.split('\n').length}`);
    }
  });
  
  return allGood;
}

function main() {
  console.log('🔍 Verificación Completa de Sección de Presupuestos');
  console.log('='.repeat(60));
  
  const frontendOk = verifyFrontend();
  const apiOk = verifyAPI();
  const migrationsOk = verifyMigrations();
  
  console.log('\n\n📊 RESUMEN DE VERIFICACIÓN');
  console.log('='.repeat(60));
  console.log(`  Frontend: ${frontendOk ? '✅ Completo' : '❌ Faltan componentes'}`);
  console.log(`  API Routes: ${apiOk ? '✅ Completo' : '❌ Faltan rutas'}`);
  console.log(`  Migraciones: ${migrationsOk ? '✅ Completo' : '❌ Faltan migraciones'}`);
  
  const allOk = frontendOk && apiOk && migrationsOk;
  
  if (allOk) {
    console.log('\n✅ La sección de Presupuestos está completa y funcional.');
  } else {
    console.log('\n⚠️  Se encontraron problemas. Revisa los detalles arriba.');
  }
  
  return { frontendOk, apiOk, migrationsOk, allOk };
}

if (require.main === module) {
  main();
}

module.exports = { main, verifyFrontend, verifyAPI, verifyMigrations };
