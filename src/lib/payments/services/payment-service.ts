/**
 * Business logic for payments and webhook events (DB operations).
 *
 * @module lib/payments/services/payment-service
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Payment,
  PaymentCreationAttributes,
  PaymentStatus,
  PaymentGateway,
} from "@/types/payment";
import { appLogger as logger } from "@/lib/logger";

export class PaymentService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /** Creates a new payment record. */
  async createPayment(data: PaymentCreationAttributes): Promise<Payment> {
    const { data: payment, error } = await this.supabase
      .from("payments")
      .insert(data as Record<string, unknown>)
      .select()
      .single();

    if (error) {
      logger.error("Failed to create payment in DB", error, { data });
      throw new Error(`Error creating payment: ${error.message}`);
    }
    if (!payment) {
      logger.error("Payment creation returned null", undefined, { data });
      throw new Error("Payment creation returned null");
    }
    logger.info("Payment record created", {
      paymentId: payment.id,
      gateway: payment.gateway,
      organizationId: payment.organization_id,
    });
    return payment as Payment;
  }

  /** Updates payment status (and optional gateway_transaction_id, gateway_payment_intent_id, metadata). */
  async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    gatewayTransactionId?: string | null,
    metadata?: Record<string, unknown> | null,
    gatewayPaymentIntentId?: string | null,
  ): Promise<Payment> {
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (gatewayTransactionId != null)
      updateData.gateway_transaction_id = gatewayTransactionId;
    if (gatewayPaymentIntentId != null)
      updateData.gateway_payment_intent_id = gatewayPaymentIntentId;
    if (metadata != null) updateData.metadata = metadata;

    const { data: payment, error } = await this.supabase
      .from("payments")
      .update(updateData)
      .eq("id", paymentId)
      .select()
      .single();

    if (error) {
      logger.error("Failed to update payment status in DB", error, {
        paymentId,
        status,
      });
      throw new Error(`Error updating payment status: ${error.message}`);
    }
    if (!payment) {
      logger.error("Payment update returned null", undefined, {
        paymentId,
        status,
      });
      throw new Error("Payment update returned null");
    }
    logger.info("Payment status updated", {
      paymentId: payment.id,
      newStatus: status,
    });
    return payment as Payment;
  }

  /** Fetches payment by internal ID. */
  async getPaymentById(paymentId: string): Promise<Payment | null> {
    const { data: payment, error } = await this.supabase
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .single();

    if (error && error.code !== "PGRST116") {
      logger.error("Error fetching payment by ID", error, { paymentId });
      throw new Error(`Error fetching payment: ${error.message}`);
    }
    return payment as Payment | null;
  }

  /** Fetches payment by gateway payment intent ID (for webhooks). */
  async getPaymentByGatewayPaymentIntentId(
    gatewayPaymentIntentId: string,
  ): Promise<Payment | null> {
    const { data: payment, error } = await this.supabase
      .from("payments")
      .select("*")
      .eq("gateway_payment_intent_id", gatewayPaymentIntentId)
      .single();

    if (error && error.code !== "PGRST116") {
      logger.error("Error fetching payment by gateway intent ID", error, {
        gatewayPaymentIntentId,
      });
      throw new Error(`Error fetching payment: ${error.message}`);
    }
    return payment as Payment | null;
  }

  /** Records webhook event for idempotency; returns true if already processed. */
  async recordWebhookEvent(
    gateway: PaymentGateway,
    gatewayEventId: string,
    eventType: string,
    paymentId: string | null,
    metadata?: Record<string, unknown> | null,
  ): Promise<boolean> {
    const { data: existingEvent } = await this.supabase
      .from("webhook_events")
      .select("id, processed")
      .eq("gateway", gateway)
      .eq("gateway_event_id", gatewayEventId)
      .single();

    if (existingEvent) {
      logger.info("Webhook event already processed", {
        gateway,
        gatewayEventId,
        wasProcessed: existingEvent.processed,
      });
      return existingEvent.processed as boolean;
    }

    const { error } = await this.supabase.from("webhook_events").insert({
      gateway,
      gateway_event_id: gatewayEventId,
      payment_id: paymentId,
      event_type: eventType,
      processed: false,
      metadata: metadata ?? {},
    });

    if (error) {
      logger.error("Failed to record webhook event", error, {
        gateway,
        gatewayEventId,
      });
      throw new Error(`Error recording webhook event: ${error.message}`);
    }
    return false;
  }

  /** Marks webhook event as processed. */
  async markWebhookEventAsProcessed(
    gateway: PaymentGateway,
    gatewayEventId: string,
  ): Promise<void> {
    const { error } = await this.supabase
      .from("webhook_events")
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
      })
      .eq("gateway", gateway)
      .eq("gateway_event_id", gatewayEventId);

    if (error) {
      logger.error("Failed to mark webhook event as processed", error, {
        gateway,
        gatewayEventId,
      });
    }
  }

  /** Marks order as completed after successful payment. */
  async fulfillOrder(orderId: string): Promise<void> {
    logger.info("Order fulfillment logic triggered", { orderId });
    const { data, error } = await this.supabase
      .from("orders")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select()
      .single();

    if (error) {
      logger.error("Failed to fulfill order", error, { orderId });
      throw new Error(`Error fulfilling order: ${error.message}`);
    }
    if (!data) {
      logger.warn("Order not found for fulfillment", { orderId });
      return;
    }
    logger.info("Order fulfilled successfully", { orderId });
  }
}
