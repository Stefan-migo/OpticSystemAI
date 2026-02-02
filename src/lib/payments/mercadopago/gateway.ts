/**
 * Mercado Pago payment gateway implementation (IPaymentGateway).
 *
 * @module lib/payments/mercadopago/gateway
 */

import {
  MercadoPagoConfig,
  Preference,
  Payment,
  MerchantOrder,
} from "mercadopago";
import type { NextRequest } from "next/server";
import type { IPaymentGateway, PaymentIntentResponse } from "../interfaces";
import type { PaymentStatus, WebhookEvent } from "@/types/payment";
import { appLogger as logger } from "@/lib/logger";

/** Result of fetching a merchant order for webhook processing. */
export interface MerchantOrderInfo {
  preference_id: string | null;
  payments: Array<{ id?: number; status?: string }>;
}

/** Extracts a readable message from SDK errors (Error, { message }, or unknown). */
function getReadableErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error)
    return String((error as { message: unknown }).message);
  return String(error);
}

function getMPClient(): {
  preference: Preference;
  payment: Payment;
  merchantOrder: MerchantOrder;
} {
  const sandboxMode = process.env.MERCADOPAGO_SANDBOX_MODE === "true";
  const accessToken = sandboxMode
    ? process.env.MP_ACCESS_TOKEN_SANDBOX ||
      process.env.MERCADOPAGO_ACCESS_TOKEN_SANDBOX ||
      process.env.MP_ACCESS_TOKEN ||
      process.env.MERCADOPAGO_ACCESS_TOKEN
    : process.env.MP_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error(
      sandboxMode
        ? "Mercado Pago sandbox requires one of: MP_ACCESS_TOKEN_SANDBOX, MERCADOPAGO_ACCESS_TOKEN_SANDBOX, MP_ACCESS_TOKEN, or MERCADOPAGO_ACCESS_TOKEN in .env.local"
        : "Mercado Pago requires MP_ACCESS_TOKEN or MERCADOPAGO_ACCESS_TOKEN in .env.local",
    );
  }
  const config = new MercadoPagoConfig({ accessToken });
  return {
    preference: new Preference(config),
    payment: new Payment(config),
    merchantOrder: new MerchantOrder(config),
  };
}

export class MercadoPagoGateway implements IPaymentGateway {
  async createPaymentIntent(
    orderId: string | null,
    amount: number,
    currency: string,
    userId: string,
    organizationId: string,
  ): Promise<PaymentIntentResponse> {
    const { preference } = getMPClient();
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";
    const successUrl = `${baseUrl.replace(/\/$/, "")}/admin/checkout/result?success=1&orderId=${orderId ?? ""}`;
    const failureUrl = `${baseUrl.replace(/\/$/, "")}/admin/checkout/result?success=0&orderId=${orderId ?? ""}`;
    const pendingUrl = `${baseUrl.replace(/\/$/, "")}/admin/checkout/result?success=pending&orderId=${orderId ?? ""}`;
    // MP requires back_urls.success to be defined and valid when auto_return is set; use HTTPS (e.g. ngrok) in dev
    const useAutoReturn = successUrl.startsWith("https://");

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
            success: successUrl,
            failure: failureUrl,
            pending: pendingUrl,
          },
          ...(useAutoReturn ? { auto_return: "approved" as const } : {}),
          external_reference: orderId ?? "",
          notification_url: `${baseUrl.replace(/\/$/, "")}/api/webhooks/mercadopago`,
          metadata: {
            user_id: userId,
            organization_id: organizationId,
            order_id: orderId ?? "",
            integration_version: "1.0",
            environment: process.env.NODE_ENV ?? "development",
          },
          statement_descriptor: "OPTTIUS",
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
      const errorMessage = getReadableErrorMessage(error);
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
      const { payment, merchantOrder } = getMPClient();
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
            preference_id?: string;
            metadata?: { user_id?: string; organization_id?: string };
          });

        const orderId = paymentData.external_reference ?? null;
        const organizationId =
          (paymentData.metadata as { organization_id?: string } | undefined)
            ?.organization_id ?? null;
        const amount = paymentData.transaction_amount ?? 0;
        const currency = paymentData.currency_id ?? "CLP";
        // We store gateway_payment_intent_id = preference_id (from createPaymentIntent).
        // MP payment response often has order.id = merchant_order id but no top-level preference_id.
        let preferenceId =
          (paymentData as { preference_id?: string }).preference_id ?? null;
        if (
          !preferenceId &&
          (paymentData.order as { id?: string } | undefined)?.id
        ) {
          const merchantOrderId = String(
            (paymentData.order as { id?: string }).id,
          );
          const orderInfo = await this.getMerchantOrder(merchantOrderId);
          preferenceId = orderInfo?.preference_id ?? null;
        }
        if (!preferenceId) {
          preferenceId =
            (paymentData.order as { id?: string } | undefined)?.id ?? null;
        }

        logger.info("Mercado Pago Payment Webhook received", {
          paymentId: id,
          status: paymentData.status,
          organizationId,
          preferenceId,
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

  /**
   * Fetches a merchant order by ID (for merchant_order webhook processing).
   * Used to get preference_id and payment statuses without relying on payment-topic webhook.
   */
  async getMerchantOrder(
    merchantOrderId: string,
  ): Promise<MerchantOrderInfo | null> {
    try {
      const { merchantOrder } = getMPClient();
      const result = await merchantOrder.get({
        merchantOrderId,
      });
      const body =
        (
          result as {
            body?: {
              preference_id?: string;
              payments?: Array<{ id?: number; status?: string }>;
            };
          }
        ).body ??
        (result as {
          preference_id?: string;
          payments?: Array<{ id?: number; status?: string }>;
        });
      const preference_id =
        typeof body.preference_id === "string" ? body.preference_id : null;
      const payments = Array.isArray(body.payments) ? body.payments : [];
      logger.info("Mercado Pago Merchant Order fetched", {
        merchantOrderId,
        preference_id,
        paymentCount: payments.length,
      });
      return { preference_id, payments };
    } catch (error) {
      logger.error(
        "Error fetching Mercado Pago merchant order",
        error instanceof Error ? error : new Error(String(error)),
        { merchantOrderId },
      );
      return null;
    }
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
