// Script de seeding para datos de testing
// Este script pobla la base de datos con:
// - SuperAdmin user
// - Categorías
// - Productos (marcos, lentes de sol, accesorios, servicios)
// - Familias de lentes
// - Matrices de precios

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

async function createSuperAdmin() {
  console.log('\n👑 Creando SuperAdmin...');
  
  const email = process.env.ADMIN_EMAIL || 'admin@test.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin123!';
  
  try {
    // Check if user exists
    let userId;
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);
    
    if (existingUser) {
      console.log('✅ Usuario ya existe, actualizando...');
      userId = existingUser.id;
      await supabase.auth.admin.updateUserById(userId, {
        password: password,
        email_confirm: true
      });
    } else {
      // Create user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: 'Super',
          last_name: 'Admin'
        }
      });

      if (authError) {
        console.error('❌ Error creando usuario:', authError);
        return null;
      }
      
      userId = authData.user.id;
      console.log('✅ Usuario creado:', userId);
    }

    // Wait for profile trigger
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update profile
    await supabase
      .from('profiles')
      .update({ membership_tier: 'admin' })
      .eq('id', userId);

    // Create admin_users entry
    // Use 'admin' role (simplified system after migration 20250210000001_simplify_admin_roles)
    const { error: adminError } = await supabase
      .from('admin_users')
      .upsert({
        id: userId,
        email: email,
        role: 'admin', // Simplified to single 'admin' role
        is_active: true
      }, { onConflict: 'id' });

    if (adminError) {
      console.error('⚠️  Error creando entrada admin_users:', adminError);
      return null;
    }

    // Create super admin access (branch_id = NULL means super admin)
    // This gives the user access to all branches
    const { error: accessError } = await supabase
      .from('admin_branch_access')
      .upsert({
        admin_user_id: userId,
        branch_id: null, // NULL = super admin (access to all branches)
        role: 'manager',
        is_primary: false
      }, { 
        onConflict: 'admin_user_id,branch_id',
        // Since branch_id is NULL, we need to handle this specially
        ignoreDuplicates: false
      });

    // If conflict error, try to update existing record
    if (accessError) {
      // Check if record exists
      const { data: existingAccess } = await supabase
        .from('admin_branch_access')
        .select('id')
        .eq('admin_user_id', userId)
        .is('branch_id', null)
        .single();

      if (!existingAccess) {
        // Try insert again without upsert
        const { error: insertError } = await supabase
          .from('admin_branch_access')
          .insert({
            admin_user_id: userId,
            branch_id: null,
            role: 'manager',
            is_primary: false
          });

        if (insertError) {
          console.error('⚠️  Error creando acceso de super admin:', insertError);
        } else {
          console.log('✅ Acceso de super admin creado');
        }
      } else {
        console.log('✅ Acceso de super admin ya existe');
      }
    } else {
      console.log('✅ Acceso de super admin creado');
    }

    console.log('✅ SuperAdmin configurado correctamente');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Permisos: Super Administrador (acceso a todas las sucursales)`);

    return userId;
  } catch (error) {
    console.error('❌ Error en createSuperAdmin:', error);
    return null;
  }
}

async function createCategory(name, slug, description = null, isDefault = false) {
  const { data, error } = await supabase
    .from('categories')
    .upsert({
      name,
      slug,
      description,
      is_active: true,
      is_default: isDefault // Mark default categories as protected
    }, { onConflict: 'slug' })
    .select()
    .single();

  if (error && !error.message.includes('duplicate')) {
    console.error(`❌ Error creando categoría ${name}:`, error);
    return null;
  }

  return data?.id || null;
}

async function createProduct(productData) {
  const { data, error } = await supabase
    .from('products')
    .insert(productData)
    .select()
    .single();

  if (error) {
    console.error(`❌ Error creando producto ${productData.name}:`, error);
    return null;
  }

  return data?.id || null;
}

async function createLensFamily(familyData) {
  const { data, error } = await supabase
    .from('lens_families')
    .insert(familyData)
    .select()
    .single();

  if (error) {
    console.error(`❌ Error creando familia de lentes ${familyData.name}:`, error);
    return null;
  }

  return data?.id || null;
}

async function createPriceMatrix(matrixData) {
  const { data, error } = await supabase
    .from('lens_price_matrices')
    .insert(matrixData)
    .select()
    .single();

  if (error) {
    console.error(`❌ Error creando matriz de precios:`, error);
    return null;
  }

  return data?.id || null;
}

// ============================================================================
// DATOS DE SEEDING
// ============================================================================

async function seedCategories() {
  console.log('\n📁 Creando categorías...');
  
  // Default categories that should be protected from deletion
  const categories = [
    { name: 'Marcos', slug: 'marcos', description: 'Marcos para lentes ópticos', isDefault: true },
    { name: 'Lentes de Sol', slug: 'lentes-de-sol', description: 'Lentes de sol con y sin graduación', isDefault: true },
    { name: 'Accesorios', slug: 'accesorios', description: 'Accesorios para lentes y cuidado', isDefault: true },
    { name: 'Servicios', slug: 'servicios', description: 'Servicios de óptica', isDefault: true }
  ];

  const categoryIds = {};
  
  for (const cat of categories) {
    const id = await createCategory(cat.name, cat.slug, cat.description, cat.isDefault);
    if (id) {
      categoryIds[cat.slug] = id;
      const protected = cat.isDefault ? ' (protegida)' : '';
      console.log(`✅ Categoría creada: ${cat.name}${protected}`);
    }
  }

  return categoryIds;
}

async function seedProducts(categoryIds) {
  console.log('\n🛍️  Creando productos...');

  // 3 MARCOS
  const marcos = [
    {
      name: 'Marco Ray-Ban RB2140 Wayfarer',
      slug: 'marco-ray-ban-rb2140-wayfarer',
      description: 'Marco clásico Wayfarer de Ray-Ban, diseño atemporal en acetato negro. Ideal para uso diario.',
      short_description: 'Marco clásico Wayfarer de Ray-Ban',
      price: 89500,
      price_includes_tax: true,
      cost_price: 45000,
      currency: 'CLP',
      product_type: 'frame',
      optical_category: 'prescription_glasses',
      category_id: categoryIds['marcos'],
      featured_image: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800',
      frame_type: 'full_frame',
      frame_material: 'acetate',
      frame_shape: 'rectangular',
      frame_color: 'Negro',
      frame_brand: 'Ray-Ban',
      frame_model: 'RB2140',
      frame_gender: 'unisex',
      frame_measurements: {
        lens_width: 52,
        bridge_width: 18,
        temple_length: 140,
        lens_height: 40,
        total_width: 140
      },
      status: 'active',
      track_inventory: true,
      inventory_quantity: 15,
      sku: 'RB2140-BLK-001'
    },
    {
      name: 'Marco Oakley OO9208 Holbrook',
      slug: 'marco-oakley-oo9208-holbrook',
      description: 'Marco deportivo Oakley Holbrook con diseño moderno y resistente. Perfecto para estilo casual y deportivo.',
      short_description: 'Marco deportivo Oakley Holbrook',
      price: 125000,
      price_includes_tax: true,
      cost_price: 65000,
      currency: 'CLP',
      product_type: 'frame',
      optical_category: 'prescription_glasses',
      category_id: categoryIds['marcos'],
      featured_image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800',
      frame_type: 'full_frame',
      frame_material: 'acetate',
      frame_shape: 'rectangular',
      frame_color: 'Negro/Gris',
      frame_brand: 'Oakley',
      frame_model: 'OO9208',
      frame_gender: 'unisex',
      frame_measurements: {
        lens_width: 54,
        bridge_width: 19,
        temple_length: 142,
        lens_height: 42,
        total_width: 142
      },
      status: 'active',
      track_inventory: true,
      inventory_quantity: 10,
      sku: 'OO9208-BLK-001'
    },
    {
      name: 'Marco Persol PO3019S',
      slug: 'marco-persol-po3019s',
      description: 'Marco italiano de alta gama Persol, diseño elegante con bisagras característicos. Ideal para ocasiones formales.',
      short_description: 'Marco italiano Persol de alta gama',
      price: 185000,
      price_includes_tax: true,
      cost_price: 95000,
      currency: 'CLP',
      product_type: 'frame',
      optical_category: 'prescription_glasses',
      category_id: categoryIds['marcos'],
      featured_image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800',
      frame_type: 'full_frame',
      frame_material: 'acetate',
      frame_shape: 'round',
      frame_color: 'Tortoise',
      frame_brand: 'Persol',
      frame_model: 'PO3019S',
      frame_gender: 'unisex',
      frame_measurements: {
        lens_width: 51,
        bridge_width: 20,
        temple_length: 145,
        lens_height: 45,
        total_width: 138
      },
      status: 'active',
      track_inventory: true,
      inventory_quantity: 8,
      sku: 'PO3019S-TRT-001'
    }
  ];

  // 3 LENTES DE SOL
  const lentesSol = [
    {
      name: 'Lentes de Sol Ray-Ban Aviator RB3025',
      slug: 'lentes-sol-ray-ban-aviator-rb3025',
      description: 'Lentes de sol clásicos Aviator de Ray-Ban con lentes polarizados. Protección UV400 y diseño icónico.',
      short_description: 'Lentes de sol Aviator Ray-Ban polarizados',
      price: 145000,
      price_includes_tax: true,
      cost_price: 75000,
      currency: 'CLP',
      product_type: 'frame',
      optical_category: 'sunglasses',
      category_id: categoryIds['lentes-de-sol'],
      featured_image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800',
      frame_type: 'aviator',
      frame_material: 'metal',
      frame_shape: 'aviator',
      frame_color: 'Dorado',
      frame_brand: 'Ray-Ban',
      frame_model: 'RB3025',
      frame_gender: 'unisex',
      lens_type: 'single_vision',
      lens_coatings: ['polarized', 'uv_protection'],
      uv_protection: 'uv400',
      frame_measurements: {
        lens_width: 58,
        bridge_width: 15,
        temple_length: 140,
        lens_height: 58,
        total_width: 145
      },
      status: 'active',
      track_inventory: true,
      inventory_quantity: 20,
      sku: 'RB3025-GLD-001'
    },
    {
      name: 'Lentes de Sol Oakley OO9208 Holbrook Polarizados',
      slug: 'lentes-sol-oakley-holbrook-polarizados',
      description: 'Lentes de sol Oakley Holbrook con lentes polarizados HDO. Protección UV400 y diseño deportivo.',
      short_description: 'Lentes de sol Oakley Holbrook polarizados',
      price: 165000,
      price_includes_tax: true,
      cost_price: 85000,
      currency: 'CLP',
      product_type: 'frame',
      optical_category: 'sunglasses',
      category_id: categoryIds['lentes-de-sol'],
      featured_image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800',
      frame_type: 'full_frame',
      frame_material: 'acetate',
      frame_shape: 'rectangular',
      frame_color: 'Negro',
      frame_brand: 'Oakley',
      frame_model: 'OO9208',
      frame_gender: 'unisex',
      lens_type: 'single_vision',
      lens_coatings: ['polarized', 'uv_protection', 'scratch_resistant'],
      uv_protection: 'uv400',
      frame_measurements: {
        lens_width: 54,
        bridge_width: 19,
        temple_length: 142,
        lens_height: 42,
        total_width: 142
      },
      status: 'active',
      track_inventory: true,
      inventory_quantity: 15,
      sku: 'OO9208-SUN-001'
    },
    {
      name: 'Lentes de Sol Maui Jim Peahi',
      slug: 'lentes-sol-maui-jim-peahi',
      description: 'Lentes de sol Maui Jim con tecnología SuperThin Glass y polarización. Protección UV400 y colores vibrantes.',
      short_description: 'Lentes de sol Maui Jim con SuperThin Glass',
      price: 225000,
      price_includes_tax: true,
      cost_price: 115000,
      currency: 'CLP',
      product_type: 'frame',
      optical_category: 'sunglasses',
      category_id: categoryIds['lentes-de-sol'],
      featured_image: 'https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=800',
      frame_type: 'full_frame',
      frame_material: 'metal',
      frame_shape: 'rectangular',
      frame_color: 'Negro/Gris',
      frame_brand: 'Maui Jim',
      frame_model: 'Peahi',
      frame_gender: 'unisex',
      lens_type: 'single_vision',
      lens_coatings: ['polarized', 'uv_protection', 'anti_reflective'],
      uv_protection: 'uv400',
      frame_measurements: {
        lens_width: 56,
        bridge_width: 17,
        temple_length: 145,
        lens_height: 44,
        total_width: 144
      },
      status: 'active',
      track_inventory: true,
      inventory_quantity: 12,
      sku: 'MJ-PEAHI-001'
    }
  ];

  // 3 ACCESORIOS
  const accesorios = [
    {
      name: 'Estuche Rígido para Lentes',
      slug: 'estuche-rigido-lentes',
      description: 'Estuche rígido de alta calidad para proteger tus lentes. Material resistente con forro interior suave.',
      short_description: 'Estuche rígido protector para lentes',
      price: 15000,
      price_includes_tax: true,
      cost_price: 7500,
      currency: 'CLP',
      product_type: 'accessory',
      optical_category: 'accessories',
      category_id: categoryIds['accesorios'],
      featured_image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=800',
      status: 'active',
      track_inventory: true,
      inventory_quantity: 50,
      sku: 'ACC-ESTUCHE-001'
    },
    {
      name: 'Paño de Microfibra para Limpieza',
      slug: 'pano-microfibra-limpieza',
      description: 'Paño de microfibra premium para limpieza de lentes. No raya, no deja residuos. Incluye estuche.',
      short_description: 'Paño de microfibra para limpieza de lentes',
      price: 8500,
      price_includes_tax: true,
      cost_price: 3500,
      currency: 'CLP',
      product_type: 'accessory',
      optical_category: 'accessories',
      category_id: categoryIds['accesorios'],
      featured_image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
      status: 'active',
      track_inventory: true,
      inventory_quantity: 100,
      sku: 'ACC-PANO-001'
    },
    {
      name: 'Spray Limpiador para Lentes',
      slug: 'spray-limpiador-lentes',
      description: 'Spray limpiador profesional para lentes. Fórmula sin alcohol, segura para todos los tipos de lentes y tratamientos.',
      short_description: 'Spray limpiador profesional para lentes',
      price: 12000,
      price_includes_tax: true,
      cost_price: 5000,
      currency: 'CLP',
      product_type: 'accessory',
      optical_category: 'accessories',
      category_id: categoryIds['accesorios'],
      featured_image: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=800',
      status: 'active',
      track_inventory: true,
      inventory_quantity: 80,
      sku: 'ACC-SPRAY-001'
    }
  ];

  // 2 SERVICIOS
  const servicios = [
    {
      name: 'Montaje de Lentes',
      slug: 'servicio-montaje-lentes',
      description: 'Servicio profesional de montaje de lentes en marco. Incluye ajuste de bisagras y patillas.',
      short_description: 'Servicio de montaje de lentes en marco',
      price: 25000,
      price_includes_tax: true,
      cost_price: 0,
      currency: 'CLP',
      product_type: 'service',
      optical_category: 'services',
      category_id: categoryIds['servicios'],
      featured_image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=800',
      status: 'active',
      track_inventory: false,
      inventory_quantity: 0,
      sku: 'SRV-MONTAJE-001'
    },
    {
      name: 'Ajuste y Reparación de Marcos',
      slug: 'servicio-ajuste-reparacion',
      description: 'Servicio de ajuste y reparación de marcos. Incluye enderezado, soldadura y cambio de patillas.',
      short_description: 'Servicio de ajuste y reparación de marcos',
      price: 15000,
      price_includes_tax: true,
      cost_price: 0,
      currency: 'CLP',
      product_type: 'service',
      optical_category: 'services',
      category_id: categoryIds['servicios'],
      featured_image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800',
      status: 'active',
      track_inventory: false,
      inventory_quantity: 0,
      sku: 'SRV-REPARACION-001'
    }
  ];

  const allProducts = [...marcos, ...lentesSol, ...accesorios, ...servicios];
  const productIds = [];

  for (const product of allProducts) {
    const id = await createProduct(product);
    if (id) {
      productIds.push(id);
      console.log(`✅ Producto creado: ${product.name}`);
    }
  }

  console.log(`\n✅ Total productos creados: ${productIds.length}`);
  return productIds;
}

async function seedLensFamilies() {
  console.log('\n👓 Creando familias de lentes...');

  const families = [
    // BIFOCALES
    {
      name: 'Bifocal CR-39 Estándar',
      brand: 'Essilor',
      lens_type: 'bifocal',
      lens_material: 'cr39',
      description: 'Lentes bifocales CR-39 estándar. Ideal para presbicia. Incluye tratamiento anti-reflejante y protección UV.',
      is_active: true
    },
    {
      name: 'Bifocal Policarbonato',
      brand: 'Essilor',
      lens_type: 'bifocal',
      lens_material: 'polycarbonate',
      description: 'Lentes bifocales en policarbonato. Más delgadas y resistentes que CR-39. Incluye tratamiento anti-reflejante y protección UV.',
      is_active: true
    },
    {
      name: 'Bifocal Alto Índice 1.67',
      brand: 'Essilor',
      lens_type: 'bifocal',
      lens_material: 'high_index_1_67',
      description: 'Lentes bifocales alto índice 1.67. Ultra delgadas para graduaciones altas. Incluye tratamiento anti-reflejante y protección UV.',
      is_active: true
    },
    
    // PROGRESIVOS (MULTIFOCALES)
    {
      name: 'Progresivo CR-39 Estándar',
      brand: 'Varilux',
      lens_type: 'progressive',
      lens_material: 'cr39',
      description: 'Lentes progresivas CR-39 estándar. Transición suave entre visión lejana, intermedia y cercana. Incluye tratamiento anti-reflejante y protección UV.',
      is_active: true
    },
    {
      name: 'Progresivo Policarbonato',
      brand: 'Varilux',
      lens_type: 'progressive',
      lens_material: 'polycarbonate',
      description: 'Lentes progresivas en policarbonato. Más delgadas y resistentes. Incluye tratamiento anti-reflejante y protección UV.',
      is_active: true
    },
    {
      name: 'Progresivo Alto Índice 1.67',
      brand: 'Varilux',
      lens_type: 'progressive',
      lens_material: 'high_index_1_67',
      description: 'Lentes progresivas alto índice 1.67. Ultra delgadas para graduaciones altas. Incluye tratamiento anti-reflejante y protección UV.',
      is_active: true
    },
    {
      name: 'Progresivo Alto Índice 1.74',
      brand: 'Varilux',
      lens_type: 'progressive',
      lens_material: 'high_index_1_74',
      description: 'Lentes progresivas alto índice 1.74. Máxima delgadez. Incluye tratamiento anti-reflejante y protección UV.',
      is_active: true
    },
    
    // GAFAS ÓPTICAS DE SOL
    {
      name: 'Monofocal Polarizado CR-39',
      brand: 'Essilor',
      lens_type: 'single_vision',
      lens_material: 'cr39',
      description: 'Lentes monofocales polarizadas CR-39 para gafas de sol. Protección UV400 y reducción de reflejos.',
      is_active: true
    },
    {
      name: 'Monofocal Polarizado Policarbonato',
      brand: 'Essilor',
      lens_type: 'single_vision',
      lens_material: 'polycarbonate',
      description: 'Lentes monofocales polarizadas en policarbonato para gafas de sol. Más delgadas y resistentes. Protección UV400.',
      is_active: true
    },
    {
      name: 'Progresivo Polarizado CR-39',
      brand: 'Varilux',
      lens_type: 'progressive',
      lens_material: 'cr39',
      description: 'Lentes progresivas polarizadas CR-39 para gafas de sol. Ideal para presbicia con protección solar. Protección UV400.',
      is_active: true
    },
    {
      name: 'Progresivo Polarizado Alto Índice 1.67',
      brand: 'Varilux',
      lens_type: 'progressive',
      lens_material: 'high_index_1_67',
      description: 'Lentes progresivas polarizadas alto índice 1.67 para gafas de sol. Ultra delgadas. Protección UV400.',
      is_active: true
    },
    
    // MONOFOCALES ESTÁNDAR
    {
      name: 'Monofocal CR-39 Estándar',
      brand: 'Essilor',
      lens_type: 'single_vision',
      lens_material: 'cr39',
      description: 'Lentes monofocales CR-39 estándar. Incluye tratamiento anti-reflejante y protección UV.',
      is_active: true
    },
    {
      name: 'Monofocal Policarbonato',
      brand: 'Essilor',
      lens_type: 'single_vision',
      lens_material: 'polycarbonate',
      description: 'Lentes monofocales en policarbonato. Más delgadas y resistentes. Incluye tratamiento anti-reflejante y protección UV.',
      is_active: true
    },
    {
      name: 'Monofocal Alto Índice 1.67',
      brand: 'Essilor',
      lens_type: 'single_vision',
      lens_material: 'high_index_1_67',
      description: 'Lentes monofocales alto índice 1.67. Ultra delgadas para graduaciones altas. Incluye tratamiento anti-reflejante y protección UV.',
      is_active: true
    },
    {
      name: 'Monofocal Alto Índice 1.74',
      brand: 'Essilor',
      lens_type: 'single_vision',
      lens_material: 'high_index_1_74',
      description: 'Lentes monofocales alto índice 1.74. Máxima delgadez. Incluye tratamiento anti-reflejante y protección UV.',
      is_active: true
    }
  ];

  const familyIds = [];
  
  for (const family of families) {
    const id = await createLensFamily(family);
    if (id) {
      familyIds.push({ id, ...family });
      console.log(`✅ Familia creada: ${family.name}`);
    }
  }

  console.log(`\n✅ Total familias creadas: ${familyIds.length}`);
  return familyIds;
}

async function seedPriceMatrices(families) {
  console.log('\n💰 Creando matrices de precios...');

  let totalMatrices = 0;

  for (const family of families) {
    // Determinar precios base según tipo y material
    let basePrice = 30000; // Precio base para CR-39 monofocal
    let baseCost = 15000; // Costo base

    // Ajustar según material
    const materialMultiplier = {
      'cr39': 1.0,
      'polycarbonate': 1.3,
      'high_index_1_67': 1.8,
      'high_index_1_74': 2.5,
      'trivex': 1.4,
      'glass': 0.9
    };

    // Ajustar según tipo de lente
    const typeMultiplier = {
      'single_vision': 1.0,
      'bifocal': 1.5,
      'trifocal': 1.8,
      'progressive': 2.0,
      'reading': 0.8,
      'computer': 1.2,
      'sports': 1.3
    };

    const materialMult = materialMultiplier[family.lens_material] || 1.0;
    const typeMult = typeMultiplier[family.lens_type] || 1.0;
    
    basePrice = Math.round(basePrice * materialMult * typeMult);
    baseCost = Math.round(baseCost * materialMult * typeMult);

    // Si es polarizado (gafas de sol), agregar costo adicional
    if (family.name.toLowerCase().includes('polarizado')) {
      basePrice += 25000;
      baseCost += 12000;
    }

    // Crear matrices de precios por rangos de esfera
    const sphereRanges = [
      { min: -10.0, max: -6.0, priceMult: 1.3, costMult: 1.2 },
      { min: -6.0, max: -3.0, priceMult: 1.1, costMult: 1.1 },
      { min: -3.0, max: 0.0, priceMult: 1.0, costMult: 1.0 },
      { min: 0.0, max: 3.0, priceMult: 1.0, costMult: 1.0 },
      { min: 3.0, max: 6.0, priceMult: 1.1, costMult: 1.1 },
      { min: 6.0, max: 10.0, priceMult: 1.3, costMult: 1.2 }
    ];

    // Rangos de cilindro
    const cylinderRanges = [
      { min: -4.0, max: -2.0, priceMult: 1.2, costMult: 1.1 },
      { min: -2.0, max: 0.0, priceMult: 1.0, costMult: 1.0 },
      { min: 0.0, max: 2.0, priceMult: 1.0, costMult: 1.0 },
      { min: 2.0, max: 4.0, priceMult: 1.2, costMult: 1.1 }
    ];

    // Crear matrices para cada combinación de rango
    for (const sphereRange of sphereRanges) {
      for (const cylinderRange of cylinderRanges) {
        const finalPrice = Math.round(basePrice * sphereRange.priceMult * cylinderRange.priceMult);
        const finalCost = Math.round(baseCost * sphereRange.costMult * cylinderRange.costMult);

        // Crear dos matrices: una para 'surfaced' y otra para 'stock' (más barata)
        const sourcingTypes = [
          { type: 'surfaced', price: finalPrice, cost: finalCost },
          { type: 'stock', price: Math.round(finalPrice * 0.85), cost: Math.round(finalCost * 0.80) }
        ];

        for (const sourcing of sourcingTypes) {
          const matrixData = {
            lens_family_id: family.id,
            sphere_min: sphereRange.min,
            sphere_max: sphereRange.max,
            cylinder_min: cylinderRange.min,
            cylinder_max: cylinderRange.max,
            base_price: sourcing.price,
            cost: sourcing.cost,
            sourcing_type: sourcing.type,
            is_active: true
          };

          const id = await createPriceMatrix(matrixData);
          if (id) {
            totalMatrices++;
          }
        }
      }
    }
  }

  console.log(`\n✅ Total matrices de precios creadas: ${totalMatrices}`);
}

// ============================================================================
// FUNCIÓN PRINCIPAL
// ============================================================================

async function main() {
  console.log('🌱 Iniciando seeding de datos de testing...');
  console.log('='.repeat(60));

  try {
    // 1. Crear SuperAdmin
    const adminId = await createSuperAdmin();
    if (!adminId) {
      console.error('❌ No se pudo crear el SuperAdmin. Continuando...');
    }

    // 2. Crear categorías
    const categoryIds = await seedCategories();
    if (!categoryIds || Object.keys(categoryIds).length === 0) {
      console.error('❌ No se pudieron crear las categorías');
      return;
    }

    // 3. Crear productos
    const productIds = await seedProducts(categoryIds);
    if (!productIds || productIds.length === 0) {
      console.error('❌ No se pudieron crear los productos');
      return;
    }

    // 4. Crear familias de lentes
    const families = await seedLensFamilies();
    if (!families || families.length === 0) {
      console.error('❌ No se pudieron crear las familias de lentes');
      return;
    }

    // 5. Crear matrices de precios
    await seedPriceMatrices(families);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Seeding completado exitosamente!');
    console.log('='.repeat(60));
    console.log('\n📊 Resumen:');
    console.log(`   - SuperAdmin: ${adminId ? '✅ Creado' : '❌ Error'}`);
    console.log(`   - Categorías: ${Object.keys(categoryIds).length}`);
    console.log(`   - Productos: ${productIds.length}`);
    console.log(`   - Familias de lentes: ${families.length}`);
    console.log('\n🎉 ¡Base de datos lista para testing!');

  } catch (error) {
    console.error('\n❌ Error durante el seeding:', error);
    process.exit(1);
  }
}

// Ejecutar
main();
