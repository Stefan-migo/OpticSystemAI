import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getBranchContext, addBranchFilter } from '@/lib/api/branch-middleware';

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

    // Get branch context
    const branchContext = await getBranchContext(request, user.id);
    
    // Build branch filter function
    const applyBranchFilter = (query: any) => {
      return addBranchFilter(query, branchContext.branchId, branchContext.isSuperAdmin);
    };

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || '';
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query || query.trim().length === 0) {
      return NextResponse.json({
        success: true,
        products: []
      });
    }

    const trimmedQuery = query.trim();
    
    // Build search conditions - search by name, description, SKU, or barcode
    // For exact matches (SKU/barcode), prioritize them
    let searchConditions = `name.ilike.%${trimmedQuery}%,description.ilike.%${trimmedQuery}%`;
    
    // Add SKU and barcode search if query looks like a code (numbers or alphanumeric)
    if (/^[A-Z0-9]+$/i.test(trimmedQuery)) {
      searchConditions += `,sku.ilike.%${trimmedQuery}%,barcode.ilike.%${trimmedQuery}%`;
    }

    // Build query with branch filter
    let productsQuery = applyBranchFilter(
      supabase
        .from('products')
        .select('id, name, price, price_includes_tax, inventory_quantity, status, featured_image, sku, barcode, product_type, frame_brand, frame_model, frame_color, frame_size')
    )
      .or(searchConditions)
      .eq('status', 'active');

    // Filter by product type if provided
    if (type) {
      productsQuery = productsQuery.eq('product_type', type);
    }

    const { data: products, error: searchError } = await productsQuery
      .order('name', { ascending: true })
      .limit(limit);

    if (searchError) {
      console.error('❌ Error searching products:', searchError);
      return NextResponse.json(
        { error: 'Failed to search products' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      products: products || []
    });

  } catch (error) {
    console.error('❌ Product search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

