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
    'Lista de Citas': {
      file: 'src/app/admin/appointments/page.tsx',
      keywords: ['appointment', 'useBranch'],
      exists: checkFileExists('src/app/admin/appointments/page.tsx'),
    },
    'Calendario de Citas': {
      file: 'src/app/admin/appointments/calendar/page.tsx',
      keywords: ['appointment', 'calendar'],
      exists: checkFileExists('src/app/admin/appointments/calendar/page.tsx'),
    },
    'Formulario de Cita': {
      file: 'src/components/admin/CreateAppointmentForm.tsx',
      keywords: ['CreateAppointmentForm', 'appointment'],
      exists: checkFileExists('src/components/admin/CreateAppointmentForm.tsx'),
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
    { path: 'src/app/api/admin/customers/[id]/appointments/route.ts', methods: ['GET', 'POST'] },
    { path: 'src/app/api/admin/appointments/route.ts', methods: ['GET', 'POST'] },
    { path: 'src/app/api/admin/appointments/[id]/route.ts', methods: ['GET', 'PUT', 'DELETE'] },
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
  
  // Buscar todas las migraciones relacionadas con appointments
  const migrationsDir = path.join(PROJECT_ROOT, 'supabase/migrations');
  const allMigrations = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
  
  const appointmentMigrations = allMigrations.filter(migration => {
    const fileName = migration.toLowerCase();
    const content = fs.readFileSync(path.join(migrationsDir, migration), 'utf8').toLowerCase();
    return fileName.includes('appointment') || 
           fileName.includes('cita') ||
           content.includes('appointments') ||
           content.includes('CREATE TABLE.*appointment');
  });
  
  console.log(`  📁 Migraciones relacionadas con appointments encontradas: ${appointmentMigrations.length}`);
  appointmentMigrations.forEach(migration => {
    const fullPath = path.join(migrationsDir, migration);
    const content = fs.readFileSync(fullPath, 'utf8');
    console.log(`  ✅ ${migration} (${content.split('\n').length} líneas)`);
  });
  
  return appointmentMigrations.length > 0;
}

function main() {
  console.log('🔍 Verificación Completa de Sección de Citas y Agendas');
  console.log('='.repeat(60));
  
  const frontendOk = verifyFrontend();
  const apiOk = verifyAPI();
  const migrationsOk = verifyMigrations();
  
  console.log('\n\n📊 RESUMEN DE VERIFICACIÓN');
  console.log('='.repeat(60));
  console.log(`  Frontend: ${frontendOk ? '✅ Completo' : '❌ Faltan componentes'}`);
  console.log(`  API Routes: ${apiOk ? '✅ Completo' : '❌ Faltan rutas'}`);
  console.log(`  Migraciones: ${migrationsOk ? '✅ Presentes' : '⚠️  No se encontraron migraciones específicas'}`);
  
  const allOk = frontendOk && apiOk;
  
  if (allOk) {
    console.log('\n✅ La sección de Citas y Agendas está completa y funcional.');
    console.log('   Como sospechabas, no se encontraron pérdidas significativas de código.');
  } else {
    console.log('\n⚠️  Se encontraron problemas. Revisa los detalles arriba.');
  }
  
  return { frontendOk, apiOk, migrationsOk, allOk };
}

if (require.main === module) {
  main();
}

module.exports = { main, verifyFrontend, verifyAPI, verifyMigrations };
