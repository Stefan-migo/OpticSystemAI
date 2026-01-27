/**
 * Test Helpers for Integration Tests
 *
 * Provides utilities to create test data (organizations, users, etc.)
 * for multi-tenancy validation tests
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Create a service role client for tests (uses local Supabase)
 */
function createTestServiceRoleClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
type Organization = Tables<"organizations">;
type AdminUser = Tables<"admin_users">;
type Branch = Tables<"branches">;
type Customer = Tables<"customers">;
type Product = Tables<"products">;
type Order = Tables<"orders">;

export interface TestOrganization {
  id: string;
  name: string;
  slug: string;
  subscription_tier: "basic" | "pro" | "premium";
}

export interface TestUser {
  id: string;
  email: string;
  organization_id: string;
  authToken?: string;
}

export interface TestBranch {
  id: string;
  name: string;
  code: string;
  organization_id: string;
}

/**
 * Check if multi-tenancy infrastructure is available
 */
export async function isMultiTenancyAvailable(): Promise<boolean> {
  try {
    const supabase = createTestServiceRoleClient();
    // Try to query the organizations table
    const { error, data } = await supabase
      .from("organizations")
      .select("id")
      .limit(1);

    if (error) {
      console.log(
        `[Test Setup] Organizations table check failed: ${error.message}`,
      );
      return false;
    }

    console.log(
      `[Test Setup] Multi-tenancy infrastructure available: ${!error}`,
    );
    return !error;
  } catch (err: any) {
    console.log(
      `[Test Setup] Exception checking multi-tenancy: ${err?.message}`,
    );
    return false;
  }
}

/**
 * Create a test organization
 */
export async function createTestOrganization(
  name: string = `Test Org ${Date.now()}`,
  subscription_tier: "basic" | "pro" | "premium" = "basic",
): Promise<TestOrganization> {
  const supabase = createTestServiceRoleClient();

  const slug = name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();

  const { data, error } = await supabase
    .from("organizations")
    .insert({
      name,
      slug,
      subscription_tier,
      status: "active",
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create test organization: ${error?.message}`);
  }

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    subscription_tier: data.subscription_tier as "basic" | "pro" | "premium",
  };
}

/**
 * Create a test user with auth and admin_users entry
 */
export async function createTestUser(
  organizationId: string,
  email: string = `test-${Date.now()}@test.com`,
  role: string = "admin",
): Promise<TestUser> {
  const supabase = createTestServiceRoleClient();

  // Create auth user
  const { data: authUser, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password: "TestPassword123!",
      email_confirm: true,
    });

  if (authError || !authUser.user) {
    throw new Error(`Failed to create auth user: ${authError?.message}`);
  }

  // Create admin_users entry
  const { data: adminUser, error: adminError } = await supabase
    .from("admin_users")
    .insert({
      id: authUser.user.id,
      email,
      role,
      organization_id: organizationId,
      is_active: true,
    })
    .select()
    .single();

  if (adminError || !adminUser) {
    // Cleanup auth user if admin_users creation fails
    await supabase.auth.admin.deleteUser(authUser.user.id);
    throw new Error(`Failed to create admin user: ${adminError?.message}`);
  }

  // Get auth token for API calls
  const { data: sessionData, error: sessionError } =
    await supabase.auth.signInWithPassword({
      email,
      password: "TestPassword123!",
    });

  return {
    id: authUser.user.id,
    email,
    organization_id: organizationId,
    authToken: sessionData?.session?.access_token,
  };
}

/**
 * Create a test branch
 */
export async function createTestBranch(
  organizationId: string,
  name: string = `Test Branch ${Date.now()}`,
  code: string = `TEST-${Date.now()}`,
): Promise<TestBranch> {
  const supabase = createTestServiceRoleClient();

  const { data, error } = await supabase
    .from("branches")
    .insert({
      name,
      code,
      organization_id: organizationId,
      is_active: true,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create test branch: ${error?.message}`);
  }

  return {
    id: data.id,
    name: data.name,
    code: data.code,
    organization_id: data.organization_id!,
  };
}

/**
 * Create a test customer
 */
