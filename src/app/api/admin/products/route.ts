import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/utils/supabase/server";
import { getBranchContext } from "@/lib/api/branch-middleware";
import { appLogger as logger } from "@/lib/logger";
import type { IsAdminParams, IsAdminResult } from "@/types/supabase-rpc";
import { withRateLimit, rateLimitConfigs } from "@/lib/api/middleware";
import { RateLimitError, ValidationError } from "@/lib/api/errors";
import {
  createProductSchema,
  searchProductSchema,
  paginationSchema,
} from "@/lib/api/validation/zod-schemas";
import {
  parseAndValidateBody,
  parseAndValidateQuery,
  validationErrorResponse,
} from "@/lib/api/validation/zod-helpers";

export async function GET(request: NextRequest) {
  try {
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
    const { data: isAdmin } = (await supabase.rpc("is_admin", {
      user_id: user.id,
    } as IsAdminParams)) as { data: IsAdminResult | null; error: Error | null };
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    // Get branch context
    const branchContext = await getBranchContext(request, user.id);

    const { searchParams } = new URL(request.url);

    // Pagination - Accept both page and offset parameters
    const limit = parseInt(searchParams.get("limit") || "12");
    const offsetParam = searchParams.get("offset");
    const pageParam = searchParams.get("page");

    // Use offset if provided, otherwise calculate from page
    const offset = offsetParam
      ? parseInt(offsetParam)
      : (parseInt(pageParam || "1") - 1) * limit;
    const page = offsetParam
      ? Math.floor(offset / limit) + 1
      : parseInt(pageParam || "1");

    // Filters
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const skinType = searchParams.get("skin_type");
    const minPrice = searchParams.get("min_price");
    const maxPrice = searchParams.get("max_price");
    const featured = searchParams.get("featured");
    const inStock = searchParams.get("in_stock");
    const lowStockOnly = searchParams.get("low_stock_only") === "true";
    const status = searchParams.get("status");
    const includeArchived = searchParams.get("include_archived") === "true";

    // Sort
    const sortBy = searchParams.get("sort_by") || "created_at";
    const sortOrder = searchParams.get("sort_order") || "desc";

    // Build query with count option
    let query = supabase.from("products").select(
      `
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
      `,
      { count: "exact" },
    );

    // Filter by branch if not super admin or if specific branch is selected
    if (branchContext.branchId) {
      query = query.eq("branch_id", branchContext.branchId);
    } else if (!branchContext.isSuperAdmin) {
      // Regular admin without branch selected - show only their accessible branches
      // This will be handled by RLS, but we can also filter explicitly
      const accessibleBranchIds = branchContext.accessibleBranches.map(
        (b) => b.id,
      );
      if (accessibleBranchIds.length > 0) {
        query = query.in("branch_id", accessibleBranchIds);
      } else {
        // No accessible branches - return empty
        return NextResponse.json({
          products: [],
          pagination: {
            page: 1,
            limit: parseInt(searchParams.get("limit") || "12"),
            total: 0,
            totalPages: 0,
            hasMore: false,
          },
        });
      }
    }
    // Super admin in global view sees all products (no filter)

    // Apply filters
    if (category && category !== "all") {
      query = query.eq("category_id", category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (skinType) {
      query = query.contains("skin_type", [skinType]);
    }

    if (minPrice) {
      query = query.gte("price", parseFloat(minPrice));
    }

    if (maxPrice) {
      query = query.lte("price", parseFloat(maxPrice));
    }

    if (featured === "true") {
      query = query.eq("is_featured", true);
    }

    if (inStock === "true") {
      query = query.gt("inventory_quantity", 0);
    }

    if (lowStockOnly) {
      query = query.lte("inventory_quantity", 5);
    }

    // Status filtering - Admin can see all products
    if (status && status !== "all") {
      query = query.eq("status", status);
    } else if (!includeArchived) {
      // Default to active products if no specific status requested
      query = query.eq("status", "active");
    }
    // If includeArchived is true, show all products regardless of status

    // Apply sorting
    const sortColumn = getSortColumn(sortBy);
    const order = getSortOrder(sortBy);
    query = query.order(sortColumn, { ascending: order === "asc" });

    // Execute query with pagination and get count
    // Note: range() must come AFTER select() for count to work properly
    const {
      data: products,
      count,
      error,
    } = await query.range(offset, offset + limit - 1);

    if (error) {
      logger.error("Database error fetching products", error);
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 },
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
    logger.error("API error in products GET", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST method for creating products
export async function POST(request: NextRequest) {
  return (withRateLimit(rateLimitConfigs.modification) as any)(
    request,
    async () => {
      try {
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
        const { data: isAdmin } = (await supabase.rpc("is_admin", {
          user_id: user.id,
        } as IsAdminParams)) as {
          data: IsAdminResult | null;
          error: Error | null;
        };
        if (!isAdmin) {
          return NextResponse.json(
            { error: "Admin access required" },
            { status: 403 },
          );
        }

        // Get branch context
        const branchContext = await getBranchContext(request, user.id);

        // Get request body first (needed for fields not in Zod schema)
        let body: any;
        try {
          body = await request.json();
        } catch (error) {
          return NextResponse.json(
            { error: "Invalid JSON in request body" },
            { status: 400 },
          );
        }

        // Validate request body with Zod (only fields in schema)
        let validatedBody;
        try {
          validatedBody = await parseAndValidateBody(
            request,
            createProductSchema,
          );
        } catch (error) {
          if (error instanceof ValidationError) {
            return validationErrorResponse(error);
          }
          throw error;
        }

        // Debug: Log branch context
        logger.debug("Branch context for product creation", {
          body_branch_id: validatedBody.branch_id,
          context_branch_id: branchContext.branchId,
          is_super_admin: branchContext.isSuperAdmin,
          accessible_branches: branchContext.accessibleBranches.map(
            (b) => b.id,
          ),
        });

        // Use branch_id from body, or current branch context, or null for super admin
        const productBranchId =
          validatedBody.branch_id || branchContext.branchId || null;

        // Validate branch_id is provided (required for product creation, except for super admins)
        if (!productBranchId && !branchContext.isSuperAdmin) {
          logger.warn(
            "Validation failed: No branch_id provided and user is not super admin",
          );
          return NextResponse.json(
            {
              error:
                "branch_id is required. Debes seleccionar una sucursal para crear productos.",
              field: "branch_id",
            },
            { status: 400 },
          );
        }

        // If not super admin, validate they have access to the branch
        if (!branchContext.isSuperAdmin && productBranchId) {
          const hasAccess = branchContext.accessibleBranches.some(
            (b) => b.id === productBranchId,
          );
          if (!hasAccess) {
            return NextResponse.json(
              { error: "No tienes acceso a esta sucursal", field: "branch_id" },
              { status: 403 },
            );
          }
        }

        logger.debug("Creating product with data", {
          name: validatedBody.name,
          product_type: validatedBody.product_type,
          has_optical_fields: !!validatedBody.optical_category,
          has_frame_fields: !!validatedBody.frame_type,
          has_lens_fields: !!validatedBody.lens_type,
        });

        // Price ya está validado por Zod
        logger.debug("Price validation", {
          price: validatedBody.price,
          type: typeof validatedBody.price,
        });

        // Generate slug if not provided
        let slug = validatedBody.slug?.trim();
        if (!slug) {
          slug = validatedBody.name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Remove accents
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

          // Ensure slug is not empty
          if (!slug) {
            slug = `product-${Date.now()}`;
          }
        }

        // Always check if slug already exists and append timestamp if needed
        const { data: existing } = await supabase
          .from("products")
          .select("id")
          .eq("slug", slug)
          .limit(1);

        if (existing && existing.length > 0) {
          slug = `${slug}-${Date.now()}`;
        }

        // Prepare product data with defaults
        // Usar validatedBody para campos validados por Zod, y body para campos adicionales opcionales
        const productData: Record<string, unknown> = {
          name: validatedBody.name.trim(),
          slug: slug,
          description: validatedBody.description || null,
          short_description: validatedBody.short_description || null,
          price:
            typeof validatedBody.price === "number"
              ? validatedBody.price
              : parseFloat(String(validatedBody.price)),
          compare_at_price: validatedBody.compare_at_price || null,
          cost_price: validatedBody.cost_price || null,
          price_includes_tax: validatedBody.price_includes_tax ?? false,
          category_id: validatedBody.category_id || null,
          branch_id: productBranchId, // Associate product with branch
          inventory_quantity: 0, // Will be managed in product_branch_stock
          status: validatedBody.status || "draft",
          featured_image: validatedBody.featured_image || null,
          gallery: validatedBody.gallery || [],
          tags: validatedBody.tags || [],
          is_featured: validatedBody.is_featured || false,
          published_at:
            validatedBody.published_at ||
            (validatedBody.status === "active"
              ? new Date().toISOString()
              : null),
          // Optical product fields
          product_type: validatedBody.product_type || "frame",
          optical_category: validatedBody.optical_category || null,
          sku: validatedBody.sku || null,
          barcode: validatedBody.barcode || null,
          brand: validatedBody.brand || null,
          manufacturer: validatedBody.manufacturer || null,
          model_number: validatedBody.model_number || null,
          // Frame fields
          frame_type: validatedBody.frame_type || null,
          frame_material: validatedBody.frame_material || null,
          frame_shape: validatedBody.frame_shape || null,
          frame_color: validatedBody.frame_color || null,
          frame_size: validatedBody.frame_size || null,
          frame_bridge_width: validatedBody.frame_bridge_width || null,
          frame_temple_length: validatedBody.frame_temple_length || null,
          frame_lens_width: validatedBody.frame_lens_width || null,
          frame_lens_height: validatedBody.frame_lens_height || null,
          // Lens fields
          lens_type: validatedBody.lens_type || null,
          lens_material: validatedBody.lens_material || null,
          lens_coating: validatedBody.lens_coating || null,
          lens_prescription_type: validatedBody.lens_prescription_type || null,
          // Additional optional fields from body (not in schema yet)
          frame_colors: (body as any).frame_colors || [],
          frame_brand: (body as any).frame_brand || null,
          frame_model: (body as any).frame_model || null,
          frame_sku: (body as any).frame_sku || null,
          frame_gender: (body as any).frame_gender || null,
          frame_age_group: (body as any).frame_age_group || null,
          frame_features: (body as any).frame_features || [],
          frame_measurements: (body as any).frame_measurements || null,
          lens_index: (body as any).lens_index
            ? parseFloat((body as any).lens_index)
            : null,
          lens_coatings: (body as any).lens_coatings || [],
          lens_tint_options: (body as any).lens_tint_options || [],
          uv_protection: (body as any).uv_protection || null,
          blue_light_filter: (body as any).blue_light_filter || false,
          blue_light_filter_percentage: (body as any)
            .blue_light_filter_percentage
            ? parseInt((body as any).blue_light_filter_percentage)
            : null,
          photochromic: (body as any).photochromic || false,
          prescription_available: (body as any).prescription_available || false,
          prescription_range: (body as any).prescription_range || null,
          requires_prescription: (body as any).requires_prescription || false,
          is_customizable: (body as any).is_customizable || false,
          warranty_months: (body as any).warranty_months
            ? parseInt((body as any).warranty_months)
            : null,
          warranty_details: (body as any).warranty_details || null,
        };

        // Add optional fields only if they exist (and are valid DB columns)
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
          body.shelf_life_months !== undefined &&
          body.shelf_life_months !== null
        ) {
          productData.shelf_life_months =
            parseInt(String(body.shelf_life_months)) || null;
        }
        if (body.sku !== undefined && body.sku !== null && body.sku !== "") {
          productData.sku = body.sku;
        }
        if (
          body.barcode !== undefined &&
          body.barcode !== null &&
          body.barcode !== ""
        ) {
          productData.barcode = body.barcode;
        }
        if (
          body.video_url !== undefined &&
          body.video_url !== null &&
          body.video_url !== ""
        ) {
          productData.video_url = body.video_url;
        }
        if (
          body.meta_title !== undefined &&
          body.meta_title !== null &&
          body.meta_title !== ""
        ) {
          productData.meta_title = body.meta_title;
        }
        if (
          body.meta_description !== undefined &&
          body.meta_description !== null &&
          body.meta_description !== ""
        ) {
          productData.meta_description = body.meta_description;
        }
        if (
          body.search_keywords !== undefined &&
          body.search_keywords !== null &&
          Array.isArray(body.search_keywords)
        ) {
          productData.search_keywords = body.search_keywords;
        }
        if (
          body.collections !== undefined &&
          body.collections !== null &&
          Array.isArray(body.collections)
        ) {
          productData.collections = body.collections;
        }
        if (
          body.vendor !== undefined &&
          body.vendor !== null &&
          body.vendor !== ""
        ) {
          productData.vendor = body.vendor;
        }

        // Convert empty strings to null for all string fields to avoid database constraint issues
        Object.keys(productData).forEach((key) => {
          if (
            typeof productData[key] === "string" &&
            productData[key].trim() === ""
          ) {
            productData[key] = null;
          }
        });

        logger.debug("Prepared product data (sample)", {
          name: productData.name,
          product_type: productData.product_type,
          sku: productData.sku,
          frame_type: productData.frame_type,
          lens_type: productData.lens_type,
        });

        // Try with regular client first, fallback to service role if RLS fails
        let data, error;
        const result = await supabase
          .from("products")
          .insert([productData])
          .select();

        data = result.data;
        error = result.error;

        // If RLS error, try with service role client
        if (error && error.code === "42501") {
          logger.debug("RLS error detected, retrying with service role client");
          const serviceSupabase = createServiceRoleClient();
          const serviceResult = await serviceSupabase
            .from("products")
            .insert([productData])
            .select();

          data = serviceResult.data;
          error = serviceResult.error;
        }

        if (error) {
          logger.error("Database error creating product", error, {
            code: error.code,
            details: error.details,
            hint: error.hint,
            productData: productData,
          });
          return NextResponse.json(
            {
              error: error.message || "Failed to create product",
              details: error.details,
              hint: error.hint,
            },
            { status: 500 },
          );
        }

        if (!data || data.length === 0) {
          return NextResponse.json(
            { error: "Product was not created - no data returned" },
            { status: 500 },
          );
        }

        const createdProduct = data[0];

        // Create stock entry in product_branch_stock if branch_id is provided
        if (productBranchId && body.inventory_quantity !== undefined) {
          const inventoryQty = parseInt(String(body.inventory_quantity)) || 0;
          const serviceSupabase = createServiceRoleClient();

          const { error: stockError } = await serviceSupabase
            .from("product_branch_stock")
            .upsert(
              {
                product_id: createdProduct.id,
                branch_id: productBranchId,
                quantity: inventoryQty,
                reserved_quantity: 0,
                low_stock_threshold: 5,
              },
              {
                onConflict: "product_id,branch_id",
              },
            );

          if (stockError) {
            logger.error("Error creating product stock", stockError);
            // Don't fail the product creation, just log the error
            // The stock can be added later
          }
        }

        return NextResponse.json({ product: createdProduct });
      } catch (error) {
        if (error instanceof RateLimitError) {
          logger.warn("Rate limit exceeded for product creation", {
            error: error.message,
          });
          return NextResponse.json({ error: error.message }, { status: 429 });
        }
        logger.error("API error creating product", { error });
        return NextResponse.json(
          {
            error:
              error instanceof Error ? error.message : "Internal server error",
          },
          { status: 500 },
        );
      }
    },
  )(request);
}

function getSortColumn(sortBy: string): string {
  switch (sortBy) {
    case "price_asc":
    case "price_desc":
      return "price";
    case "name":
      return "name";
    case "newest":
      return "created_at";
    case "featured":
      return "is_featured";
    default:
      return "created_at";
  }
}

function getSortOrder(sort: string) {
  switch (sort) {
    case "price_asc":
      return "asc";
    case "price_desc":
      return "desc";
    case "name":
      return "asc";
    case "newest":
      return "desc";
    case "featured":
      return "desc";
    default:
      return "desc";
  }
}
