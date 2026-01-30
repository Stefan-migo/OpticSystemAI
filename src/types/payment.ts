/**
 * Global payment types for payment gateways (Flow, Mercado Pago, PayPal).
 * Aligned with public.payments and public.webhook_events schema.
 *
 * @module types/payment
 */

export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded";

export type PaymentGateway = "flow" | "mercadopago" | "paypal";

export type Payment = {
  id: string;
  order_id: string | null;
  organization_id: string;
  user_id: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  gateway: PaymentGateway;
  gateway_transaction_id?: string | null;
  gateway_payment_intent_id?: string | null;
  gateway_charge_id?: string | null;
  payment_method?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type PaymentCreationAttributes = Omit<
  Payment,
  "id" | "created_at" | "updated_at"
>;

export type WebhookEvent = {
  gateway: PaymentGateway;
  gatewayEventId: string;
  type: string;
  status: PaymentStatus;
  gatewayTransactionId?: string | null;
  gatewayPaymentIntentId?: string | null;
  amount: number;
  currency: string;
  orderId?: string | null;
  organizationId?: string | null;
  metadata?: Record<string, unknown> | null;
};
