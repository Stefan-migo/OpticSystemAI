import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createServiceRoleClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const { data: appointment, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Fetch related data manually
    const appointmentWithRelations = { ...appointment };

    // Fetch customer
    if (appointment.customer_id) {
      const { data: customer } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone')
        .eq('id', appointment.customer_id)
        .single();
      appointmentWithRelations.customer = customer || null;
    }

    // Fetch assigned staff
    if (appointment.assigned_to) {
      const { data: staff } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('id', appointment.assigned_to)
        .single();
      appointmentWithRelations.assigned_staff = staff || null;
    }

    // Fetch prescription
    if (appointment.prescription_id) {
      const { data: prescription } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('id', appointment.prescription_id)
        .single();
      appointmentWithRelations.prescription = prescription || null;
    }

    // Fetch order
    if (appointment.order_id) {
      const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('id', appointment.order_id)
        .single();
      appointmentWithRelations.order = order || null;
    }

    return NextResponse.json({ appointment: appointmentWithRelations });

  } catch (error) {
    console.error('Error fetching appointment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    // If date/time is being changed, check availability
    if (body.appointment_date || body.appointment_time || body.duration_minutes) {
      // Get current appointment to use for availability check
      const { data: currentAppointment } = await supabaseServiceRole
        .from('appointments')
        .select('appointment_date, appointment_time, duration_minutes, assigned_to')
        .eq('id', id)
        .single();

      const checkDate = body.appointment_date || currentAppointment?.appointment_date;
      const checkTime = body.appointment_time || currentAppointment?.appointment_time;
      const checkDuration = body.duration_minutes || currentAppointment?.duration_minutes || 30;
      const checkStaffId = body.assigned_to || currentAppointment?.assigned_to || null;

      const { data: isAvailable, error: availabilityError } = await supabaseServiceRole
        .rpc('check_appointment_availability', {
          p_date: checkDate,
          p_time: checkTime,
          p_duration_minutes: checkDuration,
          p_appointment_id: id, // Exclude current appointment
          p_staff_id: checkStaffId
        });

      if (availabilityError) {
        console.error('Error checking availability:', availabilityError);
        return NextResponse.json({ 
          error: 'Error checking availability',
          details: availabilityError.message 
        }, { status: 500 });
      }

      if (!isAvailable) {
        return NextResponse.json({ 
          error: 'El horario seleccionado no está disponible',
          code: 'SLOT_NOT_AVAILABLE'
        }, { status: 400 });
      }
    }

    // Update appointment
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (body.appointment_date !== undefined) updateData.appointment_date = body.appointment_date;
    if (body.appointment_time !== undefined) updateData.appointment_time = body.appointment_time;
    if (body.duration_minutes !== undefined) updateData.duration_minutes = body.duration_minutes;
    if (body.appointment_type !== undefined) updateData.appointment_type = body.appointment_type;
    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else if (body.status === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
        if (body.cancellation_reason) {
          updateData.cancellation_reason = body.cancellation_reason;
        }
      }
    }
    if (body.assigned_to !== undefined) updateData.assigned_to = body.assigned_to;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.reason !== undefined) updateData.reason = body.reason;
    if (body.outcome !== undefined) updateData.outcome = body.outcome;
    if (body.follow_up_required !== undefined) updateData.follow_up_required = body.follow_up_required;
    if (body.follow_up_date !== undefined) updateData.follow_up_date = body.follow_up_date;
    if (body.prescription_id !== undefined) updateData.prescription_id = body.prescription_id;
    if (body.order_id !== undefined) updateData.order_id = body.order_id;
    if (body.cancellation_reason !== undefined) updateData.cancellation_reason = body.cancellation_reason;

    const { data: updatedAppointment, error } = await supabaseServiceRole
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating appointment:', error);
      return NextResponse.json({ 
        error: 'Failed to update appointment',
        details: error.message 
      }, { status: 500 });
    }

    // Fetch related data manually
    const appointmentWithRelations = { ...updatedAppointment };

    // Fetch customer
    if (updatedAppointment.customer_id) {
      const { data: customer } = await supabaseServiceRole
        .from('profiles')
        .select('id, first_name, last_name, email, phone')
        .eq('id', updatedAppointment.customer_id)
        .single();
      appointmentWithRelations.customer = customer || null;
    }

    // Fetch assigned staff
    if (updatedAppointment.assigned_to) {
      const { data: staff } = await supabaseServiceRole
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('id', updatedAppointment.assigned_to)
        .single();
      appointmentWithRelations.assigned_staff = staff || null;
    }

    return NextResponse.json({
      success: true,
      appointment: appointmentWithRelations
    });

  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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

    const { error } = await supabaseServiceRole
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting appointment:', error);
      return NextResponse.json({ 
        error: 'Failed to delete appointment',
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

