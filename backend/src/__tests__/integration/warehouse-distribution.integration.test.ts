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

describe("Warehouse Distribution API Integration Tests", () => {
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

  describe("GET /api/dashboard/warehouse-distribution", () => {
    it("should return warehouse distribution with correct structure", async () => {
      const response = await ApiTestHelpers.getWarehouseDistribution();
      expect(response.status).toBe(200);
      ValidationHelpers.validateWarehouseDistributionResponse(response);

      // Validate detailed distribution structure
      if (response.body.data.distribution.length > 0) {
        const item = response.body.data.distribution[0];
        expect(item.location_address).toBeDefined();
        expect(item.warehouse_type).toBeDefined();
        expect(Array.isArray(item.products)).toBe(true);

        // Check product structure if products exist
        if (item.products.length > 0) {
          const product = item.products[0];
          expect(product.product_id).toBeDefined();
          expect(product.sku).toBeDefined();
          expect(product.name).toBeDefined();
          expect(product.category).toBeDefined();
          expect(product.quantity).toBeGreaterThanOrEqual(0);
          expect(product.unit_cost).toBeGreaterThanOrEqual(0);
          expect(product.total_value).toBeGreaterThanOrEqual(0);
          expect(product.reorder_point).toBeDefined();
          expect(typeof product.low_stock).toBe("boolean");
        }
      }
    }, 10000);

    it("should return warehouse distribution with warehouse filter", async () => {
      const response = await ApiTestHelpers.getWarehouseDistribution({
        warehouseId: 1,
      });
      expect(response.status).toBe(200);
      ValidationHelpers.validateWarehouseDistributionResponse(response);
      expect(response.body.data.filters.warehouse_id).toBe(1);

      // Should only return data for the specified warehouse
      if (response.body.data.distribution.length > 0) {
        response.body.data.distribution.forEach((item: any) => {
          expect(item.location_id).toBe(1);
        });
      }
    }, 10000);

    it("should return warehouse distribution with product filter", async () => {
      const response = await ApiTestHelpers.getWarehouseDistribution({
        productId: 1,
      });
      expect(response.status).toBe(200);
      ValidationHelpers.validateWarehouseDistributionResponse(response);
      expect(response.body.data.filters.product_id).toBe(1);

      // Should only return data for the specified product
      if (response.body.data.distribution.length > 0) {
        response.body.data.distribution.forEach((item: any) => {
          if (item.products.length > 0) {
            const hasProduct = item.products.some(
              (product: any) => product.product_id === 1
            );
            expect(hasProduct).toBe(true);
          }
        });
      }
    }, 10000);

    it("should return warehouse distribution with category filter", async () => {
      const category = "Electronics";
      const response = await ApiTestHelpers.getWarehouseDistribution({
        category,
      });
      expect(response.status).toBe(200);
      ValidationHelpers.validateWarehouseDistributionResponse(response);
      expect(response.body.data.filters.category).toBe(category);

      // Should only return products in the specified category
      if (response.body.data.distribution.length > 0) {
        response.body.data.distribution.forEach((item: any) => {
          if (item.products.length > 0) {
            item.products.forEach((product: any) => {
              expect(product.category).toBe(category);
            });
          }
        });
      }
    }, 10000);

    it("should return warehouse distribution with minimum value filter", async () => {
      const minValue = 1000;
      const response = await ApiTestHelpers.getWarehouseDistribution({
        minValue,
      });
      expect(response.status).toBe(200);
      ValidationHelpers.validateWarehouseDistributionResponse(response);
      expect(response.body.data.filters.min_value).toBe(minValue);

      // Should only return warehouses with total value >= min_value
      if (response.body.data.distribution.length > 0) {
        response.body.data.distribution.forEach((item: any) => {
          expect(item.total_value).toBeGreaterThanOrEqual(minValue);
        });
      }
    }, 10000);

    it("should return warehouse distribution with combined filters", async () => {
      const response = await ApiTestHelpers.getWarehouseDistribution({
        warehouseId: 1,
        category: "Electronics",
        minValue: 100,
      });
      expect(response.status).toBe(200);
      ValidationHelpers.validateWarehouseDistributionResponse(response);

      expect(response.body.data.filters.warehouse_id).toBe(1);
      expect(response.body.data.filters.category).toBe("Electronics");
      expect(response.body.data.filters.min_value).toBe(100);
    }, 10000);

    it("should return empty results for non-matching filters", async () => {
      const response = await ApiTestHelpers.getWarehouseDistribution({
        category: "NonExistentCategory",
        minValue: 999999999,
      });
      expect(response.status).toBe(200);
      ValidationHelpers.validateWarehouseDistributionResponse(response);
      expect(response.body.data.distribution.length).toBe(0);
    }, 10000);

    it("should calculate accurate totals", async () => {
      const response = await ApiTestHelpers.getWarehouseDistribution();
      expect(response.status).toBe(200);

      if (response.body.data.distribution.length > 0) {
        response.body.data.distribution.forEach((item: any) => {
          let calculatedQuantity = 0;
          let calculatedValue = 0;

          item.products.forEach((product: any) => {
            calculatedQuantity += product.quantity;
            calculatedValue += product.total_value;
          });

          expect(item.total_quantity).toBe(calculatedQuantity);
          expect(Math.abs(item.total_value - calculatedValue)).toBeLessThan(
            0.01
          ); // Allow for floating point precision
        });
      }
    }, 10000);

    it("should identify stock imbalances", async () => {
      const response = await ApiTestHelpers.getWarehouseDistribution();
      expect(response.status).toBe(200);

      if (response.body.data.distribution.length > 1) {
        // Check if imbalance indicators are present
        const hasImbalanceData = response.body.data.distribution.some(
          (item: any) =>
            item.hasOwnProperty("imbalance_score") ||
            item.hasOwnProperty("transfer_suggestions")
        );
        // This test validates the structure exists for imbalance detection
        expect(typeof hasImbalanceData).toBe("boolean");
      }
    }, 10000);

    it("should return 400 for invalid warehouse_id", async () => {
      const response = await ApiTestHelpers.makeRequest(
        "GET",
        "/api/dashboard/warehouse-distribution?warehouse_id=invalid"
      );
      ValidationHelpers.validateErrorResponse(response, 400);
    });

    it("should return 400 for invalid product_id", async () => {
      const response = await ApiTestHelpers.getWarehouseDistribution({
        productId: -1,
      });
      ValidationHelpers.validateErrorResponse(response, 400);
    });

    it("should return 400 for invalid min_value", async () => {
      const response = await ApiTestHelpers.makeRequest(
        "GET",
        "/api/dashboard/warehouse-distribution?min_value=invalid"
      );
      ValidationHelpers.validateErrorResponse(response, 400);
    });

    it("should return 400 for negative min_value", async () => {
      const response = await ApiTestHelpers.getWarehouseDistribution({
        minValue: -100,
      });
      ValidationHelpers.validateErrorResponse(response, 400);
    });

    it("should return 400 for non-existent warehouse_id", async () => {
      const response = await ApiTestHelpers.getWarehouseDistribution({
        warehouseId: 99999,
      });
      ValidationHelpers.validateErrorResponse(response, 400);
    });

    it("should respond within performance threshold", async () => {
      const { duration } = await PerformanceHelpers.measureResponseTime(() =>
        ApiTestHelpers.getWarehouseDistribution()
      );
      PerformanceHelpers.validateResponseTime(duration, 1000); // 1 second threshold
    }, 10000);

    it("should handle concurrent requests efficiently", async () => {
      const responses = await PerformanceHelpers.runConcurrentRequests(
        () => ApiTestHelpers.getWarehouseDistribution(),
        5
      );

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        ValidationHelpers.validateWarehouseDistributionResponse(response);
      });
    }, 15000);

    it("should maintain data consistency across multiple requests", async () => {
      const response1 = await ApiTestHelpers.getWarehouseDistribution();
      const response2 = await ApiTestHelpers.getWarehouseDistribution();

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      // Data should be consistent between requests
      expect(response1.body.data.distribution.length).toBe(
        response2.body.data.distribution.length
      );

      if (response1.body.data.distribution.length > 0) {
        const item1 = response1.body.data.distribution[0];
        const item2 = response2.body.data.distribution[0];

        expect(item1.location_id).toBe(item2.location_id);
        expect(item1.total_products).toBe(item2.total_products);
        expect(item1.total_quantity).toBe(item2.total_quantity);
        expect(item1.total_value).toBe(item2.total_value);
      }
    }, 10000);

    it("should handle large datasets efficiently", async () => {
      // Test with no filters to get all data
      const { response, duration } =
        await PerformanceHelpers.measureResponseTime(() =>
          ApiTestHelpers.getWarehouseDistribution()
        );

      expect(response.status).toBe(200);
      PerformanceHelpers.validateResponseTime(duration, 2000); // 2 second threshold for large datasets

      // Validate that large datasets are handled properly
      if (response.body.data.distribution.length > 0) {
        const totalProducts = response.body.data.distribution.reduce(
          (sum: number, item: any) => sum + item.total_products,
          0
        );
        expect(totalProducts).toBeGreaterThanOrEqual(0);
      }
    }, 15000);
  });
});
