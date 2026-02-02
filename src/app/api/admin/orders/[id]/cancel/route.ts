import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/utils/supabase/server";
import { getBranchContext } from "@/lib/api/branch-middleware";
import { appLogger as logger } from "@/lib/logger";
import type {
  IsAdminParams,
  IsAdminResult,
  GetAdminRoleParams,
  GetAdminRoleResult,
} from "@/types/supabase-rpc";

/**
 * POST /api/admin/orders/[id]/cancel
 * Cancel/void an order (Admin or SuperAdmin; Admin only for orders in their branch)
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

    const { data: adminRole } = (await supabase.rpc("get_admin_role", {
      user_id: user.id,
    } as GetAdminRoleParams)) as {
      data: GetAdminRoleResult | null;
      error: Error | null;
    };
    const canCancel =
      adminRole === "super_admin" ||
      adminRole === "admin" ||
      adminRole === "root" ||
      adminRole === "dev";
    if (!canCancel) {
      return NextResponse.json(
        { error: "Solo administradores pueden anular ventas" },
        { status: 403 },
      );
    }

    // Get branch context (for non-super-admin we validate order's branch access below)
    const branchContext = await getBranchContext(request, user.id);

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

    // Non-super-admin can only cancel orders in their accessible branches
    if (!branchContext.isSuperAdmin && order.branch_id) {
      const hasAccess = branchContext.accessibleBranches.some(
        (b) => b.id === order.branch_id,
      );
      if (!hasAccess) {
        return NextResponse.json(
          { error: "No tienes acceso a la sucursal de esta orden" },
          { status: 403 },
        );
      }
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
