// Create Root/Dev User for SaaS Management
// This script creates a root or dev user for managing the entire SaaS platform
//
// Usage:
//   node scripts/create-root-user.js
//   OR with custom credentials:
//   ROOT_USER_EMAIL=root@opttius.com ROOT_USER_PASSWORD=SecurePassword123! ROOT_USER_ROLE=root node scripts/create-root-user.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('   Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createRootUser() {
  const email = process.env.ROOT_USER_EMAIL || 'root@opttius.com';
  const password = process.env.ROOT_USER_PASSWORD || 'RootAdmin123!';
  const role = process.env.ROOT_USER_ROLE || 'root'; // 'root' or 'dev'
  const firstName = process.env.ROOT_USER_FIRST_NAME || 'Root';
  const lastName = process.env.ROOT_USER_LAST_NAME || 'Administrator';

  // Validar que el rol sea válido
  if (!['root', 'dev'].includes(role)) {
    console.error('❌ Invalid role. Must be "root" or "dev"');
    process.exit(1);
  }

  console.log('');
  console.log('========================================');
  console.log('Creating Root/Dev User for SaaS Management');
  console.log('========================================');
  console.log('');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('Role:', role);
  console.log('');

  try {
    let userId;
    let userExists = false;

    // Check if user already exists
    console.log('🔍 Checking for existing user...');
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();

    if (!listError && existingUsers?.users) {
      const existingUser = existingUsers.users.find(u => u.email === email);
      if (existingUser) {
        console.log('✅ User already exists, updating...');
        userId = existingUser.id;
        userExists = true;

        // Update password
        const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
          password: password,
          email_confirm: true
        });

        if (updateError) {
          console.warn('⚠️  Error updating password (may already be correct):', updateError.message);
        } else {
          console.log('✅ Password updated');
        }
      }
    }

    // Create user if doesn't exist
    if (!userExists) {
      console.log('📝 Creating new user...');
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName
        }
      });

      if (authError) {
        if (authError.message?.includes('already registered')) {
          console.log('⚠️  User already registered, trying to find...');
          const { data: users } = await supabase.auth.admin.listUsers();
          const user = users?.users?.find(u => u.email === email);
          if (user) {
            userId = user.id;
            userExists = true;
          } else {
            throw new Error('User exists but could not be found');
          }
        } else {
          throw authError;
        }
      } else {
        userId = authData.user.id;
        console.log('✅ User created:', userId);
      }
    }

    // Create/update profile
    console.log('📝 Creating/updating profile...');
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: email,
        first_name: firstName,
        last_name: lastName,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      console.warn('⚠️  Profile error (may already exist):', profileError.message);
    } else {
      console.log('✅ Profile created/updated');
    }

    // Create/update admin_users entry with root/dev role
    console.log('📝 Creating/updating admin_users entry...');
    
    // Permisos completos para root/dev
    const rootPermissions = {
      orders: ['read', 'create', 'update', 'delete'],
      products: ['read', 'create', 'update', 'delete'],
      customers: ['read', 'create', 'update', 'delete'],
      analytics: ['read'],
      settings: ['read', 'create', 'update', 'delete'],
      admin_users: ['read', 'create', 'update', 'delete'],
      support: ['read', 'create', 'update', 'delete'],
      bulk_operations: ['read', 'create', 'update', 'delete'],
      saas_management: ['read', 'create', 'update', 'delete']
    };

    const { error: adminError } = await supabase
      .from('admin_users')
      .upsert({
        id: userId,
        email: email,
        role: role, // 'root' or 'dev'
        organization_id: null, // Root/dev no pertenece a ninguna organización específica
        is_active: true,
        permissions: rootPermissions,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (adminError) {
      throw new Error(`Failed to create admin_users entry: ${adminError.message}`);
    }
    console.log('✅ Admin user created/updated');
    console.log('   Role:', role);
    console.log('   Organization ID: null (SaaS management access)');
    console.log('   Is Active: true');

    // Verificar que el usuario tiene acceso root/dev
    console.log('');
    console.log('🔍 Verifying root/dev access...');
    const { data: verifyAdmin, error: verifyError } = await supabase
      .from('admin_users')
      .select('id, email, role, organization_id, is_active')
      .eq('id', userId)
      .single();

    if (verifyError) {
      console.warn('⚠️  Warning: Could not verify admin user:', verifyError.message);
    } else {
      console.log('✅ Verification successful:');
      console.log('   ID:', verifyAdmin.id);
      console.log('   Email:', verifyAdmin.email);
      console.log('   Role:', verifyAdmin.role);
      console.log('   Organization ID:', verifyAdmin.organization_id);
      console.log('   Is Active:', verifyAdmin.is_active);

      // Verificar función is_root_user
      const { data: isRootCheck, error: isRootError } = await supabase.rpc('is_root_user', {
        user_id: userId
      });

      if (isRootError) {
        console.warn('⚠️  Warning: Could not verify is_root_user function:', isRootError.message);
      } else {
        console.log('✅ is_root_user() check:', isRootCheck ? 'TRUE' : 'FALSE');
        if (isRootCheck) {
          console.log('   ✅ User has root/dev access confirmed!');
        } else {
          console.warn('   ⚠️  Warning: is_root_user() returned false. Check role assignment.');
        }
      }
    }

    console.log('');
    console.log('========================================');
    console.log('✅ Root/Dev User created successfully!');
    console.log('========================================');
    console.log('');
    console.log('Credentials:');
    console.log('  Email:', email);
    console.log('  Password:', password);
    console.log('  Role:', role);
    console.log('  Access: Full SaaS Management (all organizations)');
    console.log('');
    console.log('You can now login at: http://localhost:3000/login');
    console.log('');
    console.log('Note: This user has full access to:');
    console.log('  - All organizations');
    console.log('  - All users');
    console.log('  - All subscriptions');
    console.log('  - SaaS Management panel (/admin/saas-management)');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ Error creating root/dev user:');
    console.error(error.message);
    if (error.details) {
      console.error('Details:', error.details);
    }
    console.error('');
    process.exit(1);
  }
}

createRootUser();
