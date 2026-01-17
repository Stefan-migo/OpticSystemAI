// Fix admin user - Update existing user's profile and admin_users entry
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

async function fixAdminUser() {
  const email = process.env.ADMIN_EMAIL || process.argv[2] || 'admin@test.com';
  
  console.log('🔍 Looking for user:', email);
  
  try {
    // List all users
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      return;
    }
    
    console.log(`Found ${users?.users?.length || 0} users total`);
    
    // Find user by email
    const user = users?.users?.find(u => u.email === email);
    
    if (!user) {
      console.error(`❌ User ${email} not found in auth.users`);
      console.log('Available users:');
      users?.users?.forEach(u => console.log(`  - ${u.email} (${u.id})`));
      return;
    }
    
    console.log('✅ Found user:', user.id);
    
    // Wait a moment for profile to be created by trigger
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update profile membership_tier to 'admin'
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ membership_tier: 'admin' })
      .eq('id', user.id);
    
    if (profileError) {
      console.error('❌ Error updating profile:', profileError);
      // Try to create profile if it doesn't exist
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: email,
          membership_tier: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('❌ Error creating profile:', insertError);
      } else {
        console.log('✅ Profile created with admin tier');
      }
    } else {
      console.log('✅ Profile updated with admin tier');
    }
    
    // Create or update admin_users entry
    // Use 'super_admin' as role since 'admin' is not in the allowed values
    const { error: adminError } = await supabase
      .from('admin_users')
      .upsert({
        id: user.id,
        email: email,
        role: 'super_admin', // Use super_admin instead of admin
        is_active: true,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });
    
    if (adminError) {
      console.error('❌ Error creating/updating admin_users entry:', adminError);
    } else {
      console.log('✅ Admin user entry created/updated');
    }
    
    console.log('\n🎉 Admin user fixed successfully!');
    console.log('Email:', email);
    console.log('User ID:', user.id);
    console.log('\nYou can now log in with:');
    console.log('Email:', email);
    console.log('Password:', process.env.ADMIN_PASSWORD || process.argv[3] || 'Admin123!');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

fixAdminUser();

