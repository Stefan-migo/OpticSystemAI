-- Create SuperAdmin User for Demo Organization
-- This script creates a super admin user and assigns them to the demo organization
-- 
-- IMPORTANT: Change the email and password before running this script
-- The password will be hashed using Supabase's auth system
--
-- Usage:
--   1. Edit this file and change DEMO_ADMIN_EMAIL and DEMO_ADMIN_PASSWORD
--   2. Run: docker exec -i supabase_db_web psql -U postgres -d postgres < scripts/sql-utils/create-demo-super-admin.sql
--   OR use Supabase Studio SQL Editor

DO $$
DECLARE
  demo_org_id UUID := '00000000-0000-0000-0000-000000000001'::uuid;
  demo_branch_id UUID := '00000000-0000-0000-0000-000000000002'::uuid;
  demo_admin_email TEXT := 'demo-admin@optica-demo.cl';
  demo_admin_password TEXT := 'DemoAdmin123!';
  user_id UUID;
  user_exists BOOLEAN := false;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Creating SuperAdmin for Demo Organization';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Check if user already exists
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = demo_admin_email;

  IF user_id IS NOT NULL THEN
    user_exists := true;
    RAISE NOTICE '✅ User already exists: % (ID: %)', demo_admin_email, user_id;
  ELSE
    -- Create user in auth.users
    -- Note: In Supabase, we need to use the auth.users table directly
    -- For local development, you can create via Supabase Studio or API
    -- This script assumes the user will be created via Supabase Auth API first
    -- OR you can manually insert into auth.users (not recommended)
    
    RAISE NOTICE '⚠️  User does not exist in auth.users';
    RAISE NOTICE '📝 Please create the user first using one of these methods:';
    RAISE NOTICE '';
    RAISE NOTICE 'Method 1: Using Supabase Studio';
    RAISE NOTICE '   1. Go to Authentication > Users';
    RAISE NOTICE '   2. Click "Add user"';
    RAISE NOTICE '   3. Email: %', demo_admin_email;
    RAISE NOTICE '   4. Password: %', demo_admin_password;
    RAISE NOTICE '   5. Auto-confirm: Yes';
    RAISE NOTICE '';
    RAISE NOTICE 'Method 2: Using Node.js script';
    RAISE NOTICE '   node scripts/create-admin-via-api.js % %', demo_admin_email, demo_admin_password;
    RAISE NOTICE '';
    RAISE NOTICE 'Method 3: Using SQL (requires service_role key)';
    RAISE NOTICE '   See: https://supabase.com/docs/guides/auth/managing-user-data';
    RAISE NOTICE '';
    RAISE NOTICE 'After creating the user, run this script again.';
    RAISE NOTICE '';
    
    -- Try to get user_id again (in case it was created between checks)
    SELECT id INTO user_id
    FROM auth.users
    WHERE email = demo_admin_email;
    
    IF user_id IS NULL THEN
      RAISE EXCEPTION 'User must be created first. See instructions above.';
    END IF;
  END IF;

  -- Create or update profile
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    membership_tier,
    created_at,
    updated_at
  )
  VALUES (
    user_id,
    demo_admin_email,
    'Demo',
    'SuperAdmin',
    'admin',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    membership_tier = 'admin',
    updated_at = NOW();

  RAISE NOTICE '✅ Profile created/updated';

  -- Create or update admin_users entry with super_admin role and demo organization
  INSERT INTO public.admin_users (
    id,
    email,
    role,
    organization_id,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    user_id,
    demo_admin_email,
    'super_admin',
    demo_org_id,
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = 'super_admin',
    organization_id = demo_org_id,
    is_active = true,
    updated_at = NOW();

  RAISE NOTICE '✅ Admin user created/updated with super_admin role';
  RAISE NOTICE '   Organization ID: %', demo_org_id;

  -- Grant access to demo branch
  INSERT INTO public.admin_branch_access (
    admin_user_id,
    branch_id,
    role,
    is_primary,
    created_at,
    updated_at
  )
  VALUES (
    user_id,
    demo_branch_id,
    'manager',
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (admin_user_id, branch_id) DO UPDATE SET
    role = 'manager',
    is_primary = true,
    updated_at = NOW();

  RAISE NOTICE '✅ Branch access granted';
  RAISE NOTICE '   Branch ID: %', demo_branch_id;
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SuperAdmin created successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Credentials:';
  RAISE NOTICE '  Email: %', demo_admin_email;
  RAISE NOTICE '  Password: %', demo_admin_password;
  RAISE NOTICE '  Role: super_admin';
  RAISE NOTICE '  Organization: Óptica Demo Global';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now login at: http://localhost:3000/login';
  RAISE NOTICE '';

END $$;

-- Verify the admin was created correctly
SELECT 
  au.id,
  au.email,
  au.role,
  au.organization_id,
  o.name as organization_name,
  au.is_active,
  aba.branch_id,
  b.name as branch_name,
  aba.role as branch_role,
  au.created_at
FROM public.admin_users au
LEFT JOIN public.organizations o ON au.organization_id = o.id
LEFT JOIN public.admin_branch_access aba ON au.id = aba.admin_user_id
LEFT JOIN public.branches b ON aba.branch_id = b.id
WHERE au.email = 'demo-admin@optica-demo.cl';
