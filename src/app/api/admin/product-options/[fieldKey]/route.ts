import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';

const supabase = createServiceRoleClient();

// GET - Fetch options for a specific field key
export async function GET(
  request: NextRequest,
  { params }: { params: { fieldKey: string } }
) {
  try {
    const { fieldKey } = params;
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('include_inactive') === 'true';

    const { data: field, error: fieldError } = await supabase
      .from('product_option_fields')
      .select('*')
      .eq('field_key', fieldKey)
      .single();

    if (fieldError || !field) {
      return NextResponse.json(
        { error: 'Campo no encontrado' },
        { status: 404 }
      );
    }

    let valuesQuery = supabase
      .from('product_option_values')
      .select('*')
      .eq('field_id', field.id)
      .order('display_order', { ascending: true });

    if (!includeInactive) {
      valuesQuery = valuesQuery.eq('is_active', true);
    }

    const { data: values, error: valuesError } = await valuesQuery;

    if (valuesError) {
      console.error('Error fetching option values:', valuesError);
      return NextResponse.json(
        { error: 'Error al obtener valores de opción' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      field,
      values: values || []
    });
  } catch (error) {
    console.error('Error in GET /api/admin/product-options/[fieldKey]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

