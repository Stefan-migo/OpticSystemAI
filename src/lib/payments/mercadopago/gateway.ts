/**
 * Mercado Pago payment gateway implementation (IPaymentGateway).
 *
 * @module lib/payments/mercadopago/gateway
 */

import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import type { NextRequest } from "next/server";
import type { IPaymentGateway, PaymentIntentResponse } from "../interfaces";
import type { PaymentStatus, WebhookEvent } from "@/types/payment";
import { appLogger as logger } from "@/lib/logger";

function getMPClient(): { preference: Preference; payment: Payment } {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error(
      "MP_ACCESS_TOKEN is not set. Configure it in .env.local for Mercado Pago.",
    );
  }
  const config = new MercadoPagoConfig({ accessToken });
  return {
    preference: new Preference(config),
    payment: new Payment(config),
  };
}

export class MercadoPagoGateway implements IPaymentGateway {
  async createPaymentIntent(
    orderId: string | null,
    amount: number,
    currency: string,
    _userId: string,
    _organizationId: string,
  ): Promise<PaymentIntentResponse> {
    const { preference } = getMPClient();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    try {
      const result = await preference.create({
        body: {
          items: [
            {
              title: `Order ${orderId || "Direct Payment"}`,
              quantity: 1,
              unit_price: amount,
              currency_id: currency.toUpperCase(),
            },
          ],
          back_urls: {
            success: `${baseUrl}/admin/checkout?success=1&orderId=${orderId ?? ""}`,
            failure: `${baseUrl}/admin/checkout?success=0&orderId=${orderId ?? ""}`,
            pending: `${baseUrl}/admin/checkout?success=pending&orderId=${orderId ?? ""}`,
          },
          auto_return: "approved",
          external_reference: orderId ?? "",
          notification_url: `${baseUrl}/api/webhooks/mercadopago`,
        },
      });

      const body =
        (
          result as {
            body?: {
              id?: string;
              init_point?: string;
              sandbox_init_point?: string;
            };
          }
        ).body ??
        (result as {
          id?: string;
          init_point?: string;
          sandbox_init_point?: string;
        });
      const preferenceId = body.id ?? (result as { id?: string }).id;
      const initPoint =
        body.init_point ??
        body.sandbox_init_point ??
        (result as { init_point?: string; sandbox_init_point?: string })
          .init_point ??
        (result as { init_point?: string; sandbox_init_point?: string })
          .sandbox_init_point;

      if (!preferenceId || !initPoint) {
        throw new Error(
          "Mercado Pago preference creation failed or missing id/init_point.",
        );
      }

      logger.info("Mercado Pago Preference created", {
        preferenceId,
        orderId,
        amount,
      });

      return {
        preferenceId,
        approvalUrl: initPoint,
        gatewayPaymentIntentId: preferenceId,
        status: "pending",
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(
        "Error creating Mercado Pago Preference",
        error instanceof Error ? error : new Error(errorMessage),
        { orderId, amount },
      );
      throw new Error(`Mercado Pago error: ${errorMessage}`);
    }
  }

  async processWebhookEvent(request: NextRequest): Promise<WebhookEvent> {
    const query = request.nextUrl.searchParams;
    const topic = query.get("topic");
    const id = query.get("id");

    if (topic === "payment" && id) {
      const { payment } = getMPClient();
      try {
        const paymentInfo = await payment.get({ id });
        const paymentData =
          (paymentInfo as { body?: Record<string, unknown> }).body ??
          (paymentInfo as {
            id?: number;
            status?: string;
            external_reference?: string;
            transaction_amount?: number;
            currency_id?: string;
            order?: { id?: string };
            metadata?: { user_id?: string; organization_id?: string };
          });

        const orderId = paymentData.external_reference ?? null;
        const organizationId =
          (paymentData.metadata as { organization_id?: string } | undefined)
            ?.organization_id ?? null;
        const amount = paymentData.transaction_amount ?? 0;
        const currency = paymentData.currency_id ?? "CLP";
        const preferenceId = paymentData.order?.id ?? null;

        logger.info("Mercado Pago Payment Webhook received", {
          paymentId: id,
          status: paymentData.status,
          organizationId,
        });

        return {
          gateway: "mercadopago",
          gatewayEventId: `${topic}-${id}`,
          type: topic ?? "payment",
          status: this.mapStatus(paymentData.status ?? "pending"),
          gatewayTransactionId: String(paymentData.id ?? id),
          gatewayPaymentIntentId: preferenceId ?? String(id),
          amount,
          currency: currency.toUpperCase(),
          orderId,
          organizationId,
          metadata: paymentData as unknown as Record<string, unknown>,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        logger.error(
          "Error fetching Mercado Pago payment info for webhook",
          error instanceof Error ? error : new Error(errorMessage),
          { id },
        );
        throw new Error(`Mercado Pago Webhook Error: ${errorMessage}`);
      }
    }

    logger.warn(
      "Mercado Pago Webhook received with unhandled topic or missing ID",
      { topic, id },
    );
    throw new Error("Mercado Pago Webhook: Unhandled topic or missing ID");
  }

  mapStatus(mpStatus: string): PaymentStatus {
    switch (mpStatus) {
      case "pending":
      case "in_process":
        return "pending";
      case "approved":
        return "succeeded";
      case "rejected":
      case "cancelled":
        return "failed";
      case "refunded":
        return "refunded";
      default:
        logger.warn("Unknown Mercado Pago status mapped to pending", {
          mpStatus,
        });
        return "pending";
    }
  }
}
