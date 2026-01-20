import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getBranchContext } from "@/lib/api/branch-middleware";
import { appLogger as logger } from "@/lib/logger";
import type { IsAdminParams, IsAdminResult } from "@/types/supabase-rpc";
import { withRateLimit, rateLimitConfigs } from "@/lib/api/middleware";
import { RateLimitError, ValidationError } from "@/lib/api/errors";
import { processSaleSchema } from "@/lib/api/validation/zod-schemas";
import {
  parseAndValidateBody,
  validationErrorResponse,
} from "@/lib/api/validation/zod-helpers";

export async function POST(request: NextRequest) {
  return (withRateLimit(rateLimitConfigs.pos) as any)(request, async () => {
    try {
      logger.info("POS Process Sale API called");
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

      // Validate branch access for non-super admins
      if (!branchContext.isSuperAdmin && !branchContext.branchId) {
        return NextResponse.json(
          {
            error: "Debe seleccionar una sucursal para realizar ventas POS",
          },
          { status: 400 },
        );
      }

      // Validate request body with Zod
      let validatedBody;
      try {
        validatedBody = await parseAndValidateBody(request, processSaleSchema);
      } catch (error) {
        if (error instanceof ValidationError) {
          return validationErrorResponse(error);
        }
        throw error;
      }

      // Destructure validated data
      const {
        email,
        payment_method_type,
        payment_status,
        status,
        subtotal,
        tax_amount,
        total_amount,
        currency,
        installments_count,
        sii_invoice_type,
        sii_rut,
        sii_business_name,
        items,
        cash_received,
        change_amount,
      } = validatedBody;

      // Generate order number
      const orderNumber = `POS-${Date.now()}`;

      // Generate SII invoice number if needed
      let siiInvoiceNumber = null;
      if (sii_invoice_type && sii_invoice_type !== "none") {
        const { data: invoiceNum, error: invoiceError } = await supabase.rpc(
          "generate_sii_invoice_number",
          { invoice_type: sii_invoice_type },
        );

        if (invoiceError) {
          logger.error("Error generating invoice number", invoiceError);
          // Continue without invoice number for now
        } else {
          siiInvoiceNumber = invoiceNum;
        }
      }

      // Get or create active POS session for this branch
      let posSessionId = null;
      let query = supabase
        .from("pos_sessions")
        .select("id")
        .eq("cashier_id", user.id)
        .eq("status", "open");

      if (branchContext.branchId) {
        query = query.eq("branch_id", branchContext.branchId);
      } else {
        query = query.is("branch_id", null);
      }

      const { data: activeSession } = await query
        .order("opening_time", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeSession) {
        posSessionId = activeSession.id;
      } else {
        // Create new POS session with branch_id
        const { data: newSession, error: sessionError } = await supabase
          .from("pos_sessions")
          .insert({
            cashier_id: user.id,
            branch_id: branchContext.branchId,
            opening_cash_amount: 0,
            status: "open",
          })
          .select()
          .single();

        if (sessionError) {
          logger.error("Error creating POS session", sessionError);
        } else {
          posSessionId = newSession.id;
        }
      }

      // Create the order with branch_id
      const { data: newOrder, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          branch_id: branchContext.branchId,
          email: email || "venta@pos.local",
          status: status || "delivered",
          payment_status: payment_status || "paid",
          subtotal: subtotal,
          tax_amount: tax_amount || 0,
          total_amount: total_amount,
          currency: currency || "CLP",
          is_pos_sale: true,
          pos_cashier_id: user.id,
          payment_method_type: payment_method_type,
          installments_count: installments_count || 1,
          sii_invoice_type: sii_invoice_type || "none",
          sii_rut: sii_rut || null,
          sii_business_name: sii_business_name || null,
          sii_invoice_number: siiInvoiceNumber,
          sii_status:
            sii_invoice_type && sii_invoice_type !== "none" ? "pending" : null,
        })
        .select()
        .single();

      if (orderError) {
        logger.error("Error creating POS order", orderError);
        return NextResponse.json(
          { error: "Failed to create order", details: orderError.message },
          { status: 500 },
        );
      }

      // Create order items and update inventory
      const orderItems = items.map((item) => ({
        order_id: newOrder.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price ?? item.unit_price * item.quantity,
        product_name: item.product_name,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        logger.error("Error creating order items", itemsError);
        // Don't fail, but log the error
      }

      // Update product inventory
      for (const item of items) {
        if (item.product_id) {
          const { error: inventoryError } = await supabase.rpc(
            "decrement_inventory",
            {
              product_id: item.product_id,
              quantity: item.quantity,
            },
          );

          if (inventoryError) {
            logger.error(
              `Error updating inventory for product ${item.product_id}`,
              inventoryError,
            );
          }
        }
      }

      // Create POS transaction record
      const { error: transactionError } = await supabase
        .from("pos_transactions")
        .insert({
          order_id: newOrder.id,
          pos_session_id: posSessionId,
          transaction_type: "sale",
          payment_method: payment_method_type,
          amount: total_amount,
          change_amount: change_amount || 0,
          receipt_printed: false,
        });

      if (transactionError) {
        logger.error("Error creating POS transaction", transactionError);
        // Don't fail the operation
      }

      // Create installments if payment method is installments
      if (
        payment_method_type === "installments" &&
        installments_count &&
        installments_count > 1
      ) {
        const installmentAmount = total_amount / installments_count;
        const installments = [];
        const today = new Date();

        for (let i = 1; i <= installments_count; i++) {
          const dueDate = new Date(today);
          dueDate.setMonth(dueDate.getMonth() + i);

          installments.push({
            order_id: newOrder.id,
            installment_number: i,
            due_date: dueDate.toISOString(),
            amount:
              i === installments_count
                ? total_amount - installmentAmount * (installments_count - 1) // Last installment gets remainder
                : installmentAmount,
            payment_status: i === 1 ? "paid" : "pending", // First installment is paid
          });
        }

        const { error: installmentsError } = await supabase
          .from("payment_installments")
          .insert(installments);

        if (installmentsError) {
          logger.error("Error creating installments", installmentsError);
        }
      }

      // Update POS session cash amount if cash payment
      if (payment_method_type === "cash" && posSessionId) {
        const { error: cashError } = await supabase.rpc(
          "update_pos_session_cash",
          {
            session_id: posSessionId,
            cash_amount: cash_received || total_amount,
          },
        );

        if (cashError) {
          logger.error("Error updating POS session cash", cashError);
        }
      }

      logger.info("POS sale processed successfully", { orderId: newOrder.id });

      return NextResponse.json({
        success: true,
        order: {
          ...newOrder,
          sii_invoice_number: siiInvoiceNumber,
        },
      });
    } catch (error) {
      if (error instanceof RateLimitError) {
        logger.warn("Rate limit exceeded for POS sale", {
          error: error.message,
        });
        return NextResponse.json({ error: error.message }, { status: 429 });
      }
      logger.error("POS process sale error", { error });
      return NextResponse.json(
        {
          error: "Internal server error",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      );
    }
  })(request);
}
