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

describe("Stock Levels API Integration Tests", () => {
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

  describe("GET /api/dashboard/stock-levels", () => {
    it("should return stock levels with correct structure", async () => {
      const response = await ApiTestHelpers.getStockLevels();
      expect(response.status).toBe(200);
      ValidationHelpers.validateStockLevelsResponse(response);

      // Validate detailed product structure
      if (response.body.data.products.length > 0) {
        const product = response.body.data.products[0];
        expect(product.image_url).toBeDefined();
        expect(product.unit_cost).toBeGreaterThanOrEqual(0);
        expect(product.total_value).toBeGreaterThanOrEqual(0);

        // Check location structure if locations exist
        if (product.locations.length > 0) {
          const location = product.locations[0];
          expect(location.location_id).toBeDefined();
          expect(location.location_name).toBeDefined();
          expect(location.quantity).toBeGreaterThanOrEqual(0);
          expect(location.unit_cost).toBeGreaterThanOrEqual(0);
        }
      }
    }, 10000);

    it("should return stock levels with warehouse filter", async () => {
      const response = await ApiTestHelpers.getStockLevels({ warehouseId: 1 });
      expect(response.status).toBe(200);
      ValidationHelpers.validateStockLevelsResponse(response);
      expect(response.body.data.filters.warehouse_id).toBe(1);

      // Verify that all products have inventory in the specified warehouse
      if (response.body.data.products.length > 0) {
        response.body.data.products.forEach((product: any) => {
          const hasWarehouseInventory = product.locations.some(
            (loc: any) => loc.location_id === 1
          );
          expect(hasWarehouseInventory).toBe(true);
        });
      }
    }, 10000);

    it("should return stock levels with low stock filter", async () => {
      const response = await ApiTestHelpers.getStockLevels({
        stockFilter: "low_stock",
      });
      expect(response.status).toBe(200);
      ValidationHelpers.validateStockLevelsResponse(response);
      expect(response.body.data.filters.stock_filter).toBe("low_stock");

      // All returned products should have low stock
      if (response.body.data.products.length > 0) {
        response.body.data.products.forEach((product: any) => {
          expect(product.low_stock).toBe(true);
        });
      }
    }, 10000);

    it("should return stock levels with out of stock filter", async () => {
      const response = await ApiTestHelpers.getStockLevels({
        stockFilter: "out_of_stock",
      });
      expect(response.status).toBe(200);
      ValidationHelpers.validateStockLevelsResponse(response);
      expect(response.body.data.filters.stock_filter).toBe("out_of_stock");

      // All returned products should be out of stock
      if (response.body.data.products.length > 0) {
        response.body.data.products.forEach((product: any) => {
          expect(product.out_of_stock).toBe(true);
          expect(product.total_quantity).toBe(0);
        });
      }
    }, 10000);

    it("should return stock levels with search filter", async () => {
      const searchTerm = "test";
      const response = await ApiTestHelpers.getStockLevels({
        search: searchTerm,
      });
      expect(response.status).toBe(200);
      ValidationHelpers.validateStockLevelsResponse(response);

      // Verify search results contain the search term
      if (response.body.data.products.length > 0) {
        response.body.data.products.forEach((product: any) => {
          const matchesSearch =
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.category.toLowerCase().includes(searchTerm.toLowerCase());
          expect(matchesSearch).toBe(true);
        });
      }
    }, 10000);

    it("should return stock levels with category filter", async () => {
      const category = "Electronics";
      const response = await ApiTestHelpers.getStockLevels({ category });
      expect(response.status).toBe(200);
      ValidationHelpers.validateStockLevelsResponse(response);

      // All returned products should be in the specified category
      if (response.body.data.products.length > 0) {
        response.body.data.products.forEach((product: any) => {
          expect(product.category).toBe(category);
        });
      }
    }, 10000);

    it("should return stock levels with pagination", async () => {
      const page = 1;
      const limit = 5;
      const response = await ApiTestHelpers.getStockLevels({ page, limit });
      expect(response.status).toBe(200);
      ValidationHelpers.validateStockLevelsResponse(response);

      expect(response.body.data.pagination.page).toBe(page);
      expect(response.body.data.pagination.limit).toBe(limit);
      expect(response.body.data.products.length).toBeLessThanOrEqual(limit);
      expect(response.body.data.pagination.total).toBeGreaterThanOrEqual(0);
    }, 10000);

    it("should return stock levels with combined filters", async () => {
      const response = await ApiTestHelpers.getStockLevels({
        warehouseId: 1,
        stockFilter: "all",
        search: "product",
        page: 1,
        limit: 10,
      });
      expect(response.status).toBe(200);
      ValidationHelpers.validateStockLevelsResponse(response);

      expect(response.body.data.filters.warehouse_id).toBe(1);
      expect(response.body.data.filters.stock_filter).toBe("all");
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
    }, 10000);

    it("should return empty results for non-matching search", async () => {
      const response = await ApiTestHelpers.getStockLevels({
        search: "nonexistentproduct12345",
      });
      expect(response.status).toBe(200);
      ValidationHelpers.validateStockLevelsResponse(response);
      expect(response.body.data.products.length).toBe(0);
    }, 10000);

    it("should return 400 for invalid warehouse_id", async () => {
      const response = await ApiTestHelpers.makeRequest(
        "GET",
        "/api/dashboard/stock-levels?warehouse_id=invalid"
      );
      ValidationHelpers.validateErrorResponse(response, 400);
    });

    it("should return 400 for invalid stock_filter", async () => {
      const response = await ApiTestHelpers.getStockLevels({
        stockFilter: "invalid",
      });
      ValidationHelpers.validateErrorResponse(response, 400);
    });

    it("should return 400 for invalid pagination parameters", async () => {
      const response = await ApiTestHelpers.getStockLevels({ page: 0 });
      ValidationHelpers.validateErrorResponse(response, 400);
    });

    it("should return 400 for negative page number", async () => {
      const response = await ApiTestHelpers.getStockLevels({ page: -1 });
      ValidationHelpers.validateErrorResponse(response, 400);
    });

    it("should return 400 for limit exceeding maximum", async () => {
      const response = await ApiTestHelpers.getStockLevels({ limit: 101 });
      ValidationHelpers.validateErrorResponse(response, 400);
    });

    it("should return 400 for zero limit", async () => {
      const response = await ApiTestHelpers.getStockLevels({ limit: 0 });
      ValidationHelpers.validateErrorResponse(response, 400);
    });

    it("should respond within performance threshold", async () => {
      const { duration } = await PerformanceHelpers.measureResponseTime(() =>
        ApiTestHelpers.getStockLevels()
      );
      PerformanceHelpers.validateResponseTime(duration, 1000); // 1 second threshold
    }, 10000);

    it("should handle concurrent requests efficiently", async () => {
      const responses = await PerformanceHelpers.runConcurrentRequests(
        () => ApiTestHelpers.getStockLevels({ limit: 10 }),
        5
      );

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        ValidationHelpers.validateStockLevelsResponse(response);
      });
    }, 15000);

    it("should maintain consistent pagination across requests", async () => {
      const page1Response = await ApiTestHelpers.getStockLevels({
        page: 1,
        limit: 5,
      });
      const page2Response = await ApiTestHelpers.getStockLevels({
        page: 2,
        limit: 5,
      });

      expect(page1Response.status).toBe(200);
      expect(page2Response.status).toBe(200);

      // Ensure no overlap between pages (if there are enough products)
      if (
        page1Response.body.data.products.length === 5 &&
        page2Response.body.data.products.length > 0
      ) {
        const page1Ids = page1Response.body.data.products.map((p: any) => p.id);
        const page2Ids = page2Response.body.data.products.map((p: any) => p.id);

        const overlap = page1Ids.filter((id: number) => page2Ids.includes(id));
        expect(overlap.length).toBe(0);
      }
    }, 10000);

    it("should return consistent total count across paginated requests", async () => {
      const page1Response = await ApiTestHelpers.getStockLevels({
        page: 1,
        limit: 10,
      });
      const page2Response = await ApiTestHelpers.getStockLevels({
        page: 2,
        limit: 10,
      });

      expect(page1Response.status).toBe(200);
      expect(page2Response.status).toBe(200);

      // Total count should be the same across pages
      expect(page1Response.body.data.pagination.total).toBe(
        page2Response.body.data.pagination.total
      );
    }, 10000);
  });
});
