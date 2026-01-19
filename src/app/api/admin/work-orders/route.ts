import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/server";
import { getBranchContext, addBranchFilter } from "@/lib/api/branch-middleware";
import { NotificationService } from "@/lib/notifications/notification-service";
import { appLogger as logger } from "@/lib/logger";
import type { IsAdminParams, IsAdminResult } from "@/types/supabase-rpc";

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

    // Get branch context
    const branchContext = await getBranchContext(request, user.id);

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") || "all";
    const customerId = searchParams.get("customer_id");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build base query with branch filter
    let query = supabase
      .from("lab_work_orders")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    // Apply branch filter
    query = addBranchFilter(
      query,
      branchContext.branchId,
      branchContext.isSuperAdmin,
    );

    if (status !== "all") {
      query = query.eq("status", status);
    }

    if (customerId) {
      query = query.eq("customer_id", customerId);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: workOrders, error, count } = await query.range(from, to);

    if (error) {
      logger.error("Error fetching work orders", error);
      return NextResponse.json(
        {
          error: "Failed to fetch work orders",
          details: error.message,
        },
        { status: 500 },
      );
    }

    // Fetch related data separately if work orders exist
    let workOrdersWithRelations = workOrders || [];
    if (workOrdersWithRelations.length > 0) {
      // Fetch customers (from customers table, not profiles)
      const customerIds = [
        ...new Set(
          workOrdersWithRelations.map((wo) => wo.customer_id).filter(Boolean),
        ),
      ];
      const { data: customers } = await supabase
        .from("customers")
        .select("id, first_name, last_name, email, phone")
        .in("id", customerIds);

      // Fetch prescriptions
      const prescriptionIds = [
        ...new Set(
          workOrdersWithRelations
            .map((wo) => wo.prescription_id)
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

      // Fetch quotes
      const quoteIds = [
        ...new Set(
          workOrdersWithRelations.map((wo) => wo.quote_id).filter(Boolean),
        ),
      ];
      const { data: quotes } =
        quoteIds.length > 0
          ? await supabase.from("quotes").select("*").in("id", quoteIds)
          : { data: [] };

      // Fetch products
      const productIds = [
        ...new Set(
          workOrdersWithRelations
            .map((wo) => wo.frame_product_id)
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

      // Fetch assigned staff
      const staffIds = [
        ...new Set(
          workOrdersWithRelations.map((wo) => wo.assigned_to).filter(Boolean),
        ),
      ];
      const { data: staff } =
        staffIds.length > 0
          ? await supabase
              .from("profiles")
              .select("id, first_name, last_name")
              .in("id", staffIds)
          : { data: [] };

      // Map relations to work orders
      workOrdersWithRelations = workOrdersWithRelations.map((workOrder) => ({
        ...workOrder,
        customer:
          customers?.find((c) => c.id === workOrder.customer_id) || null,
        prescription:
          prescriptions?.find((p) => p.id === workOrder.prescription_id) ||
          null,
        quote: quotes?.find((q) => q.id === workOrder.quote_id) || null,
        frame_product:
          products?.find((p) => p.id === workOrder.frame_product_id) || null,
        assigned_staff:
          staff?.find((s) => s.id === workOrder.assigned_to) || null,
      }));
    }

    return NextResponse.json({
      workOrders: workOrdersWithRelations,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    logger.error("Error in work orders API GET", error);
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

    const body = await request.json();

    // Get branch context
    const branchContext = await getBranchContext(request, user.id);

    // Validate branch access for non-super admins
    if (!branchContext.isSuperAdmin && !branchContext.branchId) {
      return NextResponse.json(
        {
          error: "Debe seleccionar una sucursal para crear trabajos",
        },
        { status: 400 },
      );
    }

    // Generate work order number
    const { data: workOrderNumber, error: workOrderNumberError } =
      await supabaseServiceRole.rpc("generate_work_order_number");

    if (workOrderNumberError || !workOrderNumber) {
      logger.error("Error generating work order number", workOrderNumberError);
      return NextResponse.json(
        { error: "Failed to generate work order number" },
        { status: 500 },
      );
    }

    // Get prescription snapshot if prescription_id is provided
    let prescriptionSnapshot = null;
    if (body.prescription_id) {
      const { data: prescription } = await supabaseServiceRole
        .from("prescriptions")
        .select("*")
        .eq("id", body.prescription_id)
        .single();

      if (prescription) {
        prescriptionSnapshot = prescription;
      }
    }

    // Validate required fields
    if (!body.frame_name || !body.frame_name.trim()) {
      return NextResponse.json(
        {
          error: "El nombre del marco es requerido",
        },
        { status: 400 },
      );
    }

    if (!body.lens_type || !body.lens_type.trim()) {
      return NextResponse.json(
        {
          error: "El tipo de lente es requerido",
        },
        { status: 400 },
      );
    }

    if (!body.lens_material || !body.lens_material.trim()) {
      return NextResponse.json(
        {
          error: "El material del lente es requerido",
        },
        { status: 400 },
      );
    }

    if (!body.total_amount || body.total_amount <= 0) {
      return NextResponse.json(
        {
          error: "El monto total debe ser mayor a 0",
        },
        { status: 400 },
      );
    }

    // Prepare insert data - ensure no undefined values
    const insertData: Record<string, unknown> = {
      work_order_number: workOrderNumber,
      branch_id: branchContext.branchId,
      customer_id: body.customer_id,
      prescription_id: body.prescription_id ?? null,
      quote_id: body.quote_id ?? null,
      frame_product_id: body.frame_product_id ?? null,
      frame_name: body.frame_name.trim(),
      frame_brand: body.frame_brand?.trim() ?? null,
      frame_model: body.frame_model?.trim() ?? null,
      frame_color: body.frame_color?.trim() ?? null,
      frame_size: body.frame_size?.trim() ?? null,
      frame_sku: body.frame_sku?.trim() ?? null,
      frame_serial_number: body.frame_serial_number?.trim() ?? null,
      lens_type: body.lens_type.trim(),
      lens_material: body.lens_material.trim(),
      lens_index: body.lens_index ?? null,
      lens_treatments: Array.isArray(body.lens_treatments)
        ? body.lens_treatments
        : [],
      lens_tint_color: body.lens_tint_color?.trim() ?? null,
      lens_tint_percentage: body.lens_tint_percentage ?? null,
      prescription_snapshot: prescriptionSnapshot,
      lab_name: body.lab_name?.trim() ?? null,
      lab_contact: body.lab_contact?.trim() ?? null,
      lab_order_number: body.lab_order_number?.trim() ?? null,
      lab_estimated_delivery_date: body.lab_estimated_delivery_date ?? null,
      status: body.status || "quote",
      frame_cost: Number(body.frame_cost) || 0,
      lens_cost: Number(body.lens_cost) || 0,
      treatments_cost: Number(body.treatments_cost) || 0,
      labor_cost: Number(body.labor_cost) || 0,
      lab_cost: Number(body.lab_cost) || 0,
      subtotal: Number(body.subtotal) || 0,
      tax_amount: Number(body.tax_amount) || 0,
      discount_amount: Number(body.discount_amount) || 0,
      total_amount: Number(body.total_amount) || 0,
      currency: body.currency || "CLP",
      payment_status: body.payment_status || "pending",
      payment_method: body.payment_method?.trim() ?? null,
      deposit_amount: Number(body.deposit_amount) || 0,
      balance_amount:
        Number(body.balance_amount) || Number(body.total_amount) || 0,
      pos_order_id: body.pos_order_id ?? null,
      internal_notes: body.internal_notes?.trim() ?? null,
      customer_notes: body.customer_notes?.trim() ?? null,
      assigned_to: body.assigned_to || user.id,
      created_by: user.id,
    };

    // Log insert data for debugging (remove sensitive data)
    logger.debug("Creating work order with data", {
      work_order_number: insertData.work_order_number,
      branch_id: insertData.branch_id,
      customer_id: insertData.customer_id,
      frame_name: insertData.frame_name,
      lens_type: insertData.lens_type,
      lens_material: insertData.lens_material,
      total_amount: insertData.total_amount,
    });

    // Create work order
    const { data: newWorkOrder, error: workOrderError } =
      await supabaseServiceRole
        .from("lab_work_orders")
        .insert(insertData)
        .select(
          `
        *,
        customer:customers!lab_work_orders_customer_id_fkey(id, first_name, last_name, email, phone),
        prescription:prescriptions!lab_work_orders_prescription_id_fkey(*)
      `,
        )
        .single();

    if (workOrderError) {
      logger.error("Error creating work order", workOrderError, {
        errorDetails: JSON.stringify(workOrderError, null, 2),
        insertData: JSON.stringify(insertData, null, 2),
      });
      return NextResponse.json(
        {
          error: "Failed to create work order",
          details: workOrderError.message,
          code: workOrderError.code,
          hint: workOrderError.hint,
        },
        { status: 500 },
      );
    }

    // If status is not 'quote', update status dates
    if (body.status && body.status !== "quote") {
      await supabaseServiceRole.rpc("update_work_order_status", {
        p_work_order_id: newWorkOrder.id,
        p_new_status: body.status,
        p_changed_by: user.id,
        p_notes: "Work order created",
      });
    }

    // Create notification for new work order (non-blocking)
    if (newWorkOrder) {
      const customerName = newWorkOrder.customer
        ? `${newWorkOrder.customer.first_name || ""} ${newWorkOrder.customer.last_name || ""}`.trim() ||
          newWorkOrder.customer.email ||
          "Cliente"
        : "Cliente";

      NotificationService.notifyNewWorkOrder(
        newWorkOrder.id,
        newWorkOrder.work_order_number,
        customerName,
        newWorkOrder.total_amount,
      ).catch((err) => logger.error("Error creating notification", err));
    }

    return NextResponse.json({
      success: true,
      workOrder: newWorkOrder,
    });
  } catch (error) {
    logger.error("Error in work orders POST API", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
