import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { NotificationService } from '@/lib/notifications/notification-service';
import { getBranchContext, addBranchFilter } from '@/lib/api/branch-middleware';

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

    // Get branch context
    const branchContext = await getBranchContext(request, user.id);
    
    // Build branch filter function
    const applyBranchFilter = (query: any) => {
      return addBranchFilter(query, branchContext.branchId, branchContext.isSuperAdmin);
    };

    // Build the query to get customers from customers table (not profiles)
    console.log('🗄️ Building database query...');
    let query = applyBranchFilter(
      supabase
        .from('customers')
        .select('*')
    );

    // Apply filters
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,rut.ilike.%${search}%`);
    }
    
    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }

    // Get total count for pagination
    console.log('📊 Getting customer count...');
    const countQuery = applyBranchFilter(
      supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
    );
    
    if (search) {
      countQuery.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,rut.ilike.%${search}%`);
    }
    
    if (status === 'active') {
      countQuery.eq('is_active', true);
    } else if (status === 'inactive') {
      countQuery.eq('is_active', false);
    }
    
    const { count, error: countError } = await countQuery;

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

      // Get branch context
      const branchContext = await getBranchContext(request, user.id);
      
      console.log('📊 Branch context for customer creation:', {
        branchId: branchContext.branchId,
        isGlobalView: branchContext.isGlobalView,
        isSuperAdmin: branchContext.isSuperAdmin,
        bodyBranchId: body.branch_id
      });
      
      // Validate required fields
      if (!body.first_name && !body.last_name) {
        return NextResponse.json({ error: 'At least first name or last name is required' }, { status: 400 });
      }

      // Determine customer branch_id
      // Priority: 1) branchContext.branchId (from header - selected branch), 2) body.branch_id (explicit), 3) error
      let customerBranchId: string | null = null;
      
      // First, try to use branch from context (header) - this is the selected branch
      if (branchContext.branchId) {
        customerBranchId = branchContext.branchId;
        console.log('✅ Using branch_id from context (selected branch):', customerBranchId);
      } else if (body.branch_id) {
        // If no branch in context but provided in body (super admin in global view)
        customerBranchId = body.branch_id;
        console.log('✅ Using branch_id from request body:', customerBranchId);
      } else if (branchContext.isGlobalView && branchContext.isSuperAdmin) {
        // Super admin in global view must provide branch_id in body
        return NextResponse.json({ 
          error: 'Como super administrador en vista global, debe especificar la sucursal para el cliente' 
        }, { status: 400 });
      } else {
        // Regular admin must have a branch selected
        return NextResponse.json({ 
          error: 'Debe seleccionar una sucursal para crear un cliente' 
        }, { status: 400 });
      }

      if (!customerBranchId) {
        return NextResponse.json({ error: 'Debe especificar una sucursal para el cliente' }, { status: 400 });
      }

      // Check if customer already exists in this branch (by email, phone, or RUT)
      const existingCustomerQuery = supabase
        .from('customers')
        .select('id')
        .eq('branch_id', customerBranchId);

      if (body.email?.trim()) {
        const { data: existingByEmail } = await existingCustomerQuery
          .eq('email', body.email.trim())
          .maybeSingle();
        
        if (existingByEmail) {
          return NextResponse.json({ 
            error: 'Ya existe un cliente con este email en esta sucursal.' 
          }, { status: 400 });
        }
      }

      if (body.rut?.trim()) {
        const { data: existingByRut } = await existingCustomerQuery
          .eq('rut', body.rut.trim())
          .maybeSingle();
        
        if (existingByRut) {
          return NextResponse.json({ 
            error: 'Ya existe un cliente con este RUT en esta sucursal.' 
          }, { status: 400 });
        }
      }

      // Create customer data (NO auth user creation - customers don't need authentication)
      const customerData = {
        branch_id: customerBranchId,
        first_name: body.first_name || null,
        last_name: body.last_name || null,
        email: body.email?.trim() || null,
        phone: body.phone?.trim() || null,
        rut: body.rut?.trim() || null,
        date_of_birth: body.date_of_birth || null,
        gender: body.gender || null,
        address_line_1: body.address_line_1 || null,
        address_line_2: body.address_line_2 || null,
        city: body.city || null,
        state: body.state || null,
        postal_code: body.postal_code || null,
        country: body.country || 'Chile',
        medical_conditions: body.medical_conditions || null,
        allergies: body.allergies || null,
        medications: body.medications || null,
        medical_notes: body.medical_notes || null,
        last_eye_exam_date: body.last_eye_exam_date || null,
        next_eye_exam_due: body.next_eye_exam_due || null,
        preferred_contact_method: body.preferred_contact_method || null,
        emergency_contact_name: body.emergency_contact_name || null,
        emergency_contact_phone: body.emergency_contact_phone || null,
        insurance_provider: body.insurance_provider || null,
        insurance_policy_number: body.insurance_policy_number || null,
        notes: body.notes || null,
        tags: body.tags || null,
        is_active: body.is_active !== undefined ? body.is_active : true,
        created_by: user.id
      };

      console.log('🔄 Creating customer...');
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert(customerData)
        .select()
        .single();

      if (customerError) {
        console.error('❌ Error creating customer:', customerError);
        return NextResponse.json({ 
          error: `Error al crear cliente: ${customerError.message}` 
        }, { status: 500 });
      }

      if (!newCustomer) {
        console.error('❌ Customer was not created');
        return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
      }

      console.log('✅ Customer created successfully:', newCustomer.id);

      // Create notification for new customer (non-blocking)
      const customerName = `${body.first_name || ''} ${body.last_name || ''}`.trim() || 'Cliente';
      NotificationService.notifyNewCustomer(
        newCustomer.id,
        customerName,
        body.email?.trim() || undefined
      ).catch(err => console.error('Error creating notification:', err));

      return NextResponse.json({
        success: true,
        customer: newCustomer
      });
    } else {
      // This is an analytics request
      console.log('🔍 Customers API POST called (analytics summary)');

      // Get branch context
      const branchContext = await getBranchContext(request, user.id);
      
      // Build branch filter function
      const applyBranchFilter = (query: any) => {
        return addBranchFilter(query, branchContext.branchId, branchContext.isSuperAdmin);
      };

      // Get customer analytics summary (filtered by branch)
      const { count: totalCount } = await applyBranchFilter(
        supabase
          .from('customers')
          .select('*', { count: 'exact', head: true })
      );

      const { count: activeCount } = await applyBranchFilter(
        supabase
          .from('customers')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)
      );

      const { count: recentCount } = await applyBranchFilter(
        supabase
          .from('customers')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      );

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
