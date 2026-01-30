/**
 * Payment gateway abstraction for Flow, Mercado Pago, PayPal.
 *
 * @module lib/payments/interfaces
 */

import type { NextRequest } from "next/server";
import type { PaymentStatus, WebhookEvent } from "@/types/payment";

export type PaymentIntentResponse = {
  clientSecret?: string;
  preferenceId?: string;
  approvalUrl?: string;
  paymentId?: string;
  gatewayPaymentIntentId?: string;
  status: PaymentStatus;
};

export interface IPaymentGateway {
  /**
   * Creates a payment intent and returns data for the frontend (client_secret, preferenceId, approval_url).
   */
  createPaymentIntent(
    orderId: string | null,
    amount: number,
    currency: string,
    userId: string,
    organizationId: string,
  ): Promise<PaymentIntentResponse>;

  /**
   * Processes a webhook event from the gateway (validates signature, returns standardized event).
   */
  processWebhookEvent(request: NextRequest): Promise<WebhookEvent>;

  /**
   * Maps gateway status to application PaymentStatus.
   */
  mapStatus(gatewayStatus: string): PaymentStatus;
}
