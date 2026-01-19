import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/server";
import { NotificationService } from "@/lib/notifications/notification-service";
import { getBranchContext, addBranchFilter } from "@/lib/api/branch-middleware";
import { appLogger as logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check admin authorization
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: isAdmin } = await supabase.rpc("is_admin", {
      user_id: user.id,
    });
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") || "all";
    const customerId = searchParams.get("customer_id");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Get branch context
    const branchContext = await getBranchContext(request, user.id);

    // Build branch filter function
    const applyBranchFilter = (query: any) => {
      return addBranchFilter(
        query,
        branchContext.branchId,
        branchContext.isSuperAdmin,
      );
    };

    // Check and expire quotes before fetching (use service role for proper permissions)
    const supabaseServiceRole = createServiceRoleClient();
    await supabaseServiceRole.rpc("check_and_expire_quotes");

    // Build base query with branch filter
    let query = applyBranchFilter(
      supabase.from("quotes").select("*", { count: "exact" }),
    ).order("created_at", { ascending: false });

    if (status !== "all") {
      query = query.eq("status", status);
    }

    if (customerId) {
      query = query.eq("customer_id", customerId);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: quotes, error, count } = await query.range(from, to);

    if (error) {
      logger.error("Error fetching quotes", error);
      return NextResponse.json(
        {
          error: "Failed to fetch quotes",
          details: error.message,
        },
        { status: 500 },
      );
    }

    // Fetch related data separately if quotes exist
    let quotesWithRelations = quotes || [];
    if (quotesWithRelations.length > 0) {
      // Fetch customers
      const customerIds = [
        ...new Set(
          quotesWithRelations.map((q) => q.customer_id).filter(Boolean),
        ),
      ];
      const { data: customers } =
        customerIds.length > 0
          ? await supabase
              .from("customers")
              .select("id, first_name, last_name, email, phone")
              .in("id", customerIds)
          : { data: [] };

      // Fetch prescriptions
      const prescriptionIds = [
        ...new Set(
          quotesWithRelations.map((q) => q.prescription_id).filter(Boolean),
        ),
      ];
      const { data: prescriptions } =
        prescriptionIds.length > 0
          ? await supabase
              .from("prescriptions")
              .select("*")
              .in("id", prescriptionIds)
          : { data: [] };

      // Fetch products
      const productIds = [
        ...new Set(
          quotesWithRelations.map((q) => q.frame_product_id).filter(Boolean),
        ),
      ];
      const { data: products } =
        productIds.length > 0
          ? await supabase
              .from("products")
              .select("id, name, price, frame_brand, frame_model")
              .in("id", productIds)
          : { data: [] };

      // Map relations to quotes
      quotesWithRelations = quotesWithRelations.map((quote) => ({
        ...quote,
        customer: customers?.find((c) => c.id === quote.customer_id) || null,
        prescription:
          prescriptions?.find((p) => p.id === quote.prescription_id) || null,
        frame_product:
          products?.find((p) => p.id === quote.frame_product_id) || null,
        // Ensure original_status is set for converted quotes
        original_status:
          quote.original_status ||
          (quote.status === "converted_to_work" ? "accepted" : quote.status),
      }));
    }

    return NextResponse.json({
      quotes: quotesWithRelations,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    logger.error("Error in quotes API GET", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const supabaseServiceRole = createServiceRoleClient();

    // Check admin authorization
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Generate quote number
    const { data: quoteNumber, error: quoteNumberError } =
      await supabaseServiceRole.rpc("generate_quote_number");

    if (quoteNumberError || !quoteNumber) {
      logger.error("Error generating quote number", quoteNumberError);
      return NextResponse.json(
        { error: "Failed to generate quote number" },
        { status: 500 },
      );
    }

    // Get default expiration days from settings
    const { data: settings } = await supabaseServiceRole
      .from("quote_settings")
      .select("default_expiration_days")
      .limit(1)
      .single();

    const defaultExpirationDays = settings?.default_expiration_days || 30;

    // Get branch context
    const branchContext = await getBranchContext(request, user.id);

    // Determine branch_id for the quote
    // Priority: body.branch_id > branchContext.branchId > customer's branch
    let quoteBranchId = body.branch_id || branchContext.branchId;

    // If no branch_id provided, try to get it from customer
    if (!quoteBranchId && body.customer_id) {
      const { data: customer } = await supabaseServiceRole
        .from("customers")
        .select("branch_id")
        .eq("id", body.customer_id)
        .single();
      quoteBranchId = customer?.branch_id || null;
    }

    // Validate branch access for non-super admins
    if (!branchContext.isSuperAdmin && quoteBranchId) {
      const hasAccess = branchContext.accessibleBranches.some(
        (b) => b.id === quoteBranchId,
      );
      if (!hasAccess) {
        return NextResponse.json(
          {
            error: "No tiene acceso a esta sucursal",
          },
          { status: 403 },
        );
      }
    }

    // For non-super admins, branch_id is required
    if (!branchContext.isSuperAdmin && !quoteBranchId) {
      return NextResponse.json(
        {
          error: "Debe especificar una sucursal para el presupuesto",
        },
        { status: 400 },
      );
    }

    // Calculate expiration date
    const expirationDate = body.expiration_date
      ? new Date(body.expiration_date)
      : new Date(Date.now() + defaultExpirationDays * 24 * 60 * 60 * 1000);

    // Create quote
    const { data: newQuote, error: quoteError } = await supabaseServiceRole
      .from("quotes")
      .insert({
        quote_number: quoteNumber,
        customer_id: body.customer_id,
        branch_id: quoteBranchId,
        prescription_id: body.prescription_id || null,
        frame_product_id: body.frame_product_id || null,
        frame_name: body.frame_name,
        frame_brand: body.frame_brand,
        frame_model: body.frame_model,
        frame_color: body.frame_color,
        frame_size: body.frame_size,
        frame_sku: body.frame_sku,
        frame_price: body.frame_price || 0,
        lens_type: body.lens_type,
        lens_material: body.lens_material,
        lens_index: body.lens_index,
        lens_treatments: body.lens_treatments || [],
        lens_tint_color: body.lens_tint_color,
        lens_tint_percentage: body.lens_tint_percentage,
        frame_cost: body.frame_cost || 0,
        lens_cost: body.lens_cost || 0,
        treatments_cost: body.treatments_cost || 0,
        labor_cost: body.labor_cost || 0,
        subtotal: body.subtotal || 0,
        tax_amount: body.tax_amount || 0,
        discount_amount: body.discount_amount || 0,
        discount_percentage: body.discount_percentage || 0,
        total_amount: body.total_amount,
        currency: body.currency || "CLP",
        status: body.status || "draft",
        notes: body.notes,
        customer_notes: body.customer_notes,
        terms_and_conditions: body.terms_and_conditions,
        expiration_date: expirationDate.toISOString().split("T")[0],
        created_by: user.id,
      })
      .select(
        `
        *,
        customer:customers!quotes_customer_id_fkey(id, first_name, last_name, email, phone),
        prescription:prescriptions!quotes_prescription_id_fkey(*)
      `,
      )
      .single();

    if (quoteError) {
      logger.error("Error creating quote", quoteError);
      return NextResponse.json(
        {
          error: "Failed to create quote",
          details: quoteError.message,
        },
        { status: 500 },
      );
    }

    // Create notification for new quote (non-blocking)
    if (newQuote) {
      const customerName = newQuote.customer
        ? `${newQuote.customer.first_name || ""} ${newQuote.customer.last_name || ""}`.trim() ||
          newQuote.customer.email ||
          "Cliente"
        : "Cliente";

      NotificationService.notifyNewQuote(
        newQuote.id,
        newQuote.quote_number,
        customerName,
        newQuote.total_amount,
      ).catch((err) => logger.error("Error creating notification", err));
    }

    return NextResponse.json({
      success: true,
      quote: newQuote,
    });
  } catch (error) {
    logger.error("Error in quotes POST API", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
