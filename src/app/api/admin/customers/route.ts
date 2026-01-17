import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/utils/supabase/server';
import { NotificationService } from '@/lib/notifications/notification-service';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Customers API GET called');
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    console.log('📊 Query params:', { search, status, page, limit });

    const supabase = await createClient();
    
    // Check admin authorization
    console.log('🔐 Checking user authentication...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ User authentication failed:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('✅ User authenticated:', user.email);

    console.log('🔒 Checking admin privileges...');
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin', { user_id: user.id });
    if (adminError) {
      console.error('❌ Admin check error:', adminError);
      return NextResponse.json({ error: 'Admin verification failed' }, { status: 500 });
    }
    if (!isAdmin) {
      console.log('❌ User is not admin:', user.email);
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    console.log('✅ Admin access confirmed for:', user.email);

    // Build the query to get customers from profiles table
    console.log('🗄️ Building database query...');
    let query = supabase
      .from('profiles')
      .select(`
        *
      `);

    // Apply filters
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    

    // Get total count for pagination
    console.log('📊 Getting customer count...');
    const { count, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error getting customer count:', countError);
      return NextResponse.json({ error: 'Failed to count customers' }, { status: 500 });
    }
    console.log('✅ Customer count:', count);

    // Apply pagination and ordering
    console.log('📋 Executing main query with pagination...');
    const { data: customers, error } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching customers:', error);
      return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
    }
    console.log('✅ Customers fetched successfully:', customers?.length || 0);

    // Calculate customer analytics
    console.log('📊 Calculating customer analytics...');
    const customerStats = customers?.map(customer => {
      // Basic segment classification based on order count
      let segment = 'new';
      // Segment will be calculated based on orders in the detail endpoint

      return {
        ...customer,
        analytics: {
          totalSpent: 0, // TODO: Calculate from orders
          orderCount: 0, // TODO: Calculate from orders
          lastOrderDate: null, // TODO: Get from orders
          avgOrderValue: 0, // TODO: Calculate from orders
          segment,
          lifetimeValue: 0 // TODO: Calculate from orders
        }
      };
    });

    return NextResponse.json({
      customers: customerStats,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Error in customers API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handle both analytics and customer creation
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check admin authorization
    console.log('🔐 Checking user authentication...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ User authentication failed:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('✅ User authenticated:', user.email);

    console.log('🔒 Checking admin privileges...');
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin', { user_id: user.id });
    if (adminError) {
      console.error('❌ Admin check error:', adminError);
      return NextResponse.json({ error: 'Admin verification failed' }, { status: 500 });
    }
    if (!isAdmin) {
      console.log('❌ User is not admin:', user.email);
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    console.log('✅ Admin access confirmed for:', user.email);

    // Get request body to determine action
    const body = await request.json();
    
    // Check if this is a customer creation request (has first_name or last_name)
    // Analytics requests have empty body or only summary-related fields
    const isCustomerCreation = body.first_name || body.last_name;
    
    if (isCustomerCreation) {
      console.log('🔍 Customers API POST called (create new customer)');
      console.log('📝 Create customer data received:', body);

      // Validate required fields
      if (!body.first_name && !body.last_name) {
        return NextResponse.json({ error: 'At least first name or last name is required' }, { status: 400 });
      }

      // Generate a temporary email if none provided (for customers without email)
      const customerEmail = body.email?.trim() || `no-email-${crypto.randomUUID()}@temporal.local`;
      const hasRealEmail = !!body.email?.trim();

      // Check if profile already exists (only if email is provided)
      if (hasRealEmail) {
        const { data: existingProfile, error: checkProfileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', customerEmail)
          .maybeSingle();

        if (existingProfile) {
          console.log('❌ Profile with this email already exists');
          return NextResponse.json({ 
            error: 'Ya existe un cliente con este email. Por favor, utiliza otro email o edita el cliente existente.' 
          }, { status: 400 });
        }
      }

      // Use service role client to create auth user
      const supabaseServiceRole = await createServiceRoleClient();

      // Generate a random password (customer will reset it later if they have email)
      const randomPassword = crypto.randomUUID();

      console.log('👤 Creating Supabase Auth user with service role...');
      const { data: authData, error: authError } = await supabaseServiceRole.auth.admin.createUser({
        email: customerEmail,
        password: randomPassword,
        email_confirm: true, // Auto-confirm email for admin-created users
        user_metadata: {
          first_name: body.first_name || '',
          last_name: body.last_name || '',
          created_by_admin: true,
          admin_created_at: new Date().toISOString(),
          has_real_email: hasRealEmail
        }
      });

      if (authError) {
        console.error('❌ Error creating auth user:', authError);
        
        // Check if it's a duplicate email error in auth
        if (authError.message?.includes('already registered') || authError.message?.includes('User already registered')) {
          return NextResponse.json({ 
            error: 'Este email ya está registrado en el sistema de autenticación. El cliente puede iniciar sesión o recuperar su contraseña.' 
          }, { status: 400 });
        }
        
        return NextResponse.json({ 
          error: `Error al crear usuario: ${authError.message}` 
        }, { status: 500 });
      }

      console.log('✅ Auth user created:', authData.user?.email);

      // Now create/update the profile with additional data
      const profileData = {
        id: authData.user.id,
        first_name: body.first_name || null,
        last_name: body.last_name || null,
        email: hasRealEmail ? customerEmail : null, // Store null if no real email provided
        phone: body.phone || null,
        rut: body.rut || null,
        address_line_1: body.address_line_1 || null,
        address_line_2: body.address_line_2 || null,
        city: body.city || null,
        state: body.state || null,
        postal_code: body.postal_code || null,
        country: body.country || 'Chile',
        updated_at: new Date().toISOString()
      };

      console.log('🔄 Creating/updating customer profile...');
      const { data: newCustomer, error: profileError } = await supabaseServiceRole
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' })
        .select()
        .single();

      if (profileError) {
        console.error('❌ Error creating profile:', profileError);
        
        // Try to clean up the auth user if profile creation failed
        try {
          await supabaseServiceRole.auth.admin.deleteUser(authData.user.id);
          console.log('🧹 Cleaned up orphaned auth user');
        } catch (cleanupError) {
          console.error('⚠️ Could not clean up auth user:', cleanupError);
        }
        
        return NextResponse.json({ error: 'Failed to create customer profile' }, { status: 500 });
      }

      if (!newCustomer) {
        console.error('❌ Customer profile was not created');
        return NextResponse.json({ error: 'Failed to create customer profile' }, { status: 500 });
      }

      console.log('✅ Customer profile created successfully:', newCustomer.email || 'No email (temporal)');

      // Create notification for new customer (non-blocking)
      const customerName = `${body.first_name || ''} ${body.last_name || ''}`.trim() || 'Cliente';
      NotificationService.notifyNewCustomer(
        newCustomer.id,
        customerName,
        hasRealEmail ? customerEmail : undefined
      ).catch(err => console.error('Error creating notification:', err));

      // Send welcome email and password reset email (only if customer has real email)
      if (hasRealEmail) {
        try {
          const { EmailNotificationService } = await import('@/lib/email/notifications');
          
          // Send welcome email
          const customerName = `${body.first_name || ''} ${body.last_name || ''}`.trim() || 'Cliente';
          await EmailNotificationService.sendAccountWelcome(customerName, customerEmail);
          console.log('✅ Welcome email sent successfully');

          // Send password reset email so customer can set their own password
          console.log('📧 Sending password reset email to customer...');
          const { error: resetError } = await supabaseServiceRole.auth.resetPasswordForEmail(
            customerEmail,
            {
              redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`
            }
          );

          if (resetError) {
            console.warn('⚠️ Could not send password reset email:', resetError.message);
            // Don't fail the entire operation for email issues
          } else {
            console.log('✅ Password reset email sent successfully');
          }
        } catch (emailError) {
          console.warn('⚠️ Email sending error (non-critical):', emailError);
          // Continue - customer can use "forgot password" later
        }
      } else {
        console.log('ℹ️ Skipping email notifications - customer has no email address');
      }

      return NextResponse.json({
        success: true,
        customer: newCustomer
      });
    } else {
      // This is an analytics request
      console.log('🔍 Customers API POST called (analytics summary)');

      // Get customer analytics summary
      const { data: totalCustomers, count: totalCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { data: activeCustomers, count: activeCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active_customer', true);

      const { data: recentCustomers, count: recentCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      return NextResponse.json({
        summary: {
          totalCustomers: totalCount || 0,
          activeCustomers: activeCount || totalCount || 0,
          newCustomersThisMonth: recentCount || 0
        }
      });
    }

  } catch (error) {
    console.error('Error in customers API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
