import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createServiceRoleClient } from '@/utils/supabase/server';
import { NotificationService } from '@/lib/notifications/notification-service';
import { validateBranchAccess } from '@/lib/api/branch-middleware';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const { status, notes, ...additionalData } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    // Get old status and branch_id before update
    const { data: workOrderBeforeUpdate } = await supabaseServiceRole
      .from('lab_work_orders')
      .select('status, work_order_number, branch_id')
      .eq('id', id)
      .single();

    if (!workOrderBeforeUpdate) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    // Validate branch access
    const hasAccess = await validateBranchAccess(user.id, workOrderBeforeUpdate.branch_id);
    if (!hasAccess) {
      return NextResponse.json({ 
        error: 'No tiene acceso a este trabajo' 
      }, { status: 403 });
    }

    const oldStatus = workOrderBeforeUpdate.status || 'quote';
    const workOrderNumber = workOrderBeforeUpdate.work_order_number || '';

    // Update work order status using the function
    const { error: statusError } = await supabaseServiceRole.rpc('update_work_order_status', {
      p_work_order_id: id,
      p_new_status: status,
      p_changed_by: user.id,
      p_notes: notes || null
    });

    if (statusError) {
      console.error('Error updating work order status:', statusError);
      return NextResponse.json({ 
        error: 'Failed to update status', 
        details: statusError.message 
      }, { status: 500 });
    }

    // Update additional fields if provided
    if (Object.keys(additionalData).length > 0) {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // Add lab-specific fields
      if (additionalData.lab_name) updateData.lab_name = additionalData.lab_name;
      if (additionalData.lab_contact) updateData.lab_contact = additionalData.lab_contact;
      if (additionalData.lab_order_number) updateData.lab_order_number = additionalData.lab_order_number;
      if (additionalData.lab_estimated_delivery_date) updateData.lab_estimated_delivery_date = additionalData.lab_estimated_delivery_date;
      if (additionalData.lab_notes) updateData.lab_notes = additionalData.lab_notes;
      if (additionalData.quality_notes) updateData.quality_notes = additionalData.quality_notes;
      if (additionalData.internal_notes) updateData.internal_notes = additionalData.internal_notes;
      if (additionalData.customer_notes) updateData.customer_notes = additionalData.customer_notes;
      if (additionalData.assigned_to) updateData.assigned_to = additionalData.assigned_to;
      if (additionalData.lab_contact_person) updateData.lab_contact_person = additionalData.lab_contact_person;

      const { error: updateError } = await supabaseServiceRole
        .from('lab_work_orders')
        .update(updateData)
        .eq('id', id);

      if (updateError) {
        console.error('Error updating work order:', updateError);
        // Don't fail, status was already updated
      }
    }

    // Fetch updated work order
    const { data: updatedWorkOrder, error: fetchError } = await supabaseServiceRole
      .from('lab_work_orders')
      .select(`
        *,
        customer:customers!lab_work_orders_customer_id_fkey(id, first_name, last_name, email, phone),
        prescription:prescriptions!lab_work_orders_prescription_id_fkey(*)
      `)
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching updated work order:', fetchError);
      return NextResponse.json({ 
        error: 'Status updated but failed to fetch updated work order' 
      }, { status: 500 });
    }

    // Create notification for status change (non-blocking)
    if (updatedWorkOrder && oldStatus !== status) {
      NotificationService.notifyWorkOrderStatusChange(
        id,
        updatedWorkOrder.work_order_number,
        oldStatus,
        status
      ).catch(err => console.error('Error creating notification:', err));

      // If status is delivered, also create completion notification
      if (status === 'delivered') {
        const customerName = updatedWorkOrder.customer 
          ? `${updatedWorkOrder.customer.first_name || ''} ${updatedWorkOrder.customer.last_name || ''}`.trim() || updatedWorkOrder.customer.email || 'Cliente'
          : 'Cliente';
        
        NotificationService.notifyWorkOrderCompleted(
          id,
          updatedWorkOrder.work_order_number,
          customerName
        ).catch(err => console.error('Error creating notification:', err));
      }
    }

    return NextResponse.json({
      success: true,
      workOrder: updatedWorkOrder
    });

  } catch (error) {
    console.error('Error in work order status update API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

