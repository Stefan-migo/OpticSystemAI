/**
 * Integration Tests for Orders API
 *
 * These tests validate:
 * 1. Basic CRUD operations
 * 2. Multi-tenancy data isolation
 * 3. Branch filtering
 * 4. Validation
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  createTestOrganization,
  createTestUser,
  createTestBranch,
  createTestOrder,
  cleanupTestData,
  makeAuthenticatedRequest,
  isMultiTenancyAvailable,
  type TestOrganization,
  type TestUser,
  type TestBranch,
} from "../helpers/test-setup";

describe("Orders API - Integration Tests", () => {
  let orgA: TestOrganization;
  let orgB: TestOrganization;
  let userA: TestUser;
  let userB: TestUser;
  let branchA: TestBranch;
  let branchB: TestBranch;
  let orderA: any;
  let orderB: any;
  let infrastructureAvailable: boolean;

  beforeAll(async () => {
    // Check if multi-tenancy infrastructure is available
    infrastructureAvailable = await isMultiTenancyAvailable();

    if (!infrastructureAvailable) {
      console.warn(
        "⚠️  Multi-tenancy infrastructure not available. Tests will be skipped.",
        "This is expected if Phase SaaS 0 has not been completed yet.",
      );
      return;
    }

    // Create two test organizations
    orgA = await createTestOrganization("Organization A", "basic");
    orgB = await createTestOrganization("Organization B", "basic");

    // Create users for each organization
    userA = await createTestUser(orgA.id, `user-a-${Date.now()}@test.com`);
    userB = await createTestUser(orgB.id, `user-b-${Date.now()}@test.com`);

    // Create branches for each organization
    branchA = await createTestBranch(orgA.id, "Branch A", "BRANCH-A");
    branchB = await createTestBranch(orgB.id, "Branch B", "BRANCH-B");

    // Create orders for each organization
    orderA = await createTestOrder(orgA.id, branchA.id, {
      email: "order-a@test.com",
      total_amount: 10000,
      status: "pending",
      payment_status: "pending",
    });

    orderB = await createTestOrder(orgB.id, branchB.id, {
      email: "order-b@test.com",
      total_amount: 20000,
      status: "processing",
      payment_status: "paid",
    });
  });

  afterAll(async () => {
    if (!infrastructureAvailable) return;
    // Cleanup test data
    await cleanupTestData(orgA.id);
    await cleanupTestData(orgB.id);
  });

  describe("Multi-tenancy Data Isolation", () => {
    it.skipIf(!infrastructureAvailable)(
      "should only return orders from user's organization",
      async () => {
        const response = await makeAuthenticatedRequest(
          "http://localhost:3000/api/admin/orders",
          {
            method: "GET",
          },
          userA.authToken,
        );

        expect(response.status).toBe(200);
        const data = await response.json();

        // User A should only see orders from orgA
        expect(data.orders).toBeDefined();
        const orderIds = data.orders.map((o: any) => o.id);
        expect(orderIds).toContain(orderA.id);
        expect(orderIds).not.toContain(orderB.id);
      },
    );

    it.skipIf(!infrastructureAvailable)(
      "should prevent user from accessing order from another organization",
      async () => {
        // User A tries to access order B (from orgB)
        const response = await makeAuthenticatedRequest(
          `http://localhost:3000/api/admin/orders/${orderB.id}`,
          {
            method: "GET",
          },
          userA.authToken,
        );

        // Should return 404 or 403 (not found or forbidden)
        expect([403, 404]).toContain(response.status);
      },
    );

    it.skipIf(!infrastructureAvailable)(
      "should filter orders by status within organization",
      async () => {
        const response = await makeAuthenticatedRequest(
          "http://localhost:3000/api/admin/orders?status=pending",
          {
            method: "GET",
          },
          userA.authToken,
        );

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.orders).toBeDefined();
        // All returned orders should be pending and from orgA
        data.orders.forEach((o: any) => {
          expect(o.status).toBe("pending");
        });
        // Should not include orders from orgB
        const orderIds = data.orders.map((o: any) => o.id);
        expect(orderIds).not.toContain(orderB.id);
      },
    );

    it.skipIf(!infrastructureAvailable)(
      "should filter orders by payment_status within organization",
      async () => {
        const response = await makeAuthenticatedRequest(
          "http://localhost:3000/api/admin/orders?payment_status=paid",
          {
            method: "GET",
          },
          userA.authToken,
        );

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.orders).toBeDefined();
        // All returned orders should have payment_status=paid and be from orgA
        data.orders.forEach((o: any) => {
          expect(o.payment_status).toBe("paid");
        });
      },
    );
  });

  describe("CRUD Operations", () => {
    it.skipIf(!infrastructureAvailable)(
      "should list orders with pagination",
      async () => {
        const response = await makeAuthenticatedRequest(
          "http://localhost:3000/api/admin/orders?limit=10&offset=0",
          {
            method: "GET",
          },
          userA.authToken,
        );

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.orders).toBeDefined();
        expect(Array.isArray(data.orders)).toBe(true);
        expect(data.total).toBeDefined();
        expect(data.limit).toBe(10);
        expect(data.offset).toBe(0);
      },
    );

    it.skipIf(!infrastructureAvailable)(
      "should get order statistics",
      async () => {
        const response = await makeAuthenticatedRequest(
          "http://localhost:3000/api/admin/orders",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "get_stats",
            }),
          },
          userA.authToken,
        );

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.stats).toBeDefined();
        expect(data.stats.orderCounts).toBeDefined();
      },
    );
  });

  describe("Data Integrity", () => {
    it.skipIf(!infrastructureAvailable)(
      "should return orders with correct structure",
      async () => {
        const response = await makeAuthenticatedRequest(
          "http://localhost:3000/api/admin/orders",
          {
            method: "GET",
          },
          userA.authToken,
        );

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.orders).toBeDefined();

        if (data.orders.length > 0) {
          const order = data.orders[0];
          expect(order).toHaveProperty("id");
          expect(order).toHaveProperty("order_number");
          expect(order).toHaveProperty("email");
          expect(order).toHaveProperty("status");
          expect(order).toHaveProperty("payment_status");
          expect(order).toHaveProperty("total_amount");
          expect(order).toHaveProperty("created_at");
        }
      },
    );

    it.skipIf(!infrastructureAvailable)(
      "should include order items when present",
      async () => {
        const response = await makeAuthenticatedRequest(
          "http://localhost:3000/api/admin/orders",
          {
            method: "GET",
          },
          userA.authToken,
        );

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.orders).toBeDefined();

        // Check if orders have order_items property (may be empty array)
        if (data.orders.length > 0) {
          const order = data.orders[0];
          expect(order).toHaveProperty("order_items");
          expect(Array.isArray(order.order_items)).toBe(true);
        }
      },
    );
  });
});
