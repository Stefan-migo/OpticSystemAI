import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/utils/supabase/server";
import {
  getBranchContext,
  validateBranchAccess,
} from "@/lib/api/branch-middleware";
import { appLogger as logger } from "@/lib/logger";
import type { IsAdminParams, IsAdminResult } from "@/types/supabase-rpc";

/**
 * GET /api/admin/cash-register/close
 * Get daily sales summary for cash register closure
 */
export async function GET(request: NextRequest) {
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

    // Get branch context
    const branchContext = await getBranchContext(request, user.id);

    // Validate branch access for non-super admins
    if (!branchContext.isSuperAdmin && !branchContext.branchId) {
      return NextResponse.json(
        {
          error: "Debe seleccionar una sucursal",
        },
        { status: 400 },
      );
    }

    // Get date from query params (default to today)
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const closureDate = dateParam ? new Date(dateParam) : new Date();
    const dateStr = closureDate.toISOString().split("T")[0]; // YYYY-MM-DD

    // Build query for POS orders of the day
    let ordersQuery = supabaseServiceRole
      .from("orders")
      .select("*")
      .eq("is_pos_sale", true)
      .gte("created_at", `${dateStr}T00:00:00`)
      .lt("created_at", `${dateStr}T23:59:59`);

    // Filter by branch
    if (branchContext.branchId) {
      ordersQuery = ordersQuery.eq("branch_id", branchContext.branchId);
    } else if (!branchContext.isSuperAdmin) {
      // Regular admin without branch selected - return empty
      return NextResponse.json({
        summary: {
          date: dateStr,
          branch_id: null,
          total_sales: 0,
          total_transactions: 0,
          cash_sales: 0,
          debit_card_sales: 0,
          credit_card_sales: 0,
          installments_sales: 0,
          other_payment_sales: 0,
          total_subtotal: 0,
          total_tax: 0,
          total_discounts: 0,
          orders: [],
        },
      });
    }

    const { data: orders, error: ordersError } = await ordersQuery;

    if (ordersError) {
      logger.error("Error fetching orders:", {
        error: ordersError,
        date: dateStr,
        branchId: branchContext.branchId,
      });
      return NextResponse.json(
        {
          error: "Error al obtener ventas del día",
          details: ordersError.message,
        },
        { status: 500 },
      );
    }

    // Calculate summary
    const summary = {
      date: dateStr,
      branch_id: branchContext.branchId,
      total_sales: 0,
      total_transactions: orders?.length || 0,
      cash_sales: 0,
      debit_card_sales: 0,
      credit_card_sales: 0,
      installments_sales: 0,
      other_payment_sales: 0,
      total_subtotal: 0,
      total_tax: 0,
      total_discounts: 0,
      orders: orders || [],
    };

    // Process each order
    (orders || []).forEach((order: any) => {
      summary.total_sales += Number(order.total_amount) || 0;
      summary.total_subtotal += Number(order.subtotal) || 0;
      summary.total_tax += Number(order.tax_amount) || 0;
      summary.total_discounts += Number(order.discount_amount) || 0;

      // Group by payment method
      const paymentMethod = order.payment_method_type || "cash";
      switch (paymentMethod) {
        case "cash":
          summary.cash_sales += Number(order.total_amount) || 0;
          break;
        case "debit_card":
          summary.debit_card_sales += Number(order.total_amount) || 0;
          break;
        case "credit_card":
          summary.credit_card_sales += Number(order.total_amount) || 0;
          break;
        case "installments":
          summary.installments_sales += Number(order.total_amount) || 0;
          break;
        default:
          summary.other_payment_sales += Number(order.total_amount) || 0;
      }
    });

    // Get opening cash amount from POS session (if exists)
    let openingCash = 0;
    if (branchContext.branchId) {
      const { data: posSession } = await supabaseServiceRole
        .from("pos_sessions")
        .select("opening_cash_amount")
        .eq("branch_id", branchContext.branchId)
        .eq("status", "open")
        .order("opening_time", { ascending: false })
        .limit(1)
        .maybeSingle();

      openingCash = Number(posSession?.opening_cash_amount) || 0;
    }

    return NextResponse.json({
      summary: {
        ...summary,
        opening_cash_amount: openingCash,
        expected_cash: openingCash + summary.cash_sales,
      },
    });
  } catch (error: any) {
    logger.error("Error in cash register closure API:", { error });
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/cash-register/close
 * Create a cash register closure
 */
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

    // Get branch context
    const branchContext = await getBranchContext(request, user.id);

    // Validate branch access for non-super admins
    if (!branchContext.isSuperAdmin && !branchContext.branchId) {
      return NextResponse.json(
        {
          error: "Debe seleccionar una sucursal para cerrar la caja",
        },
        { status: 400 },
      );
    }

    const body = await request.json();
    const {
      closure_date,
      opening_cash_amount,
      actual_cash,
      card_machine_debit_total,
      card_machine_credit_total,
      notes,
      discrepancies,
    } = body;

    // Validate required fields
    if (!closure_date) {
      return NextResponse.json(
        { error: "La fecha de cierre es requerida" },
        { status: 400 },
      );
    }

    if (opening_cash_amount === undefined || opening_cash_amount === null) {
      return NextResponse.json(
        { error: "El monto inicial de caja es requerido" },
        { status: 400 },
      );
    }

    // Get daily sales summary
    const dateStr = closure_date.split("T")[0];
    let ordersQuery = supabaseServiceRole
      .from("orders")
      .select("*")
      .eq("is_pos_sale", true)
      .gte("created_at", `${dateStr}T00:00:00`)
      .lt("created_at", `${dateStr}T23:59:59`);

    if (branchContext.branchId) {
      ordersQuery = ordersQuery.eq("branch_id", branchContext.branchId);
    }

    const { data: orders, error: ordersError } = await ordersQuery;

    if (ordersError) {
      logger.error("Error fetching orders for closure:", {
        error: ordersError,
        closureDate: closure_date,
        branchId: branchContext.branchId,
      });
      return NextResponse.json(
        {
          error: "Error al obtener ventas del día",
          details: ordersError.message,
        },
        { status: 500 },
      );
    }

    // Calculate summary
    let totalSales = 0;
    let cashSales = 0;
    let debitCardSales = 0;
    let creditCardSales = 0;
    let installmentsSales = 0;
    let otherPaymentSales = 0;
    let totalSubtotal = 0;
    let totalTax = 0;
    let totalDiscounts = 0;

    (orders || []).forEach((order: any) => {
      totalSales += Number(order.total_amount) || 0;
      totalSubtotal += Number(order.subtotal) || 0;
      totalTax += Number(order.tax_amount) || 0;
      totalDiscounts += Number(order.discount_amount) || 0;

      const paymentMethod = order.payment_method_type || "cash";
      switch (paymentMethod) {
        case "cash":
          cashSales += Number(order.total_amount) || 0;
          break;
        case "debit_card":
          debitCardSales += Number(order.total_amount) || 0;
          break;
        case "credit_card":
          creditCardSales += Number(order.total_amount) || 0;
          break;
        case "installments":
          installmentsSales += Number(order.total_amount) || 0;
          break;
        default:
          otherPaymentSales += Number(order.total_amount) || 0;
      }
    });

    // Calculate expected cash
    const expectedCash = Number(opening_cash_amount) + cashSales;

    // Calculate differences
    const cashDifference =
      actual_cash !== undefined && actual_cash !== null
        ? Number(actual_cash) - expectedCash
        : 0;

    const cardMachineDebitDifference =
      card_machine_debit_total !== undefined &&
      card_machine_debit_total !== null
        ? Number(card_machine_debit_total) - debitCardSales
        : 0;

    const cardMachineCreditDifference =
      card_machine_credit_total !== undefined &&
      card_machine_credit_total !== null
        ? Number(card_machine_credit_total) - creditCardSales
        : 0;

    const cardMachineDifference =
      cardMachineDebitDifference + cardMachineCreditDifference;

    // Check if closure already exists for this branch and date
    const { data: existingClosure } = await supabaseServiceRole
      .from("cash_register_closures")
      .select("id")
      .eq("branch_id", branchContext.branchId)
      .eq("closure_date", dateStr)
      .maybeSingle();

    if (existingClosure) {
      return NextResponse.json(
        {
          error: "Ya existe un cierre de caja para esta fecha y sucursal",
        },
        { status: 400 },
      );
    }

    // Get opening time (start of day)
    const openedAt = new Date(`${dateStr}T00:00:00`);

    // Create closure
    const { data: closure, error: closureError } = await supabaseServiceRole
      .from("cash_register_closures")
      .insert({
        branch_id: branchContext.branchId,
        closure_date: dateStr,
        closed_by: user.id,
        opening_cash_amount: Number(opening_cash_amount),
        total_sales: totalSales,
        total_transactions: orders?.length || 0,
        cash_sales: cashSales,
        debit_card_sales: debitCardSales,
        credit_card_sales: creditCardSales,
        installments_sales: installmentsSales,
        other_payment_sales: otherPaymentSales,
        expected_cash: expectedCash,
        actual_cash:
          actual_cash !== undefined && actual_cash !== null
            ? Number(actual_cash)
            : null,
        cash_difference: cashDifference,
        card_machine_debit_total:
          card_machine_debit_total !== undefined &&
          card_machine_debit_total !== null
            ? Number(card_machine_debit_total)
            : 0,
        card_machine_credit_total:
          card_machine_credit_total !== undefined &&
          card_machine_credit_total !== null
            ? Number(card_machine_credit_total)
            : 0,
        card_machine_difference: cardMachineDifference,
        total_subtotal: totalSubtotal,
        total_tax: totalTax,
        total_discounts: totalDiscounts,
        closing_cash_amount:
          actual_cash !== undefined && actual_cash !== null
            ? Number(actual_cash)
            : null,
        notes: notes || null,
        discrepancies: discrepancies || null,
        status: "draft",
        opened_at: openedAt.toISOString(),
      })
      .select()
      .single();

    if (closureError) {
      logger.error("Error creating cash register closure:", {
        error: closureError,
        closureDate: closure_date,
        branchId: branchContext.branchId,
      });
      return NextResponse.json(
        {
          error: "Error al crear el cierre de caja",
          details: closureError.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      closure,
    });
  } catch (error: any) {
    logger.error("Error in cash register closure POST API:", { error });
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
