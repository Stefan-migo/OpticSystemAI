import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { appLogger as logger } from "@/lib/logger";
import type { IsAdminParams, IsAdminResult } from "@/types/supabase-rpc";
import { withRateLimit, rateLimitConfigs } from "@/lib/api/middleware";
import { RateLimitError } from "@/lib/api/errors";

export async function GET(request: NextRequest) {
  try {
    logger.info("Admin Orders API GET called");
    const supabase = await createClient();

    // Check admin authorization
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      logger.error("User authentication failed", userError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    logger.debug("User authenticated", { email: user.email });

    const { data: isAdmin, error: adminError } = (await supabase.rpc(
      "is_admin",
      { user_id: user.id } as IsAdminParams,
    )) as { data: IsAdminResult | null; error: Error | null };
    if (adminError) {
      logger.error("Admin check error", adminError);
      return NextResponse.json(
        { error: "Admin verification failed" },
        { status: 500 },
      );
    }
    if (!isAdmin) {
      logger.warn("User is not admin", { email: user.email });
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }
    logger.debug("Admin access confirmed", { email: user.email });

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    logger.debug("Query params", { status, limit, offset });

    // Build query
    let query = supabase
      .from("orders")
      .select(
        `
        id,
        order_number,
        email,
        status,
        payment_status,
        total_amount,
        currency,
        created_at,
        updated_at,
        mp_payment_id,
        mp_payment_method,
        mp_payment_type,
        order_items (
          id,
          product_name,
          variant_title,
          quantity,
          unit_price,
          total_price
        )
      `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply status filter
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data: orders, error: ordersError, count } = await query;

    if (ordersError) {
      logger.error("Error fetching admin orders", ordersError);
      return NextResponse.json(
        { error: "Failed to fetch orders" },
        { status: 500 },
      );
    }

    logger.debug("Orders fetched successfully", {
      ordersCount: orders?.length || 0,
      totalCount: count,
      offset,
      limit,
    });

    // Transform data to include customer names
    const transformedOrders = orders?.map((order) => ({
      id: order.id,
      order_number: order.order_number,
      customer_name: "Cliente", // For now, we'll use a generic name since we don't have the profiles join
      customer_email: order.email,
      total_amount: order.total_amount,
      status: order.status,
      payment_status: order.payment_status,
      created_at: order.created_at,
      updated_at: order.updated_at,
      mp_payment_id: order.mp_payment_id,
      mp_payment_method: order.mp_payment_method,
      mp_payment_type: order.mp_payment_type,
      order_items: order.order_items || [],
    }));

    return NextResponse.json({
      success: true,
      orders: transformedOrders || [],
      total: count || 0,
      offset,
      limit,
    });
  } catch (error) {
    logger.error("Admin orders API GET error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Create manual order or get statistics
export async function POST(request: NextRequest) {
  return withRateLimit(rateLimitConfigs.modification, async () => {
    try {
      logger.info("Admin Orders API POST called");
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

      const body = await request.json();
      const { action } = body;

      if (action === "get_stats") {
        logger.info("Getting order statistics");

        // Get order counts by status
        const { data: allOrders, error: statusError } = await supabase
          .from("orders")
          .select("status");

        if (statusError) {
          logger.error("Error getting order stats", statusError);
          throw statusError;
        }

        // Count by status manually
        const statusCounts =
          allOrders?.reduce(
            (acc: Record<string, number>, order: { status: string }) => {
              acc[order.status] = (acc[order.status] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>,
          ) || {};

        // Get total revenue for current month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data: revenueData, error: revenueError } = await supabase
          .from("orders")
          .select("total_amount")
          .eq("payment_status", "paid")
          .gte("created_at", startOfMonth.toISOString());

        if (revenueError) {
          logger.error("Error getting revenue stats", revenueError);
          throw revenueError;
        }

        const totalRevenue =
          revenueData?.reduce((sum, order) => sum + order.total_amount, 0) || 0;

        // Get recent orders
        const { data: recentOrders, error: recentError } = await supabase
          .from("orders")
          .select(
            `
          id,
          order_number,
          email,
          status,
          total_amount,
          created_at
        `,
          )
          .order("created_at", { ascending: false })
          .limit(10);

        if (recentError) {
          logger.error("Error getting recent orders", recentError);
          throw recentError;
        }

        return NextResponse.json({
          success: true,
          stats: {
            orderCounts: statusCounts || [],
            totalRevenue,
            recentOrders:
              recentOrders?.map((order) => ({
                id: order.id,
                order_number: order.order_number,
                customer_name: "Cliente", // Generic name for now
                customer_email: order.email,
                status: order.status,
                total_amount: order.total_amount,
                created_at: order.created_at,
              })) || [],
          },
        });
      }

      if (action === "create_manual_order") {
        logger.info("Creating manual order");
        const { orderData } = body;

        logger.debug("Order data received", { orderData });

        // Validate required fields
        if (!orderData.email) {
          return NextResponse.json(
            { error: "Email is required" },
            { status: 400 },
          );
        }

        if (!orderData.total_amount || orderData.total_amount <= 0) {
          return NextResponse.json(
            { error: "Total amount must be greater than 0" },
            { status: 400 },
          );
        }

        // Generate order number
        const orderNumber = `DL-${Date.now()}`;

        // Map status values (frontend uses 'completed', DB uses 'delivered')
        let dbStatus = orderData.status || "pending";
        if (dbStatus === "completed") {
          dbStatus = "delivered";
        }

        // Create the order
        const { data: newOrder, error: orderError } = await supabase
          .from("orders")
          .insert({
            order_number: orderNumber,
            email: orderData.email,
            status: dbStatus,
            payment_status: orderData.payment_status || "paid",
            subtotal: orderData.subtotal || orderData.total_amount,
            total_amount: orderData.total_amount,
            currency: "ARS",
            mp_payment_method: orderData.payment_method || "manual",
            customer_notes: orderData.notes,
            shipping_first_name: orderData.shipping?.first_name,
            shipping_last_name: orderData.shipping?.last_name,
            shipping_address_1: orderData.shipping?.address_1,
            shipping_city: orderData.shipping?.city,
            shipping_state: orderData.shipping?.state,
            shipping_postal_code: orderData.shipping?.postal_code,
            shipping_phone: orderData.shipping?.phone,
          })
          .select()
          .single();

        if (orderError) {
          logger.error("Error creating manual order", orderError, {
            order_number: orderNumber,
            email: orderData.email,
            status: dbStatus,
            payment_status: orderData.payment_status || "paid",
            subtotal: orderData.subtotal || orderData.total_amount,
            total_amount: orderData.total_amount,
          });
          return NextResponse.json(
            { error: "Failed to create order", details: orderError.message },
            { status: 500 },
          );
        }

        // Create order items if provided
        if (orderData.items && orderData.items.length > 0) {
          const orderItems = orderData.items.map(
            (item: {
              product_id: string;
              quantity: number;
              unit_price: number;
              product_name: string;
            }) => ({
              order_id: newOrder.id,
              product_id: item.product_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: item.unit_price * item.quantity,
              product_name: item.product_name,
              variant_title: item.variant_title,
            }),
          );

          const { error: itemsError } = await supabase
            .from("order_items")
            .insert(orderItems);

          if (itemsError) {
            logger.error("Error creating order items", itemsError);
            // Don't fail the whole operation, just log the error
          }
        }

        logger.info("Manual order created successfully", {
          orderId: newOrder.id,
        });

        // Create notification for new sale (non-blocking)
        const { NotificationService } = await import(
          "@/lib/notifications/notification-service"
        );
        NotificationService.notifyNewSale(
          newOrder.id,
          newOrder.order_number,
          newOrder.email,
          newOrder.total_amount,
        ).catch((err) => logger.error("Error creating notification", err));

        return NextResponse.json({
          success: true,
          order: newOrder,
        });
      }

      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error) {
      if (error instanceof RateLimitError) {
        logger.warn("Rate limit exceeded for order creation", {
          error: error.message,
        });
        return NextResponse.json({ error: error.message }, { status: 429 });
      }
      logger.error("Admin orders POST error", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  })(request);
}

// Delete all orders (for testing cleanup)
export async function DELETE(request: NextRequest) {
  try {
    logger.warn("Admin Orders API DELETE called - Deleting all orders");
    const supabase = await createClient();

    // Check admin authorization
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      logger.error("User authentication failed", userError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    logger.debug("User authenticated", { email: user.email });

    const { data: isAdmin, error: adminError } = (await supabase.rpc(
      "is_admin",
      { user_id: user.id } as IsAdminParams,
    )) as { data: IsAdminResult | null; error: Error | null };
    if (adminError) {
      logger.error("Admin check error", adminError);
      return NextResponse.json(
        { error: "Admin verification failed" },
        { status: 500 },
      );
    }
    if (!isAdmin) {
      logger.warn("User is not admin", { email: user.email });
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }
    logger.debug("Admin access confirmed", { email: user.email });

    // First, delete all order items (due to foreign key constraints)
    const { error: itemsError } = await supabase
      .from("order_items")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all (using a condition that's always true)

    if (itemsError) {
      logger.error("Error deleting order items", itemsError);
      return NextResponse.json(
        { error: "Failed to delete order items", details: itemsError.message },
        { status: 500 },
      );
    }
    logger.debug("Order items deleted successfully");

    // Then, delete all orders
    const { error: ordersError } = await supabase
      .from("orders")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all (using a condition that's always true)

    if (ordersError) {
      logger.error("Error deleting orders", ordersError);
      return NextResponse.json(
        { error: "Failed to delete orders", details: ordersError.message },
        { status: 500 },
      );
    }

    logger.warn("All orders deleted successfully");
    return NextResponse.json({
      success: true,
      message: "All orders have been deleted successfully",
    });
  } catch (error) {
    logger.error("Admin orders DELETE error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
