import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/utils/supabase/server";
import { getBranchContext } from "@/lib/api/branch-middleware";
import { appLogger as logger } from "@/lib/logger";
import type { IsAdminParams, IsAdminResult } from "@/types/supabase-rpc";

/**
 * POST /api/admin/orders/[id]/cancel
 * Cancel/void an order (SuperAdmin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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

    // Only SuperAdmin can cancel orders
    if (!branchContext.isSuperAdmin) {
      return NextResponse.json(
        { error: "Solo superadmin puede anular ventas" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json(
        { error: "Reason is required" },
        { status: 400 },
      );
    }

    // Get order
    const { data: order, error: orderError } = await supabaseServiceRole
      .from("orders")
      .select("*")
      .eq("id", params.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Update order status to cancelled
    const { error: updateError } = await supabaseServiceRole
      .from("orders")
      .update({
        status: "cancelled",
        payment_status: "refunded",
        cancellation_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id);

    if (updateError) {
      logger.error("Error cancelling order", updateError);
      return NextResponse.json(
        {
          error: "Error al anular la venta",
          details: updateError.message,
        },
        { status: 500 },
      );
    }

    logger.info("Order cancelled", {
      order_id: params.id,
      cancelled_by: user.email,
      reason,
      original_amount: order.total_amount,
    });

    return NextResponse.json({
      success: true,
      message: "Venta anulada correctamente",
      order_id: params.id,
    });
  } catch (error: any) {
    logger.error("Error in cancel order API", { error });
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
