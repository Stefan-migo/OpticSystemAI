import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createServiceRoleClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    const duration = parseInt(searchParams.get('duration') || '30');
    const staffId = searchParams.get('staff_id');

    if (!date) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
    }

    // Get available time slots
    console.log('🔍 Fetching availability for:', { date, duration, staffId });
    
    const { data: slots, error } = await supabaseServiceRole
      .rpc('get_available_time_slots', {
        p_date: date,
        p_duration_minutes: duration,
        p_staff_id: staffId || null
      });

    if (error) {
      console.error('❌ Error fetching available slots:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch available slots',
        details: error.message 
      }, { status: 500 });
    }

    console.log('✅ Available slots returned:', slots?.length || 0, 'slots');
    console.log('📋 Raw slots sample:', JSON.stringify(slots?.slice(0, 3), null, 2));
    
    if (!slots || slots.length === 0) {
      console.warn('⚠️ No slots returned from RPC function');
      return NextResponse.json({
        date,
        duration,
        slots: []
      });
    }

    // Ensure slots are properly formatted
    const formattedSlots = (slots || []).map((slot: any) => {
      let timeSlot = '';
      
      // Handle different TIME formats from PostgreSQL
      if (typeof slot.time_slot === 'string') {
        timeSlot = slot.time_slot;
      } else if (slot.time_slot) {
        // If it's a TIME object, convert to string
        const timeValue = slot.time_slot;
        if (typeof timeValue === 'object' && 'hours' in timeValue && 'minutes' in timeValue) {
          timeSlot = `${String(timeValue.hours).padStart(2, '0')}:${String(timeValue.minutes).padStart(2, '0')}`;
        } else {
          timeSlot = timeValue.toString();
        }
      }
      
      // Format time to HH:MM (remove seconds if present)
      if (timeSlot.includes(':')) {
        const parts = timeSlot.split(':');
        timeSlot = `${parts[0]}:${parts[1]}`;
      }
      
      // Handle boolean availability (PostgreSQL returns 't'/'f' as strings sometimes)
      let isAvailable = true;
      if (typeof slot.available === 'boolean') {
        isAvailable = slot.available;
      } else if (typeof slot.available === 'string') {
        isAvailable = slot.available === 't' || slot.available === 'true';
      } else if (slot.available !== undefined && slot.available !== null) {
        isAvailable = Boolean(slot.available);
      }
      
      return {
        time_slot: timeSlot,
        available: isAvailable
      };
    }).filter(slot => slot.time_slot); // Filter out empty time slots

    console.log('Formatted slots:', formattedSlots.slice(0, 5));

    return NextResponse.json({
      date,
      duration,
      slots: formattedSlots
    });

  } catch (error) {
    console.error('Error in availability API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

