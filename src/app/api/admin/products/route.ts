import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // TEMPORARY: Use service role to bypass RLS for debugging
    // TODO: Revert to createClient() after fixing admin_users table
    const supabase = createServiceRoleClient();
    const { searchParams } = new URL(request.url);

    // Pagination - Accept both page and offset parameters
    const limit = parseInt(searchParams.get('limit') || '12');
    const offsetParam = searchParams.get('offset');
    const pageParam = searchParams.get('page');
    
    // Use offset if provided, otherwise calculate from page
    const offset = offsetParam ? parseInt(offsetParam) : (parseInt(pageParam || '1') - 1) * limit;
    const page = offsetParam ? Math.floor(offset / limit) + 1 : parseInt(pageParam || '1');

    // Filters
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const skinType = searchParams.get('skin_type');
    const minPrice = searchParams.get('min_price');
    const maxPrice = searchParams.get('max_price');
    const featured = searchParams.get('featured');
    const inStock = searchParams.get('in_stock');
    const status = searchParams.get('status');
    const includeArchived = searchParams.get('include_archived') === 'true';

    // Sort
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';

    // Build query with count option
    let query = supabase
      .from('products')
      .select(`
        *,
        categories:category_id (
          id,
          name,
          slug
        ),
        product_variants (
          id,
          title,
          price,
          inventory_quantity,
          option1,
          option2,
          option3,
          is_default
        )
      `, { count: 'exact' });

    // Apply filters
    if (category && category !== 'all') {
      query = query.eq('category_id', category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (skinType) {
      query = query.contains('skin_type', [skinType]);
    }

    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice));
    }

    if (maxPrice) {
      query = query.lte('price', parseFloat(maxPrice));
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    if (inStock === 'true') {
      query = query.gt('inventory_quantity', 0);
    }

    // Status filtering - Admin can see all products
    if (status && status !== 'all') {
      query = query.eq('status', status);
    } else if (!includeArchived) {
      // Default to active products if no specific status requested
      query = query.eq('status', 'active');
    }
    // If includeArchived is true, show all products regardless of status

    // Apply sorting
    const sortColumn = getSortColumn(sortBy);
    const order = getSortOrder(sortBy);
    query = query.order(sortColumn, { ascending: order === 'asc' });

    // Execute query with pagination and get count
    // Note: range() must come AFTER select() for count to work properly
    const { data: products, count, error } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }

    // Calculate pagination info
    const totalPages = Math.ceil((count || 0) / limit);
    const hasMore = page < totalPages;

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
        hasMore,
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST method for creating products
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin status
    const { data: isAdmin } = await supabase.rpc('is_admin', { user_id: user.id })
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: 'Product name is required', field: 'name' },
        { status: 400 }
      );
    }

    if (body.price === undefined || body.price === null || isNaN(parseFloat(body.price))) {
      return NextResponse.json(
        { error: 'Valid price is required', field: 'price' },
        { status: 400 }
      );
    }

    // Generate slug if not provided
    let slug = body.slug?.trim()
    if (!slug) {
      slug = body.name.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      
      // Ensure slug is not empty
      if (!slug) {
        slug = `product-${Date.now()}`
      }
    }
    
    // Always check if slug already exists and append timestamp if needed
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('slug', slug)
      .limit(1)
    
    if (existing && existing.length > 0) {
      slug = `${slug}-${Date.now()}`
    }

    // Prepare product data with defaults
    const productData: any = {
      name: body.name.trim(),
      slug: slug,
      description: body.description || null,
      short_description: body.short_description || null,
      price: parseFloat(body.price),
      compare_at_price: body.compare_at_price ? parseFloat(body.compare_at_price) : null,
      cost_price: body.cost_price ? parseFloat(body.cost_price) : null,
      category_id: body.category_id || null,
      inventory_quantity: body.inventory_quantity ? parseInt(String(body.inventory_quantity)) : 0,
      status: body.status || 'draft',
      featured_image: body.featured_image || null,
      gallery: body.gallery || [],
      skin_type: body.skin_type || [],
      benefits: body.benefits || [],
      ingredients: body.ingredients || null,
      tags: body.tags || [],
      is_featured: body.is_featured || false,
      published_at: body.published_at || (body.status === 'active' ? new Date().toISOString() : null),
    }
    
    // Add optional fields only if they exist (and are valid DB columns)
    if (body.weight !== undefined && body.weight !== null && body.weight !== '') {
      productData.weight = parseFloat(body.weight) || null
    }
    if (body.dimensions !== undefined && body.dimensions !== null && typeof body.dimensions === 'object') {
      productData.dimensions = body.dimensions
    }
    if (body.package_characteristics !== undefined && body.package_characteristics !== null && body.package_characteristics !== '') {
      productData.package_characteristics = body.package_characteristics
    }
    if (body.usage_instructions !== undefined && body.usage_instructions !== null && body.usage_instructions !== '') {
      productData.usage_instructions = body.usage_instructions
    }
    if (body.precautions !== undefined && body.precautions !== null && body.precautions !== '') {
      productData.precautions = body.precautions
    }
    if (body.certifications !== undefined && body.certifications !== null && Array.isArray(body.certifications) && body.certifications.length > 0) {
      productData.certifications = body.certifications
    }
    if (body.shelf_life_months !== undefined && body.shelf_life_months !== null) {
      productData.shelf_life_months = parseInt(String(body.shelf_life_months)) || null
    }
    if (body.sku !== undefined && body.sku !== null && body.sku !== '') {
      productData.sku = body.sku
    }
    if (body.barcode !== undefined && body.barcode !== null && body.barcode !== '') {
      productData.barcode = body.barcode
    }
    if (body.video_url !== undefined && body.video_url !== null && body.video_url !== '') {
      productData.video_url = body.video_url
    }
    if (body.meta_title !== undefined && body.meta_title !== null && body.meta_title !== '') {
      productData.meta_title = body.meta_title
    }
    if (body.meta_description !== undefined && body.meta_description !== null && body.meta_description !== '') {
      productData.meta_description = body.meta_description
    }
    if (body.search_keywords !== undefined && body.search_keywords !== null && Array.isArray(body.search_keywords)) {
      productData.search_keywords = body.search_keywords
    }
    if (body.collections !== undefined && body.collections !== null && Array.isArray(body.collections)) {
      productData.collections = body.collections
    }
    if (body.vendor !== undefined && body.vendor !== null && body.vendor !== '') {
      productData.vendor = body.vendor
    }

    // Try with regular client first, fallback to service role if RLS fails
    let data, error;
    const result = await supabase
      .from('products')
      .insert([productData])
      .select();
    
    data = result.data;
    error = result.error;

    // If RLS error, try with service role client
    if (error && error.code === '42501') {
      console.log('RLS error detected, retrying with service role client');
      const serviceSupabase = createServiceRoleClient();
      const serviceResult = await serviceSupabase
        .from('products')
        .insert([productData])
        .select();
      
      data = serviceResult.data;
      error = serviceResult.error;
    }

    if (error) {
      console.error('Database error creating product:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        productData: productData
      });
      return NextResponse.json(
        { 
          error: error.message || 'Failed to create product',
          details: error.details,
          hint: error.hint
        },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Product was not created - no data returned' },
        { status: 500 }
      );
    }

    return NextResponse.json({ product: data[0] });
  } catch (error: any) {
    console.error('API error creating product:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

function getSortColumn(sortBy: string): string {
  switch (sortBy) {
    case 'price_asc':
    case 'price_desc':
      return 'price';
    case 'name':
      return 'name';
    case 'newest':
      return 'created_at';
    case 'featured':
      return 'is_featured';
    default:
      return 'created_at';
  }
}

function getSortOrder(sort: string) {
  switch (sort) {
    case 'price_asc': return 'asc';
    case 'price_desc': return 'desc';
    case 'name': return 'asc';
    case 'newest': return 'desc';
    case 'featured': return 'desc';
    default: return 'desc';
  }
}