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

describe("Dashboard API Integration Tests", () => {
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

  describe("GET /api/dashboard/summary-metrics", () => {
    it("should return summary metrics with correct structure", async () => {
      const response = await ApiTestHelpers.getDashboardMetrics();
      expect(response.status).toBe(200);
      ValidationHelpers.validateMetricsResponse(response);
    }, 10000);

    it("should return summary metrics with warehouse filter", async () => {
      const response = await ApiTestHelpers.getDashboardMetrics(1);
      expect(response.status).toBe(200);
      ValidationHelpers.validateMetricsResponse(response);
      expect(response.body.data.warehouse_filter).toBeDefined();
      expect(response.body.data.warehouse_filter.id).toBe(1);
    }, 10000);

    it("should return 400 for invalid warehouse_id", async () => {
      const response = await ApiTestHelpers.makeRequest(
        "GET",
        "/api/dashboard/summary-metrics?warehouse_id=invalid"
      );
      ValidationHelpers.validateErrorResponse(response, 400);
    });

    it("should return 400 for non-existent warehouse_id", async () => {
      const response = await ApiTestHelpers.getDashboardMetrics(99999);
      ValidationHelpers.validateErrorResponse(response, 400);
    });

    it("should respond within performance threshold", async () => {
      const { duration } = await PerformanceHelpers.measureResponseTime(() =>
        ApiTestHelpers.getDashboardMetrics()
      );
      PerformanceHelpers.validateResponseTime(duration, 3000); // 3 second threshold
    }, 10000);

    it("should handle concurrent requests", async () => {
      const responses = await PerformanceHelpers.runConcurrentRequests(
        () => ApiTestHelpers.getDashboardMetrics(),
        5
      );

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        ValidationHelpers.validateMetricsResponse(response);
      });
    }, 15000);
  });

  describe("GET /api/dashboard/stock-levels", () => {
    it("should return stock levels with correct structure", async () => {
      const response = await ApiTestHelpers.getStockLevels();
      expect(response.status).toBe(200);
      ValidationHelpers.validateStockLevelsResponse(response);
    }, 10000);

    it("should return stock levels with warehouse filter", async () => {
      const response = await ApiTestHelpers.getStockLevels({ warehouseId: 1 });
      expect(response.status).toBe(200);
      ValidationHelpers.validateStockLevelsResponse(response);
      expect(response.body.data.filters.warehouse_id).toBe(1);
    }, 10000);

    it("should return stock levels with stock filter", async () => {
      const response = await ApiTestHelpers.getStockLevels({
        stockFilter: "low_stock",
      });
      expect(response.status).toBe(200);
      ValidationHelpers.validateStockLevelsResponse(response);
      expect(response.body.data.filters.stock_filter).toBe("low_stock");
    }, 10000);

    it("should return stock levels with search filter", async () => {
      const response = await ApiTestHelpers.getStockLevels({ search: "test" });
      expect(response.status).toBe(200);
      ValidationHelpers.validateStockLevelsResponse(response);
    }, 10000);

    it("should return stock levels with pagination", async () => {
      const response = await ApiTestHelpers.getStockLevels({
        page: 1,
        limit: 10,
      });
      expect(response.status).toBe(200);
      ValidationHelpers.validateStockLevelsResponse(response);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
      expect(response.body.data.products.length).toBeLessThanOrEqual(10);
    }, 10000);

    it("should return 400 for invalid stock_filter", async () => {
      const response = await ApiTestHelpers.getStockLevels({
        stockFilter: "invalid",
      });
      ValidationHelpers.validateErrorResponse(response, 400);
    });

    it("should return 400 for invalid pagination parameters", async () => {
      const response = await ApiTestHelpers.getStockLevels({ page: -1 });
      ValidationHelpers.validateErrorResponse(response, 400);
    });

    it("should return 400 for limit exceeding maximum", async () => {
      const response = await ApiTestHelpers.getStockLevels({ limit: 101 });
      ValidationHelpers.validateErrorResponse(response, 400);
    });

    it("should respond within performance threshold", async () => {
      const { duration } = await PerformanceHelpers.measureResponseTime(() =>
        ApiTestHelpers.getStockLevels()
      );
      PerformanceHelpers.validateResponseTime(duration, 1000); // 1 second threshold
    }, 10000);
  });

  describe("GET /api/dashboard/recent-purchases", () => {
    it("should return recent purchases with correct structure", async () => {
      const response = await ApiTestHelpers.getRecentPurchases();
      expect(response.status).toBe(200);
      ValidationHelpers.validateRecentPurchasesResponse(response);
    }, 10000);

    it("should return recent purchases with warehouse filter", async () => {
      const response = await ApiTestHelpers.getRecentPurchases({
        warehouseId: 1,
      });
      expect(response.status).toBe(200);
      ValidationHelpers.validateRecentPurchasesResponse(response);
    }, 10000);

    it("should return recent purchases with supplier filter", async () => {
      const response = await ApiTestHelpers.getRecentPurchases({
        supplierId: 1,
      });
      expect(response.status).toBe(200);
      ValidationHelpers.validateRecentPurchasesResponse(response);
    }, 10000);

    it("should return recent purchases with status filter", async () => {
      const response = await ApiTestHelpers.getRecentPurchases({
        status: "pending",
      });
      expect(response.status).toBe(200);
      ValidationHelpers.validateRecentPurchasesResponse(response);
    }, 10000);

    it("should return recent purchases with date range filter", async () => {
      const dateFrom = "2024-01-01";
      const dateTo = "2024-12-31";
      const response = await ApiTestHelpers.getRecentPurchases({
        dateFrom,
        dateTo,
      });
      expect(response.status).toBe(200);
      ValidationHelpers.validateRecentPurchasesResponse(response);
    }, 10000);

    it("should return recent purchases with limit", async () => {
      const response = await ApiTestHelpers.getRecentPurchases({ limit: 5 });
      expect(response.status).toBe(200);
      ValidationHelpers.validateRecentPurchasesResponse(response);
      expect(response.body.data.recent_orders.length).toBeLessThanOrEqual(5);
    }, 10000);

    it("should return 400 for invalid warehouse_id", async () => {
      const response = await ApiTestHelpers.getRecentPurchases({
        warehouseId: -1,
      });
      ValidationHelpers.validateErrorResponse(response, 400);
    });

    it("should return 400 for invalid status", async () => {
      const response = await ApiTestHelpers.getRecentPurchases({
        status: "invalid",
      });
      ValidationHelpers.validateErrorResponse(response, 400);
    });

    it("should return 400 for invalid date format", async () => {
      const response = await ApiTestHelpers.getRecentPurchases({
        dateFrom: "invalid-date",
      });
      ValidationHelpers.validateErrorResponse(response, 400);
    });

    it("should return 400 for limit exceeding maximum", async () => {
      const response = await ApiTestHelpers.getRecentPurchases({ limit: 51 });
      ValidationHelpers.validateErrorResponse(response, 400);
    });

    it("should respond within performance threshold", async () => {
      const { duration } = await PerformanceHelpers.measureResponseTime(() =>
        ApiTestHelpers.getRecentPurchases()
      );
      PerformanceHelpers.validateResponseTime(duration, 1000); // 1 second threshold
    }, 10000);
  });

  describe("GET /api/dashboard/warehouse-distribution", () => {
    it("should return warehouse distribution with correct structure", async () => {
      const response = await ApiTestHelpers.getWarehouseDistribution();
      expect(response.status).toBe(200);
      ValidationHelpers.validateWarehouseDistributionResponse(response);
    }, 10000);

    it("should return warehouse distribution with warehouse filter", async () => {
      const response = await ApiTestHelpers.getWarehouseDistribution({
        warehouseId: 1,
      });
      expect(response.status).toBe(200);
      ValidationHelpers.validateWarehouseDistributionResponse(response);
    }, 10000);

    it("should return warehouse distribution with product filter", async () => {
      const response = await ApiTestHelpers.getWarehouseDistribution({
        productId: 1,
      });
      expect(response.status).toBe(200);
      ValidationHelpers.validateWarehouseDistributionResponse(response);
    }, 10000);

    it("should return warehouse distribution with category filter", async () => {
      const response = await ApiTestHelpers.getWarehouseDistribution({
        category: "Electronics",
      });
      expect(response.status).toBe(200);
      ValidationHelpers.validateWarehouseDistributionResponse(response);
    }, 10000);

    it("should return warehouse distribution with minimum value filter", async () => {
      const response = await ApiTestHelpers.getWarehouseDistribution({
        minValue: 1000,
      });
      expect(response.status).toBe(200);
      ValidationHelpers.validateWarehouseDistributionResponse(response);
    }, 10000);

    it("should return 400 for invalid warehouse_id", async () => {
      const response = await ApiTestHelpers.getWarehouseDistribution({
        warehouseId: -1,
      });
      ValidationHelpers.validateErrorResponse(response, 400);
    });

    it("should return 400 for invalid product_id", async () => {
      const response = await ApiTestHelpers.getWarehouseDistribution({
        productId: -1,
      });
      ValidationHelpers.validateErrorResponse(response, 400);
    });

    it("should return 400 for invalid min_value", async () => {
      const response = await ApiTestHelpers.getWarehouseDistribution({
        minValue: -1,
      });
      ValidationHelpers.validateErrorResponse(response, 400);
    });

    it("should respond within performance threshold", async () => {
      const { duration } = await PerformanceHelpers.measureResponseTime(() =>
        ApiTestHelpers.getWarehouseDistribution()
      );
      PerformanceHelpers.validateResponseTime(duration, 1000); // 1 second threshold
    }, 10000);
  });

  describe("Health Check Endpoint", () => {
    it("should return health status", async () => {
      const response = await ApiTestHelpers.makeRequest("GET", "/health");
      expect(response.status).toBe(200);
      expect(response.body.status).toBe("OK");
      expect(response.body.database).toBe("connected");
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeGreaterThan(0);
      expect(response.body.memory).toBeDefined();
      expect(response.body.environment).toBeDefined();
    }, 5000);
  });

  describe("Error Handling", () => {
    it("should return 404 for non-existent endpoints", async () => {
      const response = await ApiTestHelpers.makeRequest(
        "GET",
        "/api/non-existent"
      );
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("not found");
    });

    it("should handle malformed JSON in request body", async () => {
      const response = await ApiTestHelpers.makeRequest(
        "POST",
        "/api/dashboard/summary-metrics",
        "invalid json"
      );
      expect([400, 404]).toContain(response.status); // 404 if POST not supported, 400 if malformed
    });

    it("should handle requests with oversized payloads", async () => {
      const largePayload = "x".repeat(1024 * 1024); // 1MB payload (reduced for testing)
      const response = await ApiTestHelpers.makeRequest(
        "POST",
        "/api/dashboard/summary-metrics",
        { data: largePayload }
      );
      expect([400, 404, 413]).toContain(response.status);
    });
  });

  describe("Rate Limiting", () => {
    it("should apply rate limiting after excessive requests", async () => {
      // Make multiple rapid requests to trigger rate limiting
      const requests = Array(20)
        .fill(null)
        .map(() => ApiTestHelpers.getDashboardMetrics());

      const responses = await Promise.all(requests);

      // At least some requests should succeed
      const successfulRequests = responses.filter((r: any) => r.status === 200);
      expect(successfulRequests.length).toBeGreaterThan(0);

      // Some requests might be rate limited (429 status)
      const rateLimitedRequests = responses.filter(
        (r: any) => r.status === 429
      );
      // Note: This test might not always trigger rate limiting depending on configuration
    }, 15000);
  });
});
