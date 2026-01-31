import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/server";
import { NotificationService } from "@/lib/notifications/notification-service";
import { getBranchContext, addBranchFilter } from "@/lib/api/branch-middleware";
import { appLogger as logger } from "@/lib/logger";
import type { IsAdminParams, IsAdminResult } from "@/types/supabase-rpc";
import { ValidationError } from "@/lib/api/errors";
import { createQuoteSchema } from "@/lib/api/validation/zod-schemas";
import {
  parseAndValidateBody,
  validationErrorResponse,
} from "@/lib/api/validation/zod-helpers";

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

    const { data: isAdmin } = (await supabase.rpc("is_admin", {
      user_id: user.id,
    } as IsAdminParams)) as { data: IsAdminResult | null; error: Error | null };
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
    const applyBranchFilter = (query: ReturnType<typeof supabase.from>) => {
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
      supabase.from("quotes").select("*", { count: "exact" }) as any,
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
          quotesWithRelations.map((q: any) => q.customer_id).filter(Boolean),
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
          quotesWithRelations
            .map((q: any) => q.prescription_id)
            .filter(Boolean),
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
          quotesWithRelations
            .map((q: any) => q.frame_product_id)
            .filter(Boolean),
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
      quotesWithRelations = quotesWithRelations.map((quote: any) => ({
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

    const { data: isAdmin } = (await supabase.rpc("is_admin", {
      user_id: user.id,
    } as IsAdminParams)) as { data: IsAdminResult | null; error: Error | null };
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    // Validate request body with Zod
    let validatedBody;
    try {
      validatedBody = await parseAndValidateBody(request, createQuoteSchema);
    } catch (error) {
      if (error instanceof ValidationError) {
        return validationErrorResponse(error);
      }
      throw error;
    }

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
    // Priority: validatedBody.branch_id > branchContext.branchId > customer's branch
    let quoteBranchId = validatedBody.branch_id || branchContext.branchId;

    // If no branch_id provided, try to get it from customer
    if (!quoteBranchId && validatedBody.customer_id) {
      const { data: customer } = await supabaseServiceRole
        .from("customers")
        .select("branch_id")
        .eq("id", validatedBody.customer_id)
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
    const expirationDate = validatedBody.expiration_date
      ? new Date(validatedBody.expiration_date)
      : new Date(Date.now() + defaultExpirationDays * 24 * 60 * 60 * 1000);

    // Create quote
    // Usar validatedBody para campos validados por Zod
    const { data: newQuote, error: quoteError } = await supabaseServiceRole
      .from("quotes")
      .insert({
        quote_number: quoteNumber,
        customer_id: validatedBody.customer_id,
        branch_id: quoteBranchId,
        prescription_id: validatedBody.prescription_id || null,
        frame_product_id: validatedBody.frame_product_id || null,
        frame_name: validatedBody.frame_name || null,
        frame_brand: validatedBody.frame_brand || null,
        frame_model: validatedBody.frame_model || null,
        frame_color: validatedBody.frame_color || null,
        frame_size: validatedBody.frame_size || null,
        frame_sku: validatedBody.frame_sku || null,
        frame_price:
          typeof validatedBody.frame_price === "number"
            ? validatedBody.frame_price
            : validatedBody.frame_price || 0,
        lens_type: validatedBody.lens_type || null,
        lens_material: validatedBody.lens_material || null,
        lens_index: validatedBody.lens_index || null,
        lens_treatments: validatedBody.lens_treatments || [],
        lens_tint_color: validatedBody.lens_tint_color || null,
        lens_tint_percentage: validatedBody.lens_tint_percentage || null,
        // Contact lens fields
        contact_lens_family_id: validatedBody.contact_lens_family_id || null,
        contact_lens_rx_sphere_od:
          validatedBody.contact_lens_rx_sphere_od || null,
        contact_lens_rx_cylinder_od:
          validatedBody.contact_lens_rx_cylinder_od || null,
        contact_lens_rx_axis_od: validatedBody.contact_lens_rx_axis_od || null,
        contact_lens_rx_add_od: validatedBody.contact_lens_rx_add_od || null,
        contact_lens_rx_base_curve_od:
          validatedBody.contact_lens_rx_base_curve_od || null,
        contact_lens_rx_diameter_od:
          validatedBody.contact_lens_rx_diameter_od || null,
        contact_lens_rx_sphere_os:
          validatedBody.contact_lens_rx_sphere_os || null,
        contact_lens_rx_cylinder_os:
          validatedBody.contact_lens_rx_cylinder_os || null,
        contact_lens_rx_axis_os: validatedBody.contact_lens_rx_axis_os || null,
        contact_lens_rx_add_os: validatedBody.contact_lens_rx_add_os || null,
        contact_lens_rx_base_curve_os:
          validatedBody.contact_lens_rx_base_curve_os || null,
        contact_lens_rx_diameter_os:
          validatedBody.contact_lens_rx_diameter_os || null,
        contact_lens_quantity: validatedBody.contact_lens_quantity || 1,
        contact_lens_cost: validatedBody.contact_lens_cost || 0,
        contact_lens_price: validatedBody.contact_lens_price || 0,
        frame_cost:
          typeof validatedBody.frame_cost === "number"
            ? validatedBody.frame_cost
            : validatedBody.frame_cost || 0,
        lens_cost:
          typeof validatedBody.lens_cost === "number"
            ? validatedBody.lens_cost
            : validatedBody.lens_cost || 0,
        treatments_cost:
          typeof validatedBody.treatments_cost === "number"
            ? validatedBody.treatments_cost
            : validatedBody.treatments_cost || 0,
        labor_cost:
          typeof validatedBody.labor_cost === "number"
            ? validatedBody.labor_cost
            : validatedBody.labor_cost || 0,
        subtotal:
          typeof validatedBody.subtotal === "number"
            ? validatedBody.subtotal
            : validatedBody.subtotal || 0,
        tax_amount:
          typeof validatedBody.tax_amount === "number"
            ? validatedBody.tax_amount
            : validatedBody.tax_amount || 0,
        discount_amount:
          typeof validatedBody.discount_amount === "number"
            ? validatedBody.discount_amount
            : validatedBody.discount_amount || 0,
        discount_percentage: validatedBody.discount_percentage || 0,
        total_amount:
          typeof validatedBody.total_amount === "number"
            ? validatedBody.total_amount
            : parseFloat(String(validatedBody.total_amount)),
        currency: validatedBody.currency || "CLP",
        status: validatedBody.status || "draft",
        notes: validatedBody.notes || null,
        customer_notes: validatedBody.customer_notes || null,
        terms_and_conditions: validatedBody.terms_and_conditions || null,
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
        newQuote.branch_id ?? undefined,
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
