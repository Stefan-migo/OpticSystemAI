// Create admin user via Supabase Auth API
// This ensures the password is hashed correctly for Supabase Auth
//
// ⚠️ SECURITY WARNING: This script is for LOCAL DEVELOPMENT ONLY
// - Never use hardcoded credentials in production
// - Always use environment variables: ADMIN_EMAIL and ADMIN_PASSWORD
// - This script should only be used with local Supabase instances
// - For production, use SQL scripts or proper admin creation workflows

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  // Use environment variables or command line arguments for security
  // Never hardcode credentials in production!
  const email = process.env.ADMIN_EMAIL || process.argv[2] || 'admin@test.com';
  const password = process.env.ADMIN_PASSWORD || process.argv[3] || 'Admin123!';
  
  // Warn if using default credentials
  if (email === 'admin@test.com' && password === 'Admin123!') {
    console.warn('⚠️  WARNING: Using default test credentials!');
    console.warn('⚠️  For production, use environment variables:');
    console.warn('   export ADMIN_EMAIL="your-email@example.com"');
    console.warn('   export ADMIN_PASSWORD="YourSecurePassword123!"');
    console.warn('');
  }

  try {
    // First, check if user already exists
    let userId;
    let userExists = false;
    
    console.log('🔍 Checking for existing user...');
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (!listError && existingUsers?.users) {
      const existingUser = existingUsers.users.find(u => u.email === email);
      if (existingUser) {
        console.log('✅ User already exists, updating...');
        userId = existingUser.id;
        userExists = true;
        
        // Update password if needed
        const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
          password: password,
          email_confirm: true
        });
        
        if (updateError) {
          console.error('⚠️  Error updating user password (may already be correct):', updateError.message);
        } else {
          console.log('✅ User password updated');
        }
      } else {
        console.log('ℹ️  User not found in list, will try to create...');
      }
    } else if (listError) {
      console.log('⚠️  Could not list users:', listError.message);
      console.log('ℹ️  Will try to create user anyway...');
    }
    
    if (!userExists) {
      // Create user via Auth API
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          first_name: 'Admin',
          last_name: 'User'
        }
      });

      if (authError) {
        // If user already exists error, try to find and use existing user
        if (authError.message?.includes('already registered') || authError.status === 422 || authError.code === 'unexpected_failure') {
          console.log('⚠️  User already registered or database error, trying to find existing user...');
          try {
            const { data: existingUsers } = await supabase.auth.admin.listUsers();
            const existingUser = existingUsers?.users?.find(u => u.email === email);
            if (existingUser) {
              userId = existingUser.id;
              userExists = true;
              console.log('✅ Found existing user:', userId);
            } else {
              console.error('Error creating auth user and user not found:', authError);
              console.log('⚠️  Will try to continue with profile/admin setup anyway...');
              return;
            }
          } catch (listErr) {
            console.error('Error listing users:', listErr);
            return;
          }
        } else {
          console.error('Error creating auth user:', authError);
          return;
        }
      } else if (authData?.user) {
        userId = authData.user.id;
        console.log('✅ Auth user created:', userId);
      } else {
        console.error('No user returned from auth');
        return;
      }
    }

    // Wait a moment for profile to be created by trigger
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update profile membership_tier to 'admin'
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ membership_tier: 'admin' })
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating profile:', profileError);
    } else {
      console.log('✅ Profile updated with admin tier');
    }

    // Create admin_users entry
    // Use 'super_admin' as role since 'admin' is not in the allowed values
    const { error: adminError } = await supabase
      .from('admin_users')
      .insert({
        id: userId,
        email: email,
        role: 'super_admin', // Use super_admin instead of admin
        is_active: true
      });

    if (adminError) {
      console.error('Error creating admin_users entry:', adminError);
    } else {
      console.log('✅ Admin user entry created');
    }

    console.log('\n🎉 Admin user created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('User ID:', userId);

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createAdminUser();
