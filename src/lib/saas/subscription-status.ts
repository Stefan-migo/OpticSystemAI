/**
 * Subscription status utilities for SaaS
 * Checks trial expiry, subscription state, etc.
 */

import { createServiceRoleClient } from "@/utils/supabase/service-role";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "expired"
  | "past_due"
  | "cancelled"
  | "incomplete"
  | "none";

export interface SubscriptionStatusResult {
  status: SubscriptionStatus;
  isExpired: boolean;
  isTrialExpired: boolean;
  trialEndsAt: Date | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAt: Date | null;
  canceledAt: Date | null;
  organizationId: string | null;
}

/**
 * Get subscription status for an organization
 * CRITICAL: Demo and Root organizations never expire
 */
export async function getSubscriptionStatus(
  organizationId: string,
): Promise<SubscriptionStatusResult> {
  const supabase = createServiceRoleClient();

  // CRITICAL: Demo and Root organizations never expire
  // Demo: 00000000-0000-0000-0000-000000000001
  // Root: 00000000-0000-0000-0000-000000000010
  const DEMO_ORG_ID = "00000000-0000-0000-0000-000000000001";
  const ROOT_ORG_ID = "00000000-0000-0000-0000-000000000010";
  const isDemoOrRoot =
    organizationId === DEMO_ORG_ID || organizationId === ROOT_ORG_ID;

  const { data: sub } = await supabase
    .from("subscriptions")
    .select(
      "id, status, trial_ends_at, current_period_start, current_period_end, cancel_at, canceled_at",
    )
    .eq("organization_id", organizationId)
    .in("status", ["active", "trialing", "past_due", "incomplete", "cancelled"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // For demo/root: always return active status, never expired
  if (isDemoOrRoot) {
    return {
      status: "active",
      isExpired: false,
      isTrialExpired: false,
      trialEndsAt: null,
      currentPeriodStart: sub?.current_period_start
        ? new Date(sub.current_period_start)
        : null,
      currentPeriodEnd: sub?.current_period_end
        ? new Date(sub.current_period_end)
        : null,
      cancelAt: null,
      canceledAt: null,
      organizationId,
    };
  }

  if (!sub) {
    return {
      status: "none",
      isExpired: true,
      isTrialExpired: true,
      trialEndsAt: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAt: null,
      canceledAt: null,
      organizationId,
    };
  }

  const now = new Date();
  const trialEndsAt = sub.trial_ends_at ? new Date(sub.trial_ends_at) : null;
  const currentPeriodStart = sub.current_period_start
    ? new Date(sub.current_period_start)
    : null;
  const currentPeriodEnd = sub.current_period_end
    ? new Date(sub.current_period_end)
    : null;
  const cancelAt = sub.cancel_at ? new Date(sub.cancel_at) : null;
  const canceledAt = sub.canceled_at ? new Date(sub.canceled_at) : null;

  const isTrialExpired =
    sub.status === "trialing" && trialEndsAt !== null && trialEndsAt < now;

  // For cancelled subscriptions: access until cancel_at (or current_period_end)
  // If cancel_at is in the future, subscription is still active until then
  const effectiveEndDate =
    sub.status === "cancelled" && cancelAt && cancelAt > now
      ? cancelAt
      : currentPeriodEnd;

  const isExpired =
    isTrialExpired ||
    (sub.status === "cancelled" && cancelAt !== null && cancelAt < now) ||
    (effectiveEndDate !== null &&
      effectiveEndDate < now &&
      sub.status !== "cancelled");

  let status: SubscriptionStatus = sub.status as SubscriptionStatus;
  if (isTrialExpired) status = "expired";
  else if (isExpired && sub.status !== "cancelled") status = "expired";

  return {
    status,
    isExpired,
    isTrialExpired,
    trialEndsAt,
    currentPeriodStart,
    currentPeriodEnd,
    cancelAt,
    canceledAt,
    organizationId,
  };
}

/**
 * Check if trial has expired (convenience)
 */
export async function isTrialExpired(organizationId: string): Promise<boolean> {
  const result = await getSubscriptionStatus(organizationId);
  return result.isTrialExpired;
}
