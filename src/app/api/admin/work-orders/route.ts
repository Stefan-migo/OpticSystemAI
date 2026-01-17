import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createServiceRoleClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check admin authorization
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: isAdmin } = await supabase.rpc('is_admin', { user_id: user.id });
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'all';
    const customerId = searchParams.get('customer_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build base query
    let query = supabase
      .from('lab_work_orders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: workOrders, error, count } = await query
      .range(from, to);

    if (error) {
      console.error('Error fetching work orders:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch work orders',
        details: error.message 
      }, { status: 500 });
    }

    // Fetch related data separately if work orders exist
    let workOrdersWithRelations = workOrders || [];
    if (workOrdersWithRelations.length > 0) {
      // Fetch customers
      const customerIds = [...new Set(workOrdersWithRelations.map(wo => wo.customer_id).filter(Boolean))];
      const { data: customers } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone')
        .in('id', customerIds);

      // Fetch prescriptions
      const prescriptionIds = [...new Set(workOrdersWithRelations.map(wo => wo.prescription_id).filter(Boolean))];
      const { data: prescriptions } = prescriptionIds.length > 0 ? await supabase
        .from('prescriptions')
        .select('*')
        .in('id', prescriptionIds) : { data: [] };

      // Fetch quotes
      const quoteIds = [...new Set(workOrdersWithRelations.map(wo => wo.quote_id).filter(Boolean))];
      const { data: quotes } = quoteIds.length > 0 ? await supabase
        .from('quotes')
        .select('*')
        .in('id', quoteIds) : { data: [] };

      // Fetch products
      const productIds = [...new Set(workOrdersWithRelations.map(wo => wo.frame_product_id).filter(Boolean))];
      const { data: products } = productIds.length > 0 ? await supabase
        .from('products')
        .select('id, name, price, frame_brand, frame_model')
        .in('id', productIds) : { data: [] };

      // Fetch assigned staff
      const staffIds = [...new Set(workOrdersWithRelations.map(wo => wo.assigned_to).filter(Boolean))];
      const { data: staff } = staffIds.length > 0 ? await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', staffIds) : { data: [] };

      // Map relations to work orders
      workOrdersWithRelations = workOrdersWithRelations.map(workOrder => ({
        ...workOrder,
        customer: customers?.find(c => c.id === workOrder.customer_id) || null,
        prescription: prescriptions?.find(p => p.id === workOrder.prescription_id) || null,
        quote: quotes?.find(q => q.id === workOrder.quote_id) || null,
        frame_product: products?.find(p => p.id === workOrder.frame_product_id) || null,
        assigned_staff: staff?.find(s => s.id === workOrder.assigned_to) || null
      }));
    }

    return NextResponse.json({
      workOrders: workOrdersWithRelations,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Error in work orders API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const supabaseServiceRole = createServiceRoleClient();
    
    // Check admin authorization
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: isAdmin } = await supabase.rpc('is_admin', { user_id: user.id });
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();

    // Generate work order number
    const { data: workOrderNumber, error: workOrderNumberError } = await supabaseServiceRole
      .rpc('generate_work_order_number');

    if (workOrderNumberError || !workOrderNumber) {
      console.error('Error generating work order number:', workOrderNumberError);
      return NextResponse.json({ error: 'Failed to generate work order number' }, { status: 500 });
    }

    // Get prescription snapshot if prescription_id is provided
    let prescriptionSnapshot = null;
    if (body.prescription_id) {
      const { data: prescription } = await supabaseServiceRole
        .from('prescriptions')
        .select('*')
        .eq('id', body.prescription_id)
        .single();
      
      if (prescription) {
        prescriptionSnapshot = prescription;
      }
    }

    // Create work order
    const { data: newWorkOrder, error: workOrderError } = await supabaseServiceRole
      .from('lab_work_orders')
      .insert({
        work_order_number: workOrderNumber,
        customer_id: body.customer_id,
        prescription_id: body.prescription_id || null,
        quote_id: body.quote_id || null,
        frame_product_id: body.frame_product_id || null,
        frame_name: body.frame_name,
        frame_brand: body.frame_brand,
        frame_model: body.frame_model,
        frame_color: body.frame_color,
        frame_size: body.frame_size,
        frame_sku: body.frame_sku,
        frame_serial_number: body.frame_serial_number,
        lens_type: body.lens_type,
        lens_material: body.lens_material,
        lens_index: body.lens_index,
        lens_treatments: body.lens_treatments || [],
        lens_tint_color: body.lens_tint_color,
        lens_tint_percentage: body.lens_tint_percentage,
        prescription_snapshot: prescriptionSnapshot,
        lab_name: body.lab_name,
        lab_contact: body.lab_contact,
        lab_order_number: body.lab_order_number,
        lab_estimated_delivery_date: body.lab_estimated_delivery_date,
        status: body.status || 'quote',
        frame_cost: body.frame_cost || 0,
        lens_cost: body.lens_cost || 0,
        treatments_cost: body.treatments_cost || 0,
        labor_cost: body.labor_cost || 0,
        lab_cost: body.lab_cost || 0,
        subtotal: body.subtotal || 0,
        tax_amount: body.tax_amount || 0,
        discount_amount: body.discount_amount || 0,
        total_amount: body.total_amount,
        currency: body.currency || 'CLP',
        payment_status: body.payment_status || 'pending',
        payment_method: body.payment_method,
        deposit_amount: body.deposit_amount || 0,
        balance_amount: body.balance_amount || body.total_amount || 0,
        pos_order_id: body.pos_order_id || null,
        internal_notes: body.internal_notes,
        customer_notes: body.customer_notes,
        assigned_to: body.assigned_to || user.id,
        created_by: user.id
      })
      .select(`
        *,
        customer:profiles!lab_work_orders_customer_id_fkey(id, first_name, last_name, email, phone),
        prescription:prescriptions!lab_work_orders_prescription_id_fkey(*)
      `)
      .single();

    if (workOrderError) {
      console.error('Error creating work order:', workOrderError);
      return NextResponse.json({ 
        error: 'Failed to create work order', 
        details: workOrderError.message 
      }, { status: 500 });
    }

    // If status is not 'quote', update status dates
    if (body.status && body.status !== 'quote') {
      await supabaseServiceRole.rpc('update_work_order_status', {
        p_work_order_id: newWorkOrder.id,
        p_new_status: body.status,
        p_changed_by: user.id,
        p_notes: 'Work order created'
      });
    }

    // Create notification for new work order (non-blocking)
    if (newWorkOrder) {
      const customerName = newWorkOrder.customer 
        ? `${newWorkOrder.customer.first_name || ''} ${newWorkOrder.customer.last_name || ''}`.trim() || newWorkOrder.customer.email || 'Cliente'
        : 'Cliente';
      
      NotificationService.notifyNewWorkOrder(
        newWorkOrder.id,
        newWorkOrder.work_order_number,
        customerName,
        newWorkOrder.total_amount
      ).catch(err => console.error('Error creating notification:', err));
    }

    return NextResponse.json({
      success: true,
      workOrder: newWorkOrder
    });

  } catch (error) {
    console.error('Error in work orders POST API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

