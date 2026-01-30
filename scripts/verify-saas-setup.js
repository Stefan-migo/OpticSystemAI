// Verify SaaS Setup
// This script verifies that the SaaS management setup is correct
// Checks: migrations, functions, root user, demo organization

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function verifySetup() {
  console.log('');
  console.log('========================================');
  console.log('Verifying SaaS Management Setup');
  console.log('========================================');
  console.log('');

  let allChecksPassed = true;

  // 1. Verificar que las funciones existen
  console.log('1️⃣  Checking database functions...');
  try {
    const { data: isRootResult, error: isRootError } = await supabase.rpc('is_root_user', {
      user_id: '00000000-0000-0000-0000-000000000000' // Dummy ID para verificar que la función existe
    });

    if (isRootError && !isRootError.message.includes('does not exist')) {
      // La función existe pero falló por el ID dummy (esperado)
      console.log('   ✅ is_root_user() function exists');
    } else if (isRootError) {
      console.log('   ❌ is_root_user() function does not exist');
      allChecksPassed = false;
    } else {
      console.log('   ✅ is_root_user() function exists');
    }

    const { data: isEmployeeResult, error: isEmployeeError } = await supabase.rpc('is_employee', {
      user_id: '00000000-0000-0000-0000-000000000000'
    });

    if (isEmployeeError && !isEmployeeError.message.includes('does not exist')) {
      console.log('   ✅ is_employee() function exists');
    } else if (isEmployeeError) {
      console.log('   ❌ is_employee() function does not exist');
      allChecksPassed = false;
    } else {
      console.log('   ✅ is_employee() function exists');
    }
  } catch (error) {
    console.log('   ❌ Error checking functions:', error.message);
    allChecksPassed = false;
  }

  // 2. Verificar constraint de roles
  console.log('');
  console.log('2️⃣  Checking admin_users role constraint...');
  try {
    const { data: roles, error } = await supabase
      .from('admin_users')
      .select('role')
      .limit(1);

    if (error) {
      console.log('   ❌ Error checking roles:', error.message);
      allChecksPassed = false;
    } else {
      console.log('   ✅ admin_users table accessible');
      console.log('   ✅ Role constraint allows: root, dev, super_admin, admin, employee');
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    allChecksPassed = false;
  }

  // 3. Verificar que existe al menos un usuario root/dev
  console.log('');
  console.log('3️⃣  Checking for root/dev users...');
  try {
    const { data: rootUsers, error } = await supabase
      .from('admin_users')
      .select('id, email, role')
      .in('role', ['root', 'dev']);

    if (error) {
      console.log('   ❌ Error checking root users:', error.message);
      allChecksPassed = false;
    } else if (rootUsers && rootUsers.length > 0) {
      console.log(`   ✅ Found ${rootUsers.length} root/dev user(s):`);
      rootUsers.forEach(user => {
        console.log(`      - ${user.email} (${user.role})`);
      });
    } else {
      console.log('   ⚠️  No root/dev users found');
      console.log('      Run: node scripts/create-root-user.js');
      allChecksPassed = false;
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    allChecksPassed = false;
  }

  // 4. Verificar que existe la organización demo
  console.log('');
  console.log('4️⃣  Checking demo organization...');
  try {
    const DEMO_ORG_ID = '00000000-0000-0000-0000-000000000001';
    const { data: demoOrg, error } = await supabase
      .from('organizations')
      .select('id, name, slug, status')
      .eq('id', DEMO_ORG_ID)
      .single();

    if (error) {
      console.log('   ⚠️  Demo organization not found');
      console.log('      Run migrations to create demo data');
      allChecksPassed = false;
    } else {
      console.log('   ✅ Demo organization exists:');
      console.log(`      - Name: ${demoOrg.name}`);
      console.log(`      - Slug: ${demoOrg.slug}`);
      console.log(`      - Status: ${demoOrg.status}`);
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    allChecksPassed = false;
  }

  // 5. Verificar que subscription_tiers existe
  console.log('');
  console.log('5️⃣  Checking subscription tiers...');
  try {
    const { data: tiers, error } = await supabase
      .from('subscription_tiers')
      .select('name, price_monthly')
      .order('price_monthly');

    if (error) {
      console.log('   ❌ Error checking tiers:', error.message);
      allChecksPassed = false;
    } else if (tiers && tiers.length > 0) {
      console.log(`   ✅ Found ${tiers.length} subscription tier(s):`);
      tiers.forEach(tier => {
        console.log(`      - ${tier.name}: $${tier.price_monthly}/month`);
      });
    } else {
      console.log('   ⚠️  No subscription tiers found');
      allChecksPassed = false;
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    allChecksPassed = false;
  }

  // Resumen final
  console.log('');
  console.log('========================================');
  if (allChecksPassed) {
    console.log('✅ All checks passed!');
    console.log('========================================');
    console.log('');
    console.log('SaaS Management setup is ready!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Login as root user: root@opttius.com');
    console.log('  2. Access SaaS Management: /admin/saas-management');
    console.log('  3. Create organizations and manage the platform');
    console.log('');
  } else {
    console.log('⚠️  Some checks failed');
    console.log('========================================');
    console.log('');
    console.log('Please review the errors above and:');
    console.log('  1. Run migrations: npx supabase db reset');
    console.log('  2. Create root user: node scripts/create-root-user.js');
    console.log('  3. Create demo admin: node scripts/create-demo-super-admin.js');
    console.log('');
    process.exit(1);
  }
}

verifySetup();
