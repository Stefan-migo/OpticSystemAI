import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/utils/supabase/server";
import { getBranchContext } from "@/lib/api/branch-middleware";
import { appLogger as logger } from "@/lib/logger";
import type { IsAdminParams, IsAdminResult } from "@/types/supabase-rpc";

/**
 * DELETE /api/admin/orders/[id]
 * Delete an order permanently (SuperAdmin only, for cancelled orders)
 */
export async function DELETE(
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

    // Only SuperAdmin can delete orders
    if (!branchContext.isSuperAdmin) {
      return NextResponse.json(
        { error: "Solo superadmin puede eliminar ventas" },
        { status: 403 },
      );
    }

    // Get order to verify it's cancelled
    const { data: order, error: orderError } = await supabaseServiceRole
      .from("orders")
      .select("*")
      .eq("id", params.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Only allow deleting cancelled/refunded orders
    if (order.status !== "cancelled" && order.payment_status !== "refunded") {
      return NextResponse.json(
        {
          error: "Solo se pueden eliminar ventas anuladas",
          current_status: order.status,
        },
        { status: 400 },
      );
    }

    // Delete order items first (foreign key constraint)
    const { error: deleteItemsError } = await supabaseServiceRole
      .from("order_items")
      .delete()
      .eq("order_id", params.id);

    if (deleteItemsError) {
      logger.error("Error deleting order items", deleteItemsError);
      return NextResponse.json(
        {
          error: "Error al eliminar items de la venta",
          details: deleteItemsError.message,
        },
        { status: 500 },
      );
    }

    // Delete order payments
    const { error: deletePaymentsError } = await supabaseServiceRole
      .from("order_payments")
      .delete()
      .eq("order_id", params.id);

    if (deletePaymentsError) {
      logger.error("Error deleting order payments", deletePaymentsError);
      // Don't fail, continue to delete order
    }

    // Delete order
    const { error: deleteError } = await supabaseServiceRole
      .from("orders")
      .delete()
      .eq("id", params.id);

    if (deleteError) {
      logger.error("Error deleting order", deleteError);
      return NextResponse.json(
        {
          error: "Error al eliminar la venta",
          details: deleteError.message,
        },
        { status: 500 },
      );
    }

    logger.info("Order deleted permanently", {
      order_id: params.id,
      deleted_by: user.email,
      order_number: order.order_number,
      original_amount: order.total_amount,
    });

    return NextResponse.json({
      success: true,
      message: "Venta eliminada correctamente",
      order_id: params.id,
    });
  } catch (error: any) {
    logger.error("Error in delete order API", { error });
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
