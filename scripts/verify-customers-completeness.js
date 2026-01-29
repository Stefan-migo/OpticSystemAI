const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');

// Funcionalidades esperadas en la sección de clientes
const EXPECTED_FEATURES = {
  frontend: {
    'Lista de Clientes': [
      'Búsqueda de clientes',
      'Filtros (activo/inactivo)',
      'Paginación',
      'Estadísticas (total, activos, nuevos)',
      'Vista por sucursal',
      'Crear nuevo cliente',
      'Editar cliente',
      'Ver detalles del cliente',
    ],
    'Detalle de Cliente': [
      'Información personal',
      'Dirección',
      'Información médica',
      'Tab: Resumen',
      'Tab: Recetas (Prescriptions)',
      'Tab: Citas (Appointments)',
      'Tab: Presupuestos (Quotes)',
      'Tab: Compras (Orders)',
      'Tab: Analíticas',
      'Crear nueva receta',
      'Crear nueva cita',
      'Crear nuevo presupuesto',
    ],
    'Formularios': [
      'Crear cliente',
      'Editar cliente',
      'Crear receta',
    ],
  },
  api: {
    'Rutas principales': [
      'GET /api/admin/customers - Listar clientes',
      'POST /api/admin/customers - Crear cliente',
      'GET /api/admin/customers/[id] - Obtener cliente',
      'PUT /api/admin/customers/[id] - Actualizar cliente',
      'DELETE /api/admin/customers/[id] - Eliminar cliente',
    ],
    'Rutas de búsqueda': [
      'GET /api/admin/customers/search - Búsqueda de clientes',
    ],
    'Rutas de recetas': [
      'GET /api/admin/customers/[id]/prescriptions - Listar recetas',
      'POST /api/admin/customers/[id]/prescriptions - Crear receta',
      'GET /api/admin/customers/[id]/prescriptions/[prescriptionId] - Obtener receta',
      'PUT /api/admin/customers/[id]/prescriptions/[prescriptionId] - Actualizar receta',
      'DELETE /api/admin/customers/[id]/prescriptions/[prescriptionId] - Eliminar receta',
    ],
    'Rutas de citas': [
      'GET /api/admin/customers/[id]/appointments - Listar citas',
      'POST /api/admin/customers/[id]/appointments - Crear cita',
    ],
  },
  migrations: [
    'Tabla customers',
    'Tabla prescriptions',
    'Tabla appointments',
    'Relaciones con orders, quotes, work_orders',
    'customer_own_frame en work_orders',
    'customer_name en orders',
  ],
};

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
    'Lista de Clientes': {
      file: 'src/app/admin/customers/page.tsx',
      keywords: ['search', 'filter', 'pagination', 'useBranch', 'BranchSelector'],
      exists: checkFileExists('src/app/admin/customers/page.tsx'),
    },
    'Nuevo Cliente': {
      file: 'src/app/admin/customers/new/page.tsx',
      keywords: ['useBranch', 'currentBranchId', 'branch_id'],
      exists: checkFileExists('src/app/admin/customers/new/page.tsx'),
    },
    'Detalle de Cliente': {
      file: 'src/app/admin/customers/[id]/page.tsx',
      keywords: ['TabsTrigger', 'prescriptions', 'appointments', 'quotes', 'purchases', 'analytics'],
      exists: checkFileExists('src/app/admin/customers/[id]/page.tsx'),
    },
    'Editar Cliente': {
      file: 'src/app/admin/customers/[id]/edit/page.tsx',
      keywords: ['useBranch', 'currentBranchId'],
      exists: checkFileExists('src/app/admin/customers/[id]/edit/page.tsx'),
    },
    'Formulario de Receta': {
      file: 'src/components/admin/CreatePrescriptionForm.tsx',
      keywords: ['prescription', 'od_sphere', 'os_sphere'],
      exists: checkFileExists('src/components/admin/CreatePrescriptionForm.tsx'),
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
    { path: 'src/app/api/admin/customers/route.ts', methods: ['GET', 'POST'] },
    { path: 'src/app/api/admin/customers/[id]/route.ts', methods: ['GET', 'PUT', 'DELETE'] },
    { path: 'src/app/api/admin/customers/search/route.ts', methods: ['GET'] },
    { path: 'src/app/api/admin/customers/[id]/prescriptions/route.ts', methods: ['GET', 'POST'] },
    { path: 'src/app/api/admin/customers/[id]/prescriptions/[prescriptionId]/route.ts', methods: ['GET', 'PUT', 'DELETE'] },
    { path: 'src/app/api/admin/customers/[id]/appointments/route.ts', methods: ['GET', 'POST'] },
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
  console.log('\n🗄️  Verificando Migraciones...');
  console.log('='.repeat(60));
  
  const migrations = [
    'supabase/migrations/20260122000001_add_customer_own_frame_to_work_orders.sql',
    'supabase/migrations/20260127000003_add_customer_name_to_orders.sql',
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
  console.log('🔍 Verificación Completa de Sección de Clientes');
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
    console.log('\n✅ La sección de Clientes está completa y funcional.');
  } else {
    console.log('\n⚠️  Se encontraron problemas. Revisa los detalles arriba.');
  }
  
  return { frontendOk, apiOk, migrationsOk, allOk };
}

if (require.main === module) {
  main();
}

module.exports = { main, verifyFrontend, verifyAPI, verifyMigrations };
