import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createServiceRoleClient } from '@/utils/supabase/server';
import { getBranchContext, addBranchFilter } from '@/lib/api/branch-middleware';

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
    
    // Get branch context
    const branchContext = await getBranchContext(request, user.id);
    
    // Build branch filter function
    const applyBranchFilter = (query: any) => {
      return addBranchFilter(query, branchContext.branchId, branchContext.isSuperAdmin);
    };
    
    const supabaseServiceRole = createServiceRoleClient();

    // Check and expire quotes before fetching (including this one)
    await supabaseServiceRole.rpc('check_and_expire_quotes');

    const { data: quote, error } = await applyBranchFilter(
      supabase
        .from('quotes')
        .select(`
          *,
          customer:customers!quotes_customer_id_fkey(id, first_name, last_name, email, phone),
          prescription:prescriptions!quotes_prescription_id_fkey(*),
          frame_product:products!quotes_frame_product_id_fkey(id, name, price, frame_brand, frame_model)
        `)
    )
      .eq('id', id)
      .single();

    if (error || !quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    return NextResponse.json({ quote });

  } catch (error) {
    console.error('Error fetching quote:', error);
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
    
    // Get branch context
    const branchContext = await getBranchContext(request, user.id);
    
    // Build branch filter function
    const applyBranchFilter = (query: any) => {
      return addBranchFilter(query, branchContext.branchId, branchContext.isSuperAdmin);
    };
    
    // First, verify the quote exists and user has access
    const { data: existingQuote, error: fetchError } = await applyBranchFilter(
      supabase
        .from('quotes')
        .select('id, branch_id')
    )
      .eq('id', id)
      .single();
    
    if (fetchError || !existingQuote) {
      return NextResponse.json({ error: 'Presupuesto no encontrado o sin acceso' }, { status: 404 });
    }
    
    const body = await request.json();

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Update fields if provided
    if (body.frame_name !== undefined) updateData.frame_name = body.frame_name;
    if (body.frame_brand !== undefined) updateData.frame_brand = body.frame_brand;
    if (body.frame_model !== undefined) updateData.frame_model = body.frame_model;
    if (body.frame_color !== undefined) updateData.frame_color = body.frame_color;
    if (body.frame_size !== undefined) updateData.frame_size = body.frame_size;
    if (body.frame_sku !== undefined) updateData.frame_sku = body.frame_sku;
    if (body.frame_price !== undefined) updateData.frame_price = body.frame_price;
    if (body.lens_type !== undefined) updateData.lens_type = body.lens_type;
    if (body.lens_material !== undefined) updateData.lens_material = body.lens_material;
    if (body.lens_index !== undefined) updateData.lens_index = body.lens_index;
    if (body.lens_treatments !== undefined) updateData.lens_treatments = body.lens_treatments;
    if (body.lens_tint_color !== undefined) updateData.lens_tint_color = body.lens_tint_color;
    if (body.lens_tint_percentage !== undefined) updateData.lens_tint_percentage = body.lens_tint_percentage;
    if (body.frame_cost !== undefined) updateData.frame_cost = body.frame_cost;
    if (body.lens_cost !== undefined) updateData.lens_cost = body.lens_cost;
    if (body.treatments_cost !== undefined) updateData.treatments_cost = body.treatments_cost;
    if (body.labor_cost !== undefined) updateData.labor_cost = body.labor_cost;
    if (body.subtotal !== undefined) updateData.subtotal = body.subtotal;
    if (body.tax_amount !== undefined) updateData.tax_amount = body.tax_amount;
    if (body.discount_amount !== undefined) updateData.discount_amount = body.discount_amount;
    if (body.discount_percentage !== undefined) updateData.discount_percentage = body.discount_percentage;
    if (body.total_amount !== undefined) updateData.total_amount = body.total_amount;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.customer_notes !== undefined) updateData.customer_notes = body.customer_notes;
    if (body.expiration_date !== undefined) updateData.expiration_date = body.expiration_date;

    const { data: updatedQuote, error } = await supabaseServiceRole
      .from('quotes')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        customer:customers!quotes_customer_id_fkey(id, first_name, last_name, email, phone),
        prescription:prescriptions!quotes_prescription_id_fkey(*)
      `)
      .single();

    if (error) {
      console.error('Error updating quote:', error);
      return NextResponse.json({ error: 'Failed to update quote' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      quote: updatedQuote
    });

  } catch (error) {
    console.error('Error updating quote:', error);
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

    // First, check if the quote exists and if it's converted
    const { data: quote, error: fetchError } = await supabaseServiceRole
      .from('quotes')
      .select('id, status, converted_to_work_order_id')
      .eq('id', id)
      .single();

    if (fetchError || !quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    // Prevent deletion of converted quotes
    if (quote.status === 'converted_to_work' || quote.converted_to_work_order_id) {
      return NextResponse.json({ 
        error: 'No se puede eliminar un presupuesto que ha sido convertido a trabajo' 
      }, { status: 400 });
    }

    // Delete the quote
    const { error: deleteError } = await supabaseServiceRole
      .from('quotes')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting quote:', deleteError);
      return NextResponse.json({ error: 'Failed to delete quote' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Presupuesto eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error deleting quote:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
