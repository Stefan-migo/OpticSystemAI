import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/utils/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    const { searchParams } = new URL(request.url)
    const includeArchived = searchParams.get('include_archived') === 'true'
    
    let query = supabase
      .from('products')
      .select('*')
      .eq('id', id)
    
    if (!includeArchived) {
      query = query.neq('status', 'archived')
    }
    
    const { data: product, error } = await query.single()

    if (error) {
      console.error('Error fetching product:', error)
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ product })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
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

    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      )
    }

    if (body.price === undefined || body.price === null || isNaN(parseFloat(body.price))) {
      return NextResponse.json(
        { error: 'Valid price is required' },
        { status: 400 }
      )
    }

    // Generate slug if not provided
    let slug = body.slug?.trim()
    if (!slug) {
      slug = body.name.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      
      if (!slug) {
        slug = `product-${Date.now()}`
      }
    }

    // Check for duplicate slug (excluding current product)
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('slug', slug)
      .neq('id', id)
      .limit(1)
    
    if (existing && existing.length > 0) {
      slug = `${slug}-${Date.now()}`
    }

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
      updated_at: new Date().toISOString(),
    }

    // Add optional fields
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
    if (body.published_at !== undefined) {
      productData.published_at = body.published_at
    }

    // Try with regular client first
    let data, error
    const result = await supabase
      .from('products')
      .update(productData)
      .eq('id', id)
      .select()
      .single()
    
    data = result.data
    error = result.error

    // If RLS error, try with service role
    if (error && error.code === '42501') {
      const serviceSupabase = createServiceRoleClient()
      const serviceResult = await serviceSupabase
        .from('products')
        .update(productData)
        .eq('id', id)
        .select()
        .single()
      
      data = serviceResult.data
      error = serviceResult.error
    }

    if (error) {
      console.error('Error updating product:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to update product' },
        { status: 500 }
      )
    }

    return NextResponse.json({ product: data })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
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

    // Try with regular client first
    let error
    const result = await supabase
      .from('products')
      .delete()
      .eq('id', id)
    
    error = result.error

    // If RLS error, try with service role
    if (error && error.code === '42501') {
      const serviceSupabase = createServiceRoleClient()
      const serviceResult = await serviceSupabase
        .from('products')
        .delete()
        .eq('id', id)
      
      error = serviceResult.error
    }

    if (error) {
      console.error('Error deleting product:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to delete product' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
