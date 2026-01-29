const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');

// Funcionalidades esperadas en la sección de productos
const EXPECTED_FEATURES = {
  frontend: {
    'Lista de Productos': [
      'Búsqueda de productos',
      'Filtros (categoría, estado, tipo)',
      'Paginación',
      'Vista por sucursal',
      'Crear nuevo producto',
      'Editar producto',
      'Ver detalles del producto',
      'Gestión de stock por sucursal',
    ],
    'Formularios': [
      'Crear producto',
      'Editar producto',
      'Gestión de stock',
      'Campos ópticos (marcos, lentes)',
    ],
    'Categorías': [
      'Lista de categorías',
      'Crear categoría',
      'Editar categoría',
      'Eliminar categoría (con protección de default)',
    ],
    'Familias de Lentes': [
      'Lista de familias de lentes',
      'Crear familia',
      'Editar familia',
      'Eliminar familia',
    ],
    'Matrices de Precios': [
      'Lista de matrices',
      'Crear matriz',
      'Editar matriz',
      'Eliminar matriz',
      'Calculadora de precios',
    ],
  },
  api: {
    'Rutas principales': [
      'GET /api/admin/products - Listar productos',
      'POST /api/admin/products - Crear producto',
      'GET /api/admin/products/[id] - Obtener producto',
      'PUT /api/admin/products/[id] - Actualizar producto',
      'DELETE /api/admin/products/[id] - Eliminar producto',
      'GET /api/admin/products/search - Búsqueda de productos',
    ],
    'Rutas de categorías': [
      'GET /api/categories - Listar categorías',
      'POST /api/categories - Crear categoría',
      'GET /api/categories/[id] - Obtener categoría',
      'PUT /api/categories/[id] - Actualizar categoría',
      'DELETE /api/categories/[id] - Eliminar categoría',
    ],
    'Rutas de familias de lentes': [
      'GET /api/admin/lens-families - Listar familias',
      'POST /api/admin/lens-families - Crear familia',
      'GET /api/admin/lens-families/[id] - Obtener familia',
      'PUT /api/admin/lens-families/[id] - Actualizar familia',
      'DELETE /api/admin/lens-families/[id] - Eliminar familia',
    ],
    'Rutas de matrices de precios': [
      'GET /api/admin/lens-matrices - Listar matrices',
      'POST /api/admin/lens-matrices - Crear matriz',
      'GET /api/admin/lens-matrices/[id] - Obtener matriz',
      'PUT /api/admin/lens-matrices/[id] - Actualizar matriz',
      'DELETE /api/admin/lens-matrices/[id] - Eliminar matriz',
      'GET /api/admin/lens-matrices/calculate - Calcular precio',
    ],
  },
  migrations: [
    'Tabla products',
    'Tabla categories',
    'Tabla product_branch_stock',
    'Tabla lens_families',
    'Tabla lens_price_matrices',
    'Función calculate_lens_price',
    'Protección de categorías default',
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
    'Lista de Productos': {
      file: 'src/app/admin/products/page.tsx',
      keywords: ['search', 'filter', 'pagination', 'useBranch', 'BranchSelector', 'stock'],
      exists: checkFileExists('src/app/admin/products/page.tsx'),
    },
    'Nuevo Producto': {
      file: 'src/app/admin/products/add/page.tsx',
      keywords: ['useBranch', 'currentBranchId', 'stock_quantity', 'useProtectedForm'],
      exists: checkFileExists('src/app/admin/products/add/page.tsx'),
    },
    'Editar Producto': {
      file: 'src/app/admin/products/edit/[id]/page.tsx',
      keywords: ['useBranch', 'currentBranchId', 'stock_quantity'],
      exists: checkFileExists('src/app/admin/products/edit/[id]/page.tsx'),
    },
    'Detalle de Producto': {
      file: 'src/app/admin/products/[id]/page.tsx',
      keywords: ['product', 'stock', 'branch'],
      exists: checkFileExists('src/app/admin/products/[id]/page.tsx'),
    },
    'Categorías': {
      file: 'src/app/admin/categories/page.tsx',
      keywords: ['category', 'is_default', 'delete'],
      exists: checkFileExists('src/app/admin/categories/page.tsx'),
    },
    'Familias de Lentes': {
      file: 'src/app/admin/lens-families/page.tsx',
      keywords: ['lens_family', 'lens_type', 'lens_material'],
      exists: checkFileExists('src/app/admin/lens-families/page.tsx'),
    },
    'Matrices de Precios': {
      file: 'src/app/admin/lens-matrices/page.tsx',
      keywords: ['lens_price_matrix', 'sphere', 'cylinder', 'calculate'],
      exists: checkFileExists('src/app/admin/lens-matrices/page.tsx'),
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
    { path: 'src/app/api/admin/products/route.ts', methods: ['GET', 'POST'] },
    { path: 'src/app/api/admin/products/[id]/route.ts', methods: ['GET', 'PUT', 'DELETE'] },
    { path: 'src/app/api/admin/products/search/route.ts', methods: ['GET'] },
    { path: 'src/app/api/categories/route.ts', methods: ['GET', 'POST'] },
    { path: 'src/app/api/categories/[id]/route.ts', methods: ['GET', 'PUT', 'DELETE'] },
    { path: 'src/app/api/admin/lens-families/route.ts', methods: ['GET', 'POST'] },
    { path: 'src/app/api/admin/lens-families/[id]/route.ts', methods: ['GET', 'PUT', 'DELETE'] },
    { path: 'src/app/api/admin/lens-matrices/route.ts', methods: ['GET', 'POST'] },
    { path: 'src/app/api/admin/lens-matrices/[id]/route.ts', methods: ['GET', 'PUT', 'DELETE'] },
    { path: 'src/app/api/admin/lens-matrices/calculate/route.ts', methods: ['GET'] },
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
    'supabase/migrations/20260120000000_refactor_separate_products_inventory.sql',
    'supabase/migrations/20260129000000_create_lens_families_and_matrices.sql',
    'supabase/migrations/20260130000000_protect_default_categories.sql',
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

function verifyHooks() {
  console.log('\n🪝 Verificando Hooks y Utilidades...');
  console.log('='.repeat(60));
  
  const hooks = [
    { path: 'src/hooks/useProductOptions.ts', keywords: ['useProductOptions', 'export'] },
    { path: 'src/hooks/useLensPriceCalculation.ts', keywords: ['useLensPriceCalculation', 'calculateLensPrice'] },
    { path: 'src/lib/inventory/stock-helpers.ts', keywords: ['getProductStock', 'updateProductStock'] },
    { path: 'src/lib/presbyopia-helpers.ts', keywords: ['hasAddition', 'getMaxAddition'] },
  ];
  
  let allGood = true;
  hooks.forEach(hook => {
    const contentCheck = checkFileContent(hook.path, hook.keywords);
    const status = contentCheck.exists && contentCheck.hasKeywords ? '✅' : '❌';
    console.log(`  ${status} ${hook.path}`);
    
    if (!contentCheck.exists) {
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
  console.log('🔍 Verificación Completa de Sección de Productos');
  console.log('='.repeat(60));
  
  const frontendOk = verifyFrontend();
  const apiOk = verifyAPI();
  const migrationsOk = verifyMigrations();
  const hooksOk = verifyHooks();
  
  console.log('\n\n📊 RESUMEN DE VERIFICACIÓN');
  console.log('='.repeat(60));
  console.log(`  Frontend: ${frontendOk ? '✅ Completo' : '❌ Faltan componentes'}`);
  console.log(`  API Routes: ${apiOk ? '✅ Completo' : '❌ Faltan rutas'}`);
  console.log(`  Migraciones: ${migrationsOk ? '✅ Completo' : '❌ Faltan migraciones'}`);
  console.log(`  Hooks y Utilidades: ${hooksOk ? '✅ Completo' : '❌ Faltan hooks'}`);
  
  const allOk = frontendOk && apiOk && migrationsOk && hooksOk;
  
  if (allOk) {
    console.log('\n✅ La sección de Productos está completa y funcional.');
  } else {
    console.log('\n⚠️  Se encontraron problemas. Revisa los detalles arriba.');
  }
  
  return { frontendOk, apiOk, migrationsOk, hooksOk, allOk };
}

if (require.main === module) {
  main();
}

module.exports = { main, verifyFrontend, verifyAPI, verifyMigrations, verifyHooks };
