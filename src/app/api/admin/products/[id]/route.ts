import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/utils/supabase/server";
import { appLogger as logger } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get("include_archived") === "true";

    let query = supabase.from("products").select("*").eq("id", id);

    if (!includeArchived) {
      query = query.neq("status", "archived");
    }

    const { data: product, error } = await query.single();

    if (error) {
      logger.error("Error fetching product", error);
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error: any) {
    logger.error("API error in products GET", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin status
    const { data: isAdmin } = await supabase.rpc("is_admin", {
      user_id: user.id,
    });
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: "Product name is required" },
        { status: 400 },
      );
    }

    if (
      body.price === undefined ||
      body.price === null ||
      isNaN(parseFloat(body.price))
    ) {
      return NextResponse.json(
        { error: "Valid price is required" },
        { status: 400 },
      );
    }

    // Generate slug if not provided
    let slug = body.slug?.trim();
    if (!slug) {
      slug = body.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      if (!slug) {
        slug = `product-${Date.now()}`;
      }
    }

    // Check for duplicate slug (excluding current product)
    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("slug", slug)
      .neq("id", id)
      .limit(1);

    if (existing && existing.length > 0) {
      slug = `${slug}-${Date.now()}`;
    }

    const productData: any = {
      name: body.name.trim(),
      slug: slug,
      description: body.description || null,
      short_description: body.short_description || null,
      price: parseFloat(body.price),
      compare_at_price: body.compare_at_price
        ? parseFloat(body.compare_at_price)
        : null,
      cost_price: body.cost_price ? parseFloat(body.cost_price) : null,
      category_id: body.category_id || null,
      inventory_quantity: body.inventory_quantity
        ? parseInt(String(body.inventory_quantity))
        : 0,
      status: body.status || "draft",
      featured_image: body.featured_image || null,
      gallery: body.gallery || [],
      tags: body.tags || [],
      // Optical product fields
      product_type: body.product_type || "frame",
      optical_category: body.optical_category || null,
      sku: body.sku || null,
      barcode: body.barcode || null,
      brand: body.brand || null,
      manufacturer: body.manufacturer || null,
      model_number: body.model_number || null,
      // Frame fields
      frame_type: body.frame_type || null,
      frame_material: body.frame_material || null,
      frame_shape: body.frame_shape || null,
      frame_color: body.frame_color || null,
      frame_colors: body.frame_colors || [],
      frame_brand: body.frame_brand || null,
      frame_model: body.frame_model || null,
      frame_sku: body.frame_sku || null,
      frame_gender: body.frame_gender || null,
      frame_age_group: body.frame_age_group || null,
      frame_size: body.frame_size || null,
      frame_features: body.frame_features || [],
      frame_measurements: body.frame_measurements || null,
      // Lens fields
      lens_type: body.lens_type || null,
      lens_material: body.lens_material || null,
      lens_index: body.lens_index ? parseFloat(body.lens_index) : null,
      lens_coatings: body.lens_coatings || [],
      lens_tint_options: body.lens_tint_options || [],
      uv_protection: body.uv_protection || null,
      blue_light_filter: body.blue_light_filter || false,
      blue_light_filter_percentage: body.blue_light_filter_percentage
        ? parseInt(body.blue_light_filter_percentage)
        : null,
      photochromic: body.photochromic || false,
      prescription_available: body.prescription_available || false,
      prescription_range: body.prescription_range || null,
      requires_prescription: body.requires_prescription || false,
      is_customizable: body.is_customizable || false,
      warranty_months: body.warranty_months
        ? parseInt(body.warranty_months)
        : null,
      warranty_details: body.warranty_details || null,
      is_featured: body.is_featured || false,
      updated_at: new Date().toISOString(),
    };

    // Add optional fields
    if (
      body.weight !== undefined &&
      body.weight !== null &&
      body.weight !== ""
    ) {
      productData.weight = parseFloat(body.weight) || null;
    }
    if (
      body.dimensions !== undefined &&
      body.dimensions !== null &&
      typeof body.dimensions === "object"
    ) {
      productData.dimensions = body.dimensions;
    }
    if (
      body.package_characteristics !== undefined &&
      body.package_characteristics !== null &&
      body.package_characteristics !== ""
    ) {
      productData.package_characteristics = body.package_characteristics;
    }
    if (
      body.usage_instructions !== undefined &&
      body.usage_instructions !== null &&
      body.usage_instructions !== ""
    ) {
      productData.usage_instructions = body.usage_instructions;
    }
    if (
      body.precautions !== undefined &&
      body.precautions !== null &&
      body.precautions !== ""
    ) {
      productData.precautions = body.precautions;
    }
    if (
      body.certifications !== undefined &&
      body.certifications !== null &&
      Array.isArray(body.certifications) &&
      body.certifications.length > 0
    ) {
      productData.certifications = body.certifications;
    }
    if (body.published_at !== undefined) {
      productData.published_at = body.published_at;
    }

    // Try with regular client first
    let data, error;
    const result = await supabase
      .from("products")
      .update(productData)
      .eq("id", id)
      .select()
      .single();

    data = result.data;
    error = result.error;

    // If RLS error, try with service role
    if (error && error.code === "42501") {
      const serviceSupabase = createServiceRoleClient();
      const serviceResult = await serviceSupabase
        .from("products")
        .update(productData)
        .eq("id", id)
        .select()
        .single();

      data = serviceResult.data;
      error = serviceResult.error;
    }

    if (error) {
      logger.error("Error updating product", error);
      return NextResponse.json(
        { error: error.message || "Failed to update product" },
        { status: 500 },
      );
    }

    return NextResponse.json({ product: data });
  } catch (error: any) {
    logger.error("API error in products PUT", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin status
    const { data: isAdmin } = await supabase.rpc("is_admin", {
      user_id: user.id,
    });
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    // Try with regular client first
    let error;
    const result = await supabase.from("products").delete().eq("id", id);

    error = result.error;

    // If RLS error, try with service role
    if (error && error.code === "42501") {
      const serviceSupabase = createServiceRoleClient();
      const serviceResult = await serviceSupabase
        .from("products")
        .delete()
        .eq("id", id);

      error = serviceResult.error;
    }

    if (error) {
      logger.error("Error deleting product", error);
      return NextResponse.json(
        { error: error.message || "Failed to delete product" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error("API error in products DELETE", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