export async function createTestCustomer(
  organizationId: string,
  branchId: string,
  data: Partial<Customer> = {},
): Promise<Customer> {
  const supabase = createTestServiceRoleClient();

  const { data: customerData, error } = await supabase
    .from("customers")
    .insert({
      organization_id: organizationId,
      branch_id: branchId,
      first_name: data.first_name || "Test",
      last_name: data.last_name || "Customer",
      email: data.email || `customer-${Date.now()}@test.com`,
      ...data,
    })
    .select()
    .single();

  if (error || !customerData) {
    throw new Error(`Failed to create test customer: ${error?.message}`);
  }

  return customerData;
}

/**
 * Create a test product
 */
export async function createTestProduct(
  organizationId: string,
  branchId: string,
  data: Partial<Product> = {},
): Promise<Product> {
  const supabase = createTestServiceRoleClient();

  const { data: productData, error } = await supabase
    .from("products")
    .insert({
      organization_id: organizationId,
      branch_id: branchId,
      name: data.name || `Test Product ${Date.now()}`,
      slug: data.slug || `test-product-${Date.now()}`,
      price: data.price || 10000,
      currency: data.currency || "CLP",
      status: data.status || "active",
      ...data,
    })
    .select()
    .single();

  if (error || !productData) {
    throw new Error(`Failed to create test product: ${error?.message}`);
  }

  return productData;
}

/**
 * Create a test order
 */
export async function createTestOrder(
  organizationId: string,
  branchId: string,
  data: Partial<Order> = {},
): Promise<Order> {
  const supabase = createTestServiceRoleClient();

  // Generate unique order number
  const orderNumber = `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const { data: orderData, error } = await supabase
    .from("orders")
    .insert({
      organization_id: organizationId,
      branch_id: branchId,
      order_number: orderNumber,
      email: data.email || `order-${Date.now()}@test.com`,
      subtotal: data.subtotal || 10000,
      tax_amount: data.tax_amount || 0,
      shipping_amount: data.shipping_amount || 0,
      discount_amount: data.discount_amount || 0,
      total_amount: data.total_amount || 10000,
      currency: data.currency || "CLP",
      status: data.status || "pending",
      payment_status: data.payment_status || "pending",
      ...data,
    })
    .select()
    .single();

  if (error || !orderData) {
    throw new Error(`Failed to create test order: ${error?.message}`);
  }

  return orderData;
}

/**
 * Cleanup test data
 */
export async function cleanupTestData(organizationId: string): Promise<void> {
  const supabase = createTestServiceRoleClient();

  // Get all users in organization
  const { data: users } = await supabase
    .from("admin_users")
    .select("id")
    .eq("organization_id", organizationId);

  // Delete auth users
  if (users) {
    for (const user of users) {
      await supabase.auth.admin.deleteUser(user.id);
    }
  }

  // Delete organization (cascade will delete related data)
  await supabase.from("organizations").delete().eq("id", organizationId);
}

/**
 * Make authenticated API request
 * Note: Next.js API routes use cookies for auth, not Bearer tokens
 * We need to set the session cookie manually
 */
export async function makeAuthenticatedRequest(
  url: string,
  options: RequestInit = {},
  authToken?: string,
): Promise<Response> {
  const headers = new Headers(options.headers);

  // For Next.js API routes, we need to set the session cookie
  // The token is stored in a cookie named 'sb-<project-ref>-auth-token'
  if (authToken) {
    // Extract project ref from URL (local Supabase uses '127.0.0.1:54321')
    const projectRef = "127.0.0.1:54321";
    const cookieName = `sb-${projectRef.replace(/[^a-zA-Z0-9]/g, "-")}-auth-token`;

    // Create a cookie with the session data
    // The cookie format for Supabase SSR is: { access_token, refresh_token, expires_at, token_type, user }
    const sessionData = {
      access_token: authToken,
      refresh_token: "", // Not needed for testing
      expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      token_type: "bearer",
      user: {}, // User data would be here
    };

    headers.set(
      "Cookie",
      `${cookieName}=${encodeURIComponent(JSON.stringify([sessionData]))}`,
    );

    // Also set Authorization header as fallback
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: "include", // Include cookies
  });
}
