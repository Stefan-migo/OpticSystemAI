import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Dashboard API called');
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

    // Fetch all data in parallel
    const [productsResult, ordersResult, customersResult] = await Promise.all([
      // Products - only active ones
      supabase
        .from('products')
        .select('*')
        .eq('status', 'active'),
      
      // Orders
      supabase
        .from('orders')
        .select(`
          *,
          order_items (
            product_id,
            quantity,
            unit_price,
            total_price,
            product_name
          )
        `)
        .order('created_at', { ascending: false }),
      
      // Customers
      supabase
        .from('profiles')
        .select('*')
    ]);

    if (productsResult.error) {
      console.error('❌ Error fetching products:', productsResult.error);
    }
    if (ordersResult.error) {
      console.error('❌ Error fetching orders:', ordersResult.error);
    }
    if (customersResult.error) {
      console.error('❌ Error fetching customers:', customersResult.error);
    }

    const products = productsResult.data || [];
    const orders = ordersResult.data || [];
    const customers = customersResult.data || [];

    // Calculate date ranges
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // === PRODUCTS METRICS ===
    const activeProducts = products.filter(p => p.status === 'active');
    const lowStockProducts = activeProducts
      .filter(p => (p.inventory_quantity || 0) <= 5 && (p.inventory_quantity || 0) > 0)
      .map(p => ({
        id: p.id,
        name: p.name,
        currentStock: p.inventory_quantity || 0,
        threshold: 5,
        slug: p.slug
      }))
      .sort((a, b) => a.currentStock - b.currentStock)
      .slice(0, 5);
    
    const outOfStockProducts = activeProducts.filter(p => (p.inventory_quantity || 0) === 0).length;

    // === ORDERS METRICS ===
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const processingOrders = orders.filter(o => o.status === 'processing').length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const failedOrders = orders.filter(o => o.status === 'failed').length;

    // === REVENUE METRICS ===
    // Current month revenue (from completed or paid orders)
    const currentMonthOrders = orders.filter(o => {
      const orderDate = new Date(o.created_at);
      return orderDate >= startOfMonth && 
             (o.status === 'completed' || o.payment_status === 'paid');
    });
    const currentMonthRevenue = currentMonthOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

    // Last month revenue for comparison
    const lastMonthOrders = orders.filter(o => {
      const orderDate = new Date(o.created_at);
      return orderDate >= startOfLastMonth && 
             orderDate <= endOfLastMonth &&
             (o.status === 'completed' || o.payment_status === 'paid');
    });
    const lastMonthRevenue = lastMonthOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

    // Calculate revenue change
    const revenueChange = lastMonthRevenue > 0 
      ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0;

    // === CUSTOMERS METRICS ===
    const newCustomers = customers.filter(c => 
      new Date(c.created_at) >= thirtyDaysAgo
    ).length;
    const returningCustomers = customers.length - newCustomers;

    // === APPOINTMENTS METRICS (Optical Shop) ===
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: appointmentsData } = await supabase
      .from('appointments')
      .select('*')
      .gte('appointment_date', today.toISOString().split('T')[0])
      .lt('appointment_date', tomorrow.toISOString().split('T')[0]);

    const appointments = appointmentsData || [];
    const todayAppointments = appointments.length;
    const scheduledAppointments = appointments.filter(a => a.status === 'scheduled').length;
    const confirmedAppointments = appointments.filter(a => a.status === 'confirmed').length;
    const pendingAppointments = appointments.filter(a => a.status === 'scheduled' || a.status === 'pending').length;

    // === WORK ORDERS METRICS (Optical Shop) ===
    const { data: workOrdersData } = await supabase
      .from('lab_work_orders')
      .select('*');

    const workOrders = workOrdersData || [];
    // Trabajos en progreso: enviados al lab, en lab, listos en lab, recibidos, montados, control calidad
    const inProgressWorkOrders = workOrders.filter(wo => 
      ['sent_to_lab', 'in_progress_lab', 'ready_at_lab', 'received_from_lab', 'mounted', 'quality_check'].includes(wo.status)
    ).length;
    // Trabajos nuevos/pendientes: ordenados (recién creados, no enviados aún)
    const pendingWorkOrders = workOrders.filter(wo => 
      wo.status === 'ordered' || wo.status === 'quote'
    ).length;
    // Trabajos completados: entregados
    const completedWorkOrders = workOrders.filter(wo => 
      wo.status === 'delivered'
    ).length;

    // === QUOTES METRICS (Optical Shop) ===
    const { data: quotesData } = await supabase
      .from('quotes')
      .select('*');

    const quotes = quotesData || [];
    // Presupuestos pendientes: borrador, enviado (esperando respuesta)
    const pendingQuotes = quotes.filter(q => 
      ['draft', 'sent'].includes(q.status) && !q.converted_to_work_order_id
    ).length;
    // Presupuestos convertidos: aceptados o convertidos a trabajo
    const convertedQuotes = quotes.filter(q => 
      q.status === 'accepted' || q.converted_to_work_order_id
    ).length;

    // === TODAY'S APPOINTMENTS ===
    const { data: todayAppointmentsData } = await supabase
      .from('appointments')
      .select('*')
      .eq('appointment_date', today.toISOString().split('T')[0])
      .order('appointment_time', { ascending: true })
      .limit(10);

    // Fetch customer data manually
    const customerIds = [...new Set((todayAppointmentsData || []).map((a: any) => a.customer_id).filter(Boolean))];
    const { data: customersData } = customerIds.length > 0
      ? await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, phone')
          .in('id', customerIds)
      : { data: [] };

    const todayAppointmentsList = (todayAppointmentsData || []).map((apt: any) => {
      const customer = customersData?.find((c: any) => c.id === apt.customer_id);
      return {
        id: apt.id,
        customer_name: customer
          ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email || 'Cliente'
          : 'Cliente',
        customer_email: customer?.email || null,
        appointment_time: apt.appointment_time,
        appointment_type: apt.appointment_type || 'consultation',
        status: apt.status,
        duration_minutes: apt.duration_minutes || 30,
        notes: apt.notes
      };
    });

    // === REVENUE TREND (Last 7 days) ===
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayOrders = orders.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate >= date && 
               orderDate < nextDate && 
               (o.status === 'completed' || o.payment_status === 'paid');
      });
      
      const dayRevenue = dayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      
      last7Days.push({
        date: date.toISOString().split('T')[0],
        revenue: dayRevenue,
        orders: dayOrders.length
      });
    }

    // === ORDERS STATUS DISTRIBUTION (Last 30 days) ===
    const last30DaysOrders = orders.filter(o => 
      new Date(o.created_at) >= thirtyDaysAgo
    );

    const statusDistribution = {
      pending: last30DaysOrders.filter(o => o.status === 'pending').length,
      processing: last30DaysOrders.filter(o => o.status === 'processing').length,
      completed: last30DaysOrders.filter(o => o.status === 'completed').length,
      failed: last30DaysOrders.filter(o => o.status === 'failed').length,
      shipped: last30DaysOrders.filter(o => o.status === 'shipped').length
    };

    // === TOP PRODUCTS (by revenue) ===
    const productRevenue = new Map();
    
    orders
      .filter(o => o.status === 'completed' || o.payment_status === 'paid')
      .forEach(order => {
        order.order_items?.forEach((item: any) => {
          const current = productRevenue.get(item.product_name) || { revenue: 0, quantity: 0 };
          productRevenue.set(item.product_name, {
            revenue: current.revenue + (item.total_price || 0),
            quantity: current.quantity + (item.quantity || 0)
          });
        });
      });

    const topProducts = Array.from(productRevenue.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    console.log('✅ Dashboard data fetched successfully');

    return NextResponse.json({
      kpis: {
        products: {
          total: activeProducts.length,
          lowStock: lowStockProducts.length,
          outOfStock: outOfStockProducts
        },
        orders: {
          total: orders.length,
          pending: pendingOrders,
          processing: processingOrders,
          completed: completedOrders,
          failed: failedOrders
        },
        revenue: {
          current: currentMonthRevenue,
          previous: lastMonthRevenue,
          change: revenueChange,
          currency: 'CLP'
        },
        customers: {
          total: customers.length,
          new: newCustomers,
          returning: returningCustomers
        },
        appointments: {
          today: todayAppointments,
          scheduled: scheduledAppointments,
          confirmed: confirmedAppointments,
          pending: pendingAppointments
        },
        workOrders: {
          total: workOrders.length,
          inProgress: inProgressWorkOrders,
          pending: pendingWorkOrders,
          completed: completedWorkOrders
        },
        quotes: {
          total: quotes.length,
          pending: pendingQuotes,
          converted: convertedQuotes
        }
      },
      todayAppointments: todayAppointmentsList,
      lowStockProducts,
      charts: {
        revenueTrend: last7Days,
        ordersStatus: statusDistribution,
        topProducts
      }
    });

  } catch (error) {
    console.error('❌ Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

