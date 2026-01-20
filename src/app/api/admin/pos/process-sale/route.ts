import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/server";
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
  try {
    return await (withRateLimit(rateLimitConfigs.pos) as any)(
      request,
      async () => {
        try {
          logger.info("POS Process Sale API called");
          const supabase = await createClient();

          // Check admin authorization
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();
          if (userError || !user) {
            return NextResponse.json(
              { error: "Unauthorized" },
              { status: 401 },
            );
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
            validatedBody = await parseAndValidateBody(
              request,
              processSaleSchema,
            );
          } catch (error) {
            if (error instanceof ValidationError) {
              return validationErrorResponse(error);
            }
            throw error;
          }

          // Destructure validated data
          const {
            email,
            customer_id,
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

          const supabaseServiceRole = createServiceRoleClient();

          // Generate SII invoice number if needed
          let siiInvoiceNumber = null;
          if (sii_invoice_type && sii_invoice_type !== "none") {
            const { data: invoiceNum, error: invoiceError } =
              await supabase.rpc("generate_sii_invoice_number", {
                invoice_type: sii_invoice_type,
              });

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

          // Extract frame and lens information from items
          let frameInfo: {
            frame_product_id: string | null;
            frame_name: string;
            frame_brand: string | null;
            frame_model: string | null;
            frame_color: string | null;
            frame_size: string | null;
            frame_sku: string | null;
            frame_cost: number;
          } = {
            frame_product_id: null,
            frame_name: "Marco",
            frame_brand: null,
            frame_model: null,
            frame_color: null,
            frame_size: null,
            frame_sku: null,
            frame_cost: 0,
          };

          let lensInfo: {
            lens_type: string;
            lens_material: string;
            lens_index: number | null;
            lens_treatments: string[];
            lens_tint_color: string | null;
            lens_tint_percentage: number | null;
            lens_cost: number;
          } = {
            lens_type: "single_vision",
            lens_material: "cr39",
            lens_index: null,
            lens_treatments: [],
            lens_tint_color: null,
            lens_tint_percentage: null,
            lens_cost: 0,
          };

          let treatmentsCost = 0;
          let laborCost = 0;

          // Parse items to extract frame, lens, treatments, and labor info
          for (const item of items) {
            const itemName = item.product_name.toLowerCase();
            const itemId = item.product_id || "";

            // Frame detection
            if (
              itemId.includes("frame") ||
              itemName.includes("marco") ||
              itemName.includes("frame")
            ) {
              frameInfo.frame_name = item.product_name;
              frameInfo.frame_cost = item.unit_price;
              // Try to extract frame_product_id if it's a valid UUID (not a temporary ID)
              if (
                item.product_id &&
                !item.product_id.includes("frame-manual") &&
                !item.product_id.includes("-")
              ) {
                frameInfo.frame_product_id = item.product_id;
              }
            }

            // Lens detection
            if (
              itemId.includes("lens") ||
              itemName.includes("lente") ||
              itemName.includes("lens")
            ) {
              lensInfo.lens_cost = item.unit_price;
              // Try to parse lens type and material from name
              const lensMatch = item.product_name.match(
                /lente\s+(\w+)\s+(\w+)/i,
              );
              if (lensMatch) {
                lensInfo.lens_type = lensMatch[1];
                lensInfo.lens_material = lensMatch[2];
              }
            }

            // Treatments detection
            if (
              itemId.includes("treatments") ||
              itemName.includes("tratamiento") ||
              itemName.includes("treatment")
            ) {
              treatmentsCost += item.unit_price;
              // Try to extract treatments from name
              const treatmentMatch = item.product_name.match(
                /tratamientos?:\s*(.+)/i,
              );
              if (treatmentMatch) {
                const treatments = treatmentMatch[1]
                  .split(",")
                  .map((t) => t.trim().toLowerCase());
                lensInfo.lens_treatments = treatments;
              }
            }

            // Labor detection
            if (
              itemId.includes("labor") ||
              itemName.includes("mano de obra") ||
              itemName.includes("montaje")
            ) {
              laborCost += item.unit_price;
            }
          }

          // Generate work order number
          const { data: workOrderNumber, error: workOrderNumberError } =
            await supabaseServiceRole.rpc("generate_work_order_number");

          if (workOrderNumberError || !workOrderNumber) {
            logger.error(
              "Error generating work order number",
              workOrderNumberError,
            );
            return NextResponse.json(
              { error: "Failed to generate work order number" },
              { status: 500 },
            );
          }

          // Validate customer_id is required for work order
          if (!customer_id) {
            return NextResponse.json(
              { error: "customer_id is required to create a work order" },
              { status: 400 },
            );
          }

          // Create work order
          const workOrderData: Record<string, unknown> = {
            work_order_number: workOrderNumber,
            branch_id: branchContext.branchId,
            customer_id: customer_id,
            prescription_id: null,
            quote_id: null,
            frame_product_id: frameInfo.frame_product_id,
            frame_name: frameInfo.frame_name,
            frame_brand: frameInfo.frame_brand,
            frame_model: frameInfo.frame_model,
            frame_color: frameInfo.frame_color,
            frame_size: frameInfo.frame_size,
            frame_sku: frameInfo.frame_sku,
            frame_serial_number: null,
            lens_type: lensInfo.lens_type,
            lens_material: lensInfo.lens_material,
            lens_index: lensInfo.lens_index,
            lens_treatments: lensInfo.lens_treatments,
            lens_tint_color: lensInfo.lens_tint_color,
            lens_tint_percentage: lensInfo.lens_tint_percentage,
            prescription_snapshot: null,
            lab_name: null,
            lab_contact: null,
            lab_order_number: null,
            lab_estimated_delivery_date: null,
            status: status === "delivered" ? "completed" : "pending",
            frame_cost: frameInfo.frame_cost,
            lens_cost: lensInfo.lens_cost,
            treatments_cost: treatmentsCost,
            labor_cost: laborCost,
            lab_cost: 0,
            subtotal: subtotal,
            tax_amount: tax_amount || 0,
            discount_amount: 0,
            total_amount: total_amount,
            currency: currency || "CLP",
            payment_status: payment_status || "paid",
            payment_method: payment_method_type,
            deposit_amount: payment_status === "paid" ? total_amount : 0,
            balance_amount: payment_status === "paid" ? 0 : total_amount,
            pos_order_id: null, // Will be set after creating POS transaction
            internal_notes: `Venta POS - Método de pago: ${payment_method_type}`,
            customer_notes: null,
            assigned_to: user.id,
            created_by: user.id,
          };

          const { data: newWorkOrder, error: workOrderError } =
            await supabaseServiceRole
              .from("lab_work_orders")
              .insert(workOrderData)
              .select()
              .single();

          if (workOrderError) {
            logger.error("Error creating work order", workOrderError);
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

          // Update status dates if status is not 'quote'
          if (workOrderData.status && workOrderData.status !== "quote") {
            await supabaseServiceRole.rpc("update_work_order_status", {
              p_work_order_id: newWorkOrder.id,
              p_new_status: workOrderData.status as string,
              p_changed_by: user.id,
              p_notes: "Work order created from POS sale",
            });
          }

          // Update product inventory (only for real products, not temporary IDs)
          for (const item of items) {
            if (
              item.product_id &&
              !item.product_id.includes("frame-manual") &&
              !item.product_id.includes("lens-") &&
              !item.product_id.includes("treatments-") &&
              !item.product_id.includes("labor-") &&
              !item.product_id.includes("discount-")
            ) {
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

          // Create POS transaction record (link to work order)
          // Note: pos_transactions currently only has order_id, so we'll skip this for now
          // TODO: Add work_order_id column to pos_transactions table via migration
          // For now, we'll log the transaction info but not create the record
          logger.info("POS transaction (work order)", {
            work_order_id: newWorkOrder.id,
            pos_session_id: posSessionId,
            transaction_type: "sale",
            payment_method: payment_method_type,
            amount: total_amount,
            change_amount: change_amount || 0,
          });

          // Note: Installments for work orders are handled differently
          // For now, we'll skip installments for POS work orders
          // If needed, this can be implemented later

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

          logger.info("POS sale processed successfully", {
            workOrderId: newWorkOrder.id,
            workOrderNumber: newWorkOrder.work_order_number,
          });

          return NextResponse.json({
            success: true,
            work_order: {
              ...newWorkOrder,
              sii_invoice_number: siiInvoiceNumber,
            },
            // Keep order field for backward compatibility (deprecated)
            order: {
              id: newWorkOrder.id,
              order_number: newWorkOrder.work_order_number,
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
      },
    );
  } catch (error) {
    // Catch any errors from withRateLimit itself (e.g., RateLimitError thrown before try-catch)
    if (error instanceof RateLimitError) {
      logger.warn("Rate limit exceeded", { error: error.message });
      return NextResponse.json({ error: error.message }, { status: 429 });
    }

    // Log and return error response for any other unexpected errors
    logger.error(
      "Unexpected error in POST handler",
      error instanceof Error ? error : new Error(String(error)),
    );
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
