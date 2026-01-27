/**
 * Tier Validator for SaaS Multi-Tenancy
 *
 * Validates tier limits before allowing actions (create branch, add user, etc.)
 *
 * @module tier-validator
 */

import { createServiceRoleClient } from "@/utils/supabase/server";
import { getTierConfig, isUnlimited, SubscriptionTier } from "./tier-config";

export type TierLimitType = "branches" | "users" | "customers" | "products";

export interface TierValidationResult {
  allowed: boolean;
  reason?: string;
  currentCount: number;
  maxAllowed: number | "unlimited";
  tier: SubscriptionTier;
}

/**
 * Get organization tier from database
 */
async function getOrganizationTier(
  organizationId: string,
): Promise<SubscriptionTier | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("organizations")
    .select("subscription_tier")
    .eq("id", organizationId)
    .single();

  if (error || !data) {
    return null;
  }

  return data.subscription_tier as SubscriptionTier;
}

/**
 * Get current count for a limit type
 */
async function getCurrentCount(
  organizationId: string,
  limitType: TierLimitType,
): Promise<number> {
  const supabase = createServiceRoleClient();

  switch (limitType) {
    case "branches":
      const { count: branchesCount } = await supabase
        .from("branches")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organizationId);
      return branchesCount || 0;

    case "users":
      const { count: usersCount } = await supabase
        .from("admin_users")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("is_active", true);
      return usersCount || 0;

    case "customers":
      const { count: customersCount } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organizationId);
      return customersCount || 0;

    case "products":
      const { count: productsCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organizationId);
      return productsCount || 0;

    default:
      return 0;
  }
}

/**
 * Validate tier limit for an action
 */
export async function validateTierLimit(
  organizationId: string,
  limitType: TierLimitType,
  currentCount?: number,
): Promise<TierValidationResult> {
  // Get organization tier
  const tier = await getOrganizationTier(organizationId);
  if (!tier) {
    return {
      allowed: false,
      reason: "Organization not found",
      currentCount: 0,
      maxAllowed: 0,
      tier: "basic",
    };
  }

  // Get tier config
  const tierConfig = getTierConfig(tier);

  // Get current count if not provided
  const count =
    currentCount ?? (await getCurrentCount(organizationId, limitType));

  // Get max allowed
  let maxAllowed: number | "unlimited";
  switch (limitType) {
    case "branches":
      maxAllowed = tierConfig.max_branches;
      break;
    case "users":
      maxAllowed = tierConfig.max_users;
      break;
    case "customers":
      maxAllowed = tierConfig.max_customers;
      break;
    case "products":
      maxAllowed = tierConfig.max_products;
      break;
  }

  // Check if limit is reached
  const allowed = isUnlimited(maxAllowed) || count < maxAllowed;

  return {
    allowed,
    reason: allowed
      ? undefined
      : `Límite de ${maxAllowed} ${limitType} alcanzado para el tier ${tierConfig.name}`,
    currentCount: count,
    maxAllowed,
    tier,
  };
}

/**
 * Check if a feature is enabled for an organization
 */
export async function validateFeature(
  organizationId: string,
  feature: string,
): Promise<boolean> {
  const tier = await getOrganizationTier(organizationId);
  if (!tier) {
    return false;
  }

  const tierConfig = getTierConfig(tier);
  return (
    tierConfig.features[feature as keyof typeof tierConfig.features] ?? false
  );
}

/**
 * Get upgrade message for a limit
 */
export function getTierUpgradeMessage(
  tier: SubscriptionTier,
  limitType: TierLimitType,
): string {
  const tierConfig = getTierConfig(tier);
  const nextTier =
    tier === "premium" ? null : tier === "basic" ? "pro" : "premium";

  if (!nextTier) {
    return "Ya tienes el tier máximo disponible.";
  }

  const nextTierConfig = getTierConfig(nextTier);
  let nextLimit: number | "unlimited";

  switch (limitType) {
    case "branches":
      nextLimit = nextTierConfig.max_branches;
      break;
    case "users":
      nextLimit = nextTierConfig.max_users;
      break;
    case "customers":
      nextLimit = nextTierConfig.max_customers;
      break;
    case "products":
      nextLimit = nextTierConfig.max_products;
      break;
  }

  const nextLimitText = isUnlimited(nextLimit)
    ? "ilimitado"
    : nextLimit.toString();

  return `Upgrade a ${nextTierConfig.name} para obtener hasta ${nextLimitText} ${limitType}.`;
}
