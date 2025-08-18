import {
  setupTestDatabase,
  teardownTestDatabase,
  resetTestData,
} from "../setup/testDatabase";
import {
  ApiTestHelpers,
  ValidationHelpers,
  PerformanceHelpers,
} from "../setup/testHelpers";

describe("Suppliers API Integration Tests", () => {
  // Setup and teardown
  beforeAll(async () => {
    await setupTestDatabase();
  }, 30000);

  afterAll(async () => {
    await teardownTestDatabase();
  }, 30000);

  beforeEach(async () => {
    await resetTestData();
  }, 15000);

  describe("GET /api/suppliers", () => {
    it("should return suppliers with correct structure", async () => {
      const response = await ApiTestHelpers.getSuppliers();
      expect(response.status).toBe(200);
      ValidationHelpers.validateSuppliersResponse(response);
    }, 10000);

    it("should return suppliers with search filter", async () => {
      const response = await ApiTestHelpers.getSuppliers({ search: "corp" });
      expect(response.status).toBe(200);
      ValidationHelpers.validateSuppliersResponse(response);

      // Verify search results contain the search term
      if (response.body.data.suppliers.length > 0) {
        response.body.data.suppliers.forEach((supplier: any) => {
          const matchesSearch =
            supplier.name.toLowerCase().includes("corp") ||
            supplier.contact_name.toLowerCase().includes("corp") ||
            supplier.email.toLowerCase().includes("corp");
          expect(matchesSearch).toBe(true);
        });
      }
    }, 10000);

    it("should return suppliers with limit", async () => {
      const limit = 5;
      const response = await ApiTestHelpers.getSuppliers({ limit });
      expect(response.status).toBe(200);
      ValidationHelpers.validateSuppliersResponse(response);
      expect(response.body.data.suppliers.length).toBeLessThanOrEqual(limit);
    }, 10000);

    it("should include inactive suppliers when requested", async () => {
      const response = await ApiTestHelpers.getSuppliers({
        includeInactive: true,
      });
      expect(response.status).toBe(200);
      ValidationHelpers.validateSuppliersResponse(response);
    }, 10000);

    it("should return 400 for invalid limit", async () => {
      const response = await ApiTestHelpers.getSuppliers({ limit: 101 });
      ValidationHelpers.validateErrorResponse(response, 400);
    });

    it("should respond within performance threshold", async () => {
      const { duration } = await PerformanceHelpers.measureResponseTime(() =>
        ApiTestHelpers.getSuppliers()
      );
      PerformanceHelpers.validateResponseTime(duration, 1000); // 1 second threshold
    }, 10000);
  });

  describe("GET /api/suppliers/:id", () => {
    it("should return supplier by ID with correct structure", async () => {
      const response = await ApiTestHelpers.getSupplierById(1);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.supplier).toBeDefined();

      const supplier = response.body.data.supplier;
      expect(supplier.id).toBe(1);
      expect(supplier.name).toBeDefined();
      expect(supplier.contact_name).toBeDefined();
      expect(supplier.email).toBeDefined();
      expect(supplier.phone).toBeDefined();
      expect(supplier.address).toBeDefined();
    }, 10000);

    it("should return 404 for non-existent supplier", async () => {
      const response = await ApiTestHelpers.getSupplierById(99999);
      ValidationHelpers.validateErrorResponse(response, 404);
    });

    it("should return 400 for invalid supplier ID", async () => {
      const response = await ApiTestHelpers.makeRequest(
        "GET",
        "/api/suppliers/invalid"
      );
      ValidationHelpers.validateErrorResponse(response, 400);
    });
  });

  describe("GET /api/suppliers/by-products", () => {
    it("should return suppliers for specific products", async () => {
      const productIds = [1, 2];
      const response = await ApiTestHelpers.getSuppliersForProducts(productIds);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.suppliers).toBeDefined();
      expect(Array.isArray(response.body.data.suppliers)).toBe(true);
      expect(response.body.data.product_ids).toEqual(productIds);

      // Validate supplier structure
      if (response.body.data.suppliers.length > 0) {
        const supplier = response.body.data.suppliers[0];
        expect(supplier.id).toBeDefined();
        expect(supplier.name).toBeDefined();
        expect(supplier.products).toBeDefined();
        expect(Array.isArray(supplier.products)).toBe(true);

        // Verify supplier has at least one of the requested products
        const hasRequestedProduct = supplier.products.some(
          (productId: number) => productIds.includes(productId)
        );
        expect(hasRequestedProduct).toBe(true);
      }
    }, 10000);

    it("should return 400 for missing product_ids parameter", async () => {
      const response = await ApiTestHelpers.makeRequest(
        "GET",
        "/api/suppliers/by-products"
      );
      ValidationHelpers.validateErrorResponse(response, 400);
    });

    it("should return 400 for invalid product_ids format", async () => {
      const response = await ApiTestHelpers.makeRequest(
        "GET",
        "/api/suppliers/by-products?product_ids=invalid"
      );
      ValidationHelpers.validateErrorResponse(response, 400);
    });

    it("should handle empty product list", async () => {
      const response = await ApiTestHelpers.getSuppliersForProducts([]);
      expect(response.status).toBe(200);
      expect(response.body.data.suppliers).toEqual([]);
    }, 10000);
  });

  describe("GET /api/suppliers/performance-rankings", () => {
    it("should return supplier performance rankings", async () => {
      const response = await ApiTestHelpers.makeRequest(
        "GET",
        "/api/suppliers/performance-rankings"
      );
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.suppliers).toBeDefined();
      expect(Array.isArray(response.body.data.suppliers)).toBe(true);

      // Validate performance ranking structure
      if (response.body.data.suppliers.length > 0) {
        const supplier = response.body.data.suppliers[0];
        expect(supplier.id).toBeDefined();
        expect(supplier.name).toBeDefined();
        expect(supplier.performance_score).toBeDefined();
        expect(supplier.performance_score).toBeGreaterThanOrEqual(0);
        expect(supplier.performance_score).toBeLessThanOrEqual(1);
        expect(supplier.total_orders).toBeDefined();
        expect(supplier.on_time_deliveries).toBeDefined();
        expect(supplier.average_delivery_days).toBeDefined();
      }
    }, 10000);

    it("should return limited number of suppliers when limit is specified", async () => {
      const limit = 3;
      const response = await ApiTestHelpers.makeRequest(
        "GET",
        `/api/suppliers/performance-rankings?limit=${limit}`
      );
      expect(response.status).toBe(200);
      expect(response.body.data.suppliers.length).toBeLessThanOrEqual(limit);
    }, 10000);

    it("should return 400 for invalid limit", async () => {
      const response = await ApiTestHelpers.makeRequest(
        "GET",
        "/api/suppliers/performance-rankings?limit=51"
      );
      ValidationHelpers.validateErrorResponse(response, 400);
    });
  });

  describe("GET /api/suppliers/recent-activity", () => {
    it("should return suppliers with recent activity", async () => {
      const response = await ApiTestHelpers.makeRequest(
        "GET",
        "/api/suppliers/recent-activity"
      );
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.suppliers).toBeDefined();
      expect(Array.isArray(response.body.data.suppliers)).toBe(true);

      // Validate recent activity structure
      if (response.body.data.suppliers.length > 0) {
        const supplier = response.body.data.suppliers[0];
        expect(supplier.id).toBeDefined();
        expect(supplier.name).toBeDefined();
        expect(supplier.last_order_date).toBeDefined();
        expect(supplier.recent_order_count).toBeDefined();
        expect(supplier.recent_order_count).toBeGreaterThan(0);
      }
    }, 10000);

    it("should return suppliers with activity in specified days", async () => {
      const days = 60;
      const response = await ApiTestHelpers.makeRequest(
        "GET",
        `/api/suppliers/recent-activity?days=${days}`
      );
      expect(response.status).toBe(200);
      expect(response.body.data.filters.days).toBe(days);
    }, 10000);

    it("should return 400 for invalid days parameter", async () => {
      const response = await ApiTestHelpers.makeRequest(
        "GET",
        "/api/suppliers/recent-activity?days=366"
      );
      ValidationHelpers.validateErrorResponse(response, 400);
    });
  });

  describe("GET /api/suppliers/:id/performance", () => {
    it("should return supplier performance metrics", async () => {
      const response = await ApiTestHelpers.makeRequest(
        "GET",
        "/api/suppliers/1/performance"
      );
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.supplier).toBeDefined();

      const supplier = response.body.data.supplier;
      expect(supplier.id).toBe(1);
      expect(supplier.performance_metrics).toBeDefined();
      expect(supplier.performance_metrics.total_orders).toBeDefined();
      expect(supplier.performance_metrics.on_time_deliveries).toBeDefined();
      expect(supplier.performance_metrics.average_delivery_days).toBeDefined();
      expect(supplier.performance_metrics.performance_score).toBeDefined();
      expect(supplier.recent_orders).toBeDefined();
      expect(Array.isArray(supplier.recent_orders)).toBe(true);
    }, 10000);

    it("should return 404 for non-existent supplier", async () => {
      const response = await ApiTestHelpers.makeRequest(
        "GET",
        "/api/suppliers/99999/performance"
      );
      ValidationHelpers.validateErrorResponse(response, 404);
    });
  });

  describe("GET /api/suppliers/:id/orders", () => {
    it("should return supplier order history", async () => {
      const response = await ApiTestHelpers.makeRequest(
        "GET",
        "/api/suppliers/1/orders"
      );
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.orders).toBeDefined();
      expect(Array.isArray(response.body.data.orders)).toBe(true);
      expect(response.body.data.pagination).toBeDefined();

      // Validate order structure
      if (response.body.data.orders.length > 0) {
        const order = response.body.data.orders[0];
        expect(order.id).toBeDefined();
        expect(order.po_number).toBeDefined();
        expect(order.order_date).toBeDefined();
        expect(order.status).toBeDefined();
        expect(order.total_amount).toBeDefined();
        expect(order.product_count).toBeDefined();
      }
    }, 10000);

    it("should return supplier order history with pagination", async () => {
      const page = 1;
      const limit = 5;
      const response = await ApiTestHelpers.makeRequest(
        "GET",
        `/api/suppliers/1/orders?page=${page}&limit=${limit}`
      );
      expect(response.status).toBe(200);
      expect(response.body.data.pagination.page).toBe(page);
      expect(response.body.data.pagination.limit).toBe(limit);
      expect(response.body.data.orders.length).toBeLessThanOrEqual(limit);
    }, 10000);

    it("should return 404 for non-existent supplier", async () => {
      const response = await ApiTestHelpers.makeRequest(
        "GET",
        "/api/suppliers/99999/orders"
      );
      ValidationHelpers.validateErrorResponse(response, 404);
    });

    it("should return 400 for invalid pagination parameters", async () => {
      const response = await ApiTestHelpers.makeRequest(
        "GET",
        "/api/suppliers/1/orders?page=0"
      );
      ValidationHelpers.validateErrorResponse(response, 400);
    });
  });

  describe("Concurrent Requests", () => {
    it("should handle concurrent supplier requests efficiently", async () => {
      const responses = await PerformanceHelpers.runConcurrentRequests(
        () => ApiTestHelpers.getSuppliers({ limit: 10 }),
        5
      );

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        ValidationHelpers.validateSuppliersResponse(response);
      });
    }, 15000);

    it("should handle concurrent supplier detail requests", async () => {
      const responses = await PerformanceHelpers.runConcurrentRequests(
        () => ApiTestHelpers.getSupplierById(1),
        3
      );

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.data.supplier.id).toBe(1);
      });
    }, 15000);
  });

  describe("Performance Tests", () => {
    it("should respond to supplier list within performance threshold", async () => {
      const { duration } = await PerformanceHelpers.measureResponseTime(() =>
        ApiTestHelpers.getSuppliers()
      );
      PerformanceHelpers.validateResponseTime(duration, 1000); // 1 second threshold
    }, 10000);

    it("should respond to supplier details within performance threshold", async () => {
      const { duration } = await PerformanceHelpers.measureResponseTime(() =>
        ApiTestHelpers.getSupplierById(1)
      );
      PerformanceHelpers.validateResponseTime(duration, 500); // 500ms threshold
    }, 10000);

    it("should respond to supplier performance within performance threshold", async () => {
      const { duration } = await PerformanceHelpers.measureResponseTime(() =>
        ApiTestHelpers.makeRequest("GET", "/api/suppliers/1/performance")
      );
      PerformanceHelpers.validateResponseTime(duration, 1000); // 1 second threshold
    }, 10000);
  });
});
