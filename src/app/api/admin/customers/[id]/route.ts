import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getBranchContext, addBranchFilter } from '@/lib/api/branch-middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 Customer Detail API GET called for ID:', params.id);
    
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

    // Get customer from customers table (not profiles)
    console.log('🗄️ Fetching customer from customers table...');
    let customerQuery = applyBranchFilter(
      supabase
        .from('customers')
        .select('*')
        .eq('id', params.id)
    );
    
    const { data: customer, error: customerError } = await customerQuery.single();

    if (customerError) {
      console.error('❌ Error fetching customer:', customerError);
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    if (!customer) {
      console.log('❌ Customer not found:', params.id);
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    console.log('✅ Customer found:', customer.email);

    // Get customer orders
    // Note: orders table uses user_id (auth.users), not customer_id
    // For now, we'll search by customer email if available
    console.log('📦 Fetching customer orders...');
    let ordersQuery = applyBranchFilter(
      supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products:product_id (
              id,
              name,
              featured_image
            )
          )
        `)
    );
    
    // Try to find orders by customer email (since orders use user_id, not customer_id)
    if (customer?.email) {
      ordersQuery = ordersQuery.eq('email', customer.email);
    } else {
      // If no email, return empty orders array
      ordersQuery = ordersQuery.eq('id', '00000000-0000-0000-0000-000000000000'); // Non-existent ID
    }
    
    ordersQuery = ordersQuery.order('created_at', { ascending: false });
    
    const { data: orders, error: ordersError } = await ordersQuery;

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError);
      // Continue without orders rather than failing
    }

    console.log('✅ Orders fetched:', orders?.length || 0);


    // Get customer prescriptions (recetas) - filtered by branch
    console.log('👓 Fetching customer prescriptions...');
    const { data: prescriptions, error: prescriptionsError } = await applyBranchFilter(
      supabase
        .from('prescriptions')
        .select('*')
        .eq('customer_id', params.id)
        .order('prescription_date', { ascending: false })
    );

    if (prescriptionsError) {
      console.error('❌ Error fetching prescriptions:', prescriptionsError);
      // Continue without prescriptions rather than failing
    }

    console.log('✅ Prescriptions fetched:', prescriptions?.length || 0);

    // Get customer appointments (citas) - filtered by branch
    console.log('📅 Fetching customer appointments...');
    const { data: appointments, error: appointmentsError } = await applyBranchFilter(
      supabase
        .from('appointments')
        .select('*')
        .eq('customer_id', params.id)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false })
    );

    if (appointmentsError) {
      console.error('❌ Error fetching appointments:', appointmentsError);
      // Continue without appointments rather than failing
    }

    console.log('✅ Appointments fetched:', appointments?.length || 0);

    // Get customer lens purchases - filtered by branch (via customer)
    console.log('🛍️ Fetching customer lens purchases...');
    const { data: lensPurchases, error: lensPurchasesError } = await supabase
      .from('customer_lens_purchases')
      .select('*')
      .eq('customer_id', params.id)
      .order('purchase_date', { ascending: false });

    if (lensPurchasesError) {
      console.error('❌ Error fetching lens purchases:', lensPurchasesError);
      // Continue without lens purchases rather than failing
    }

    console.log('✅ Lens purchases fetched:', lensPurchases?.length || 0);

    // Get customer quotes (presupuestos) - filtered by branch
    console.log('📋 Fetching customer quotes...');
    const { data: quotes, error: quotesError } = await applyBranchFilter(
      supabase
        .from('quotes')
        .select('*')
        .eq('customer_id', params.id)
        .order('created_at', { ascending: false })
    );

    if (quotesError) {
      console.error('❌ Error fetching quotes:', quotesError);
      // Continue without quotes rather than failing
    }

    console.log('✅ Quotes fetched:', quotes?.length || 0);

    // Calculate analytics
    console.log('📊 Calculating customer analytics...');
    const totalSpent = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    const orderCount = orders?.length || 0;
    const avgOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;
    const lastOrderDate = orders?.[0]?.created_at || null;

    // Determine customer segment
    let segment = 'new';
    if (orderCount > 10) segment = 'vip';
    else if (orderCount > 3) segment = 'regular';
    else if (orderCount > 0) segment = 'first-time';

    // Order status counts
    const orderStatusCounts = orders?.reduce((acc: Record<string, number>, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {}) || {};

    // Favorite products (most purchased)
    const productCounts = orders?.reduce((acc: Record<string, any>, order) => {
      order.order_items?.forEach((item: any) => {
        // Try both 'products' and 'product' for compatibility
        const product = item.products || item.product;
        if (product) {
          const productId = product.id;
          if (!acc[productId]) {
            acc[productId] = {
              product: product,
              quantity: 0,
              totalSpent: 0
            };
          }
          acc[productId].quantity += item.quantity;
          acc[productId].totalSpent += item.total_price;
        } else if (item.product_name) {
          // Fallback to using product_name if no product relation
          const productKey = `product_${item.product_id}`;
          if (!acc[productKey]) {
            acc[productKey] = {
              product: {
                id: item.product_id,
                name: item.product_name,
                featured_image: null
              },
              quantity: 0,
              totalSpent: 0
            };
          }
          acc[productKey].quantity += item.quantity;
          acc[productKey].totalSpent += item.total_price;
        }
      });
      return acc;
    }, {}) || {};

    const favoriteProducts = Object.values(productCounts)
      .sort((a: any, b: any) => b.quantity - a.quantity)
      .slice(0, 5);

    // Monthly spending (last 12 months)
    const monthlySpending = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const monthOrders = orders?.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= month && orderDate < nextMonth;
      }) || [];

      const monthAmount = monthOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      
      monthlySpending.push({
        month: month.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' }),
        amount: monthAmount,
        orders: monthOrders.length
      });
    }

    const analytics = {
      totalSpent,
      orderCount,
      lastOrderDate,
      avgOrderValue,
      segment,
      lifetimeValue: totalSpent,
      orderStatusCounts,
      favoriteProducts,
      monthlySpending
    };

    console.log('✅ Analytics calculated successfully');

    return NextResponse.json({
      customer: {
        ...customer,
        orders: orders || [],
        prescriptions: prescriptions || [],
        appointments: appointments || [],
        lensPurchases: lensPurchases || [],
        quotes: quotes || [],
        analytics
      }
    });

  } catch (error) {
    console.error('Error in customer detail API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 Customer Update API PUT called for ID:', params.id);
    
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

    // Get request body
    const body = await request.json();
    console.log('📝 Update data received:', body);

    // Prepare update data for customers table
    const updateData: any = {
      first_name: body.first_name || null,
      last_name: body.last_name || null,
      email: body.email || null,
      phone: body.phone || null,
      rut: body.rut || null,
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
      updated_at: new Date().toISOString()
    };

    // Get branch context for update
    const branchContext = await getBranchContext(request, user.id);
    
    // Build branch filter function
    const applyBranchFilter = (query: any) => {
      return addBranchFilter(query, branchContext.branchId, branchContext.isSuperAdmin);
    };

    console.log('🔄 Updating customer in customers table...');
    // First verify customer exists and user has access
    const { data: existingCustomer } = await applyBranchFilter(
      supabase
        .from('customers')
        .select('id, branch_id')
        .eq('id', params.id)
    ).single();

    if (!existingCustomer) {
      return NextResponse.json({ error: 'Customer not found or access denied' }, { status: 404 });
    }

    // Update customer
    const { data: updatedCustomer, error: updateError } = await supabase
      .from('customers')
      .update({
        ...updateData,
        updated_by: user.id
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating customer:', updateError);
      return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
    }

    if (!updatedCustomer) {
      console.log('❌ Customer not found for update:', params.id);
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    console.log('✅ Customer updated successfully:', updatedCustomer.email);

    return NextResponse.json({
      success: true,
      customer: updatedCustomer
    });

  } catch (error) {
    console.error('Error in customer update API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}