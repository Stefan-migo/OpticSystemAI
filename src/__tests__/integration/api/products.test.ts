/**
 * Integration Tests for Products API
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
  createTestProduct,
  cleanupTestData,
  makeAuthenticatedRequest,
  isMultiTenancyAvailable,
  type TestOrganization,
  type TestUser,
  type TestBranch,
} from "../helpers/test-setup";

describe("Products API - Integration Tests", () => {
  let orgA: TestOrganization;
  let orgB: TestOrganization;
  let userA: TestUser;
  let userB: TestUser;
  let branchA: TestBranch;
  let branchB: TestBranch;
  let productA: any;
  let productB: any;
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

    // Create products for each organization
    productA = await createTestProduct(orgA.id, branchA.id, {
      name: "Product A",
      price: 10000,
      status: "active",
    });

    productB = await createTestProduct(orgB.id, branchB.id, {
      name: "Product B",
      price: 20000,
      status: "active",
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
      "should only return products from user's organization",
      async () => {
        const response = await makeAuthenticatedRequest(
          "http://localhost:3000/api/admin/products",
          {
            method: "GET",
          },
          userA.authToken,
        );

        expect(response.status).toBe(200);
        const data = await response.json();

        // User A should only see products from orgA
        expect(data.products).toBeDefined();
        const productIds = data.products.map((p: any) => p.id);
        expect(productIds).toContain(productA.id);
        expect(productIds).not.toContain(productB.id);
      },
    );

    it.skipIf(!infrastructureAvailable)(
      "should prevent user from accessing product from another organization",
      async () => {
        // User A tries to access product B (from orgB)
        const response = await makeAuthenticatedRequest(
          `http://localhost:3000/api/admin/products/${productB.id}`,
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
      "should prevent user from creating product in another organization",
      async () => {
        // User A tries to create product with orgB's branch
        const response = await makeAuthenticatedRequest(
          "http://localhost:3000/api/admin/products",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: "Test Product",
              price: 5000,
              branch_id: branchB.id, // Branch from orgB
            }),
          },
          userA.authToken,
        );

        // Should fail - user cannot create product in another org's branch
        expect([400, 403, 404]).toContain(response.status);
      },
    );

    it.skipIf(!infrastructureAvailable)(
      "should prevent user from updating product from another organization",
      async () => {
        // User A tries to update product B
        const response = await makeAuthenticatedRequest(
          `http://localhost:3000/api/admin/products/${productB.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: "Updated Product",
              price: 25000,
            }),
          },
          userA.authToken,
        );

        // Should fail
        expect([403, 404]).toContain(response.status);
      },
    );
  });

  describe("CRUD Operations", () => {
    it.skipIf(!infrastructureAvailable)("should create a product", async () => {
      const response = await makeAuthenticatedRequest(
        "http://localhost:3000/api/admin/products",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: `New Product ${Date.now()}`,
            price: 15000,
            branch_id: branchA.id,
            status: "active",
          }),
        },
        userA.authToken,
      );

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.product).toBeDefined();
      expect(data.product.name).toContain("New Product");
      expect(data.product.organization_id).toBe(orgA.id);
    });

    it.skipIf(!infrastructureAvailable)(
      "should get a product by ID",
      async () => {
        const response = await makeAuthenticatedRequest(
          `http://localhost:3000/api/admin/products/${productA.id}`,
          {
            method: "GET",
          },
          userA.authToken,
        );

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.product).toBeDefined();
        expect(data.product.id).toBe(productA.id);
        expect(data.product.organization_id).toBe(orgA.id);
      },
    );

    it.skipIf(!infrastructureAvailable)("should update a product", async () => {
      const response = await makeAuthenticatedRequest(
        `http://localhost:3000/api/admin/products/${productA.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Updated Product",
            price: 12000,
          }),
        },
        userA.authToken,
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.product.name).toBe("Updated Product");
      expect(data.product.price).toBe(12000);
    });

    it.skipIf(!infrastructureAvailable)(
      "should list products with pagination",
      async () => {
        const response = await makeAuthenticatedRequest(
          "http://localhost:3000/api/admin/products?page=1&limit=10",
          {
            method: "GET",
          },
          userA.authToken,
        );

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.products).toBeDefined();
        expect(Array.isArray(data.products)).toBe(true);
        expect(data.pagination).toBeDefined();
      },
    );

    it.skipIf(!infrastructureAvailable)("should search products", async () => {
      const response = await makeAuthenticatedRequest(
        `http://localhost:3000/api/admin/products?search=${productA.name}`,
        {
          method: "GET",
        },
        userA.authToken,
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.products).toBeDefined();
      // Should find productA
      const found = data.products.find((p: any) => p.id === productA.id);
      expect(found).toBeDefined();
    });

    it.skipIf(!infrastructureAvailable)(
      "should filter products by status",
      async () => {
        const response = await makeAuthenticatedRequest(
          "http://localhost:3000/api/admin/products?status=active",
          {
            method: "GET",
          },
          userA.authToken,
        );

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.products).toBeDefined();
        // All returned products should be active
        data.products.forEach((p: any) => {
          expect(p.status).toBe("active");
        });
      },
    );
  });

  describe("Validation", () => {
    it.skipIf(!infrastructureAvailable)(
      "should reject invalid product data",
      async () => {
        const response = await makeAuthenticatedRequest(
          "http://localhost:3000/api/admin/products",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              // Missing required fields (name and price)
              name: "",
            }),
          },
          userA.authToken,
        );

        expect(response.status).toBe(400);
      },
    );

    it.skipIf(!infrastructureAvailable)(
      "should reject product without name",
      async () => {
        const response = await makeAuthenticatedRequest(
          "http://localhost:3000/api/admin/products",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              price: 10000,
              branch_id: branchA.id,
            }),
          },
          userA.authToken,
        );

        expect(response.status).toBe(400);
      },
    );

    it.skipIf(!infrastructureAvailable)(
      "should reject product without price",
      async () => {
        const response = await makeAuthenticatedRequest(
          "http://localhost:3000/api/admin/products",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: "Test Product",
              branch_id: branchA.id,
            }),
          },
          userA.authToken,
        );

        expect(response.status).toBe(400);
      },
    );

    it.skipIf(!infrastructureAvailable)(
      "should reject negative price",
      async () => {
        const response = await makeAuthenticatedRequest(
          "http://localhost:3000/api/admin/products",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: "Test Product",
              price: -1000,
              branch_id: branchA.id,
            }),
          },
          userA.authToken,
        );

        expect(response.status).toBe(400);
      },
    );
  });
});
