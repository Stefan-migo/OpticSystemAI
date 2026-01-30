/**
 * GET /api/webhooks/mercadopago
 * Recibe notificaciones de Mercado Pago (topic=payment, id=payment_id).
 * Sin rate limiting. Idempotencia con webhook_events.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/utils/supabase/server";
import { MercadoPagoGateway } from "@/lib/payments/mercadopago/gateway";
import { PaymentService } from "@/lib/payments/services/payment-service";
import { appLogger as logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const supabase = createServiceRoleClient();
  const mpGateway = new MercadoPagoGateway();
  const paymentService = new PaymentService(supabase);

  try {
    const webhookEvent = await mpGateway.processWebhookEvent(request);
    logger.info("Mercado Pago Webhook Event processed", {
      gatewayEventId: webhookEvent.gatewayEventId,
      type: webhookEvent.type,
      status: webhookEvent.status,
    });

    const alreadyProcessed = await paymentService.recordWebhookEvent(
      webhookEvent.gateway,
      webhookEvent.gatewayEventId,
      webhookEvent.type,
      null,
      webhookEvent.metadata ?? undefined,
    );

    if (alreadyProcessed) {
      logger.info("Mercado Pago Webhook event already processed, skipping", {
        gatewayEventId: webhookEvent.gatewayEventId,
      });
      return NextResponse.json(
        { received: true, message: "Already processed" },
        { status: 200 },
      );
    }

    const gatewayPaymentIntentId =
      webhookEvent.gatewayPaymentIntentId ?? undefined;
    if (!gatewayPaymentIntentId) {
      logger.warn("Mercado Pago Webhook: no gatewayPaymentIntentId in event", {
        type: webhookEvent.type,
      });
      await paymentService.markWebhookEventAsProcessed(
        webhookEvent.gateway,
        webhookEvent.gatewayEventId,
      );
      return NextResponse.json(
        { received: true, message: "Event has no payment intent ID" },
        { status: 200 },
      );
    }

    const existingPayment =
      await paymentService.getPaymentByGatewayPaymentIntentId(
        gatewayPaymentIntentId,
      );

    if (!existingPayment) {
      logger.warn(
        "Mercado Pago Webhook: No existing payment found for gateway intent ID",
        { gatewayPaymentIntentId },
      );
      await paymentService.markWebhookEventAsProcessed(
        webhookEvent.gateway,
        webhookEvent.gatewayEventId,
      );
      return NextResponse.json(
        { received: true, message: "Payment not found internally" },
        { status: 200 },
      );
    }

    await paymentService.updatePaymentStatus(
      existingPayment.id,
      webhookEvent.status,
      webhookEvent.gatewayTransactionId ?? undefined,
      webhookEvent.metadata ?? undefined,
    );

    await paymentService.markWebhookEventAsProcessed(
      webhookEvent.gateway,
      webhookEvent.gatewayEventId,
    );

    if (webhookEvent.status === "succeeded" && existingPayment.order_id) {
      await paymentService.fulfillOrder(existingPayment.order_id);
      logger.info("Order fulfilled successfully via Mercado Pago Webhook", {
        orderId: existingPayment.order_id,
      });
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook processing failed";
    logger.error(
      "Error processing Mercado Pago Webhook",
      error instanceof Error ? error : new Error(message),
      {
        requestHeaders: Object.fromEntries(request.headers.entries()),
      },
    );
    return NextResponse.json(
      { error: "Webhook processing failed internally" },
      { status: 500 },
    );
  }
}
