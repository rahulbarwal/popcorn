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

describe("Stock Visualization API Integration Tests", () => {
  beforeAll(async () => {
    await setupTestDatabase();
  }, 30000);

  afterAll(async () => {
    await teardownTestDatabase();
  }, 30000);

  beforeEach(async () => {
    await resetTestData();
  }, 15000);

  describe("GET /api/dashboard/stock-visualization", () => {
    it("should return stock visualization data for all warehouses", async () => {
      const response = await ApiTestHelpers.makeRequest(
        "GET",
        "/api/dashboard/stock-visualization"
      );
      expect(response.status).toBe(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          chart_data: {
            products: expect.any(Array),
            chart_config: {
              title: "Stock by Product per Warehouse",
              x_axis_label: "Products",
              y_axis_label: "Stock Quantity",
              color_palette: expect.any(Array),
            },
          },
          filters: {
            warehouse_id: undefined,
            warehouse_name: "All Warehouses",
          },
          last_updated: expect.any(String),
        },
      });

      // Verify chart data structure
      const chartData = response.body.data.chart_data;
      expect(chartData.products.length).toBeGreaterThanOrEqual(0);

      // Check product structure if products exist
      if (chartData.products.length > 0) {
        const firstProduct = chartData.products[0];
        expect(firstProduct).toMatchObject({
          product_id: expect.any(Number),
          product_name: expect.any(String),
          sku: expect.any(String),
          warehouses: expect.any(Array),
        });

        // Check warehouse structure within product
        if (firstProduct.warehouses.length > 0) {
          const firstWarehouse = firstProduct.warehouses[0];
          expect(firstWarehouse).toMatchObject({
            warehouse_id: expect.any(Number),
            warehouse_name: expect.any(String),
            quantity: expect.any(Number),
            color: expect.any(String),
          });
        }
      }

      // Verify color palette
      expect(chartData.chart_config.color_palette).toHaveLength(10);
      expect(chartData.chart_config.color_palette[0]).toMatch(
        /^#[0-9A-F]{6}$/i
      );
    }, 10000);

    it("should return stock visualization data filtered by warehouse", async () => {
      const warehouseId = 1;

      const response = await ApiTestHelpers.makeRequest(
        "GET",
        `/api/dashboard/stock-visualization?warehouse_id=${warehouseId}`
      );
      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.filters).toMatchObject({
        warehouse_id: warehouseId,
        warehouse_name: expect.any(String),
      });

      // Verify that all products only show data for the specified warehouse
      const products = response.body.data.chart_data.products;
      for (const product of products) {
        for (const warehouse of product.warehouses) {
          expect(warehouse.warehouse_id).toBe(warehouseId);
        }
      }
    }, 10000);

    it("should return empty data when no stock exists for warehouse", async () => {
      // Use a warehouse ID that doesn't exist or has no stock
      const nonExistentWarehouseId = 99999;

      const response = await ApiTestHelpers.makeRequest(
        "GET",
        `/api/dashboard/stock-visualization?warehouse_id=${nonExistentWarehouseId}`
      );
      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.chart_data.products).toEqual([]);
      expect(response.body.data.filters.warehouse_name).toBe(
        "Unknown Warehouse"
      );
    }, 10000);

    it("should validate warehouse_id parameter", async () => {
      const response = await ApiTestHelpers.makeRequest(
        "GET",
        "/api/dashboard/stock-visualization?warehouse_id=invalid"
      );
      ValidationHelpers.validateErrorResponse(response, 400);
    });

    it("should handle negative warehouse_id", async () => {
      const response = await ApiTestHelpers.makeRequest(
        "GET",
        "/api/dashboard/stock-visualization?warehouse_id=-1"
      );
      ValidationHelpers.validateErrorResponse(response, 400);
    });

    it("should return consistent colors for the same warehouse across products", async () => {
      const response = await ApiTestHelpers.makeRequest(
        "GET",
        "/api/dashboard/stock-visualization"
      );
      expect(response.status).toBe(200);

      const products = response.body.data.chart_data.products;

      if (products.length >= 2) {
        // Find a warehouse that appears in multiple products
        const warehouseColorMap = new Map();

        for (const product of products) {
          for (const warehouse of product.warehouses) {
            const existingColor = warehouseColorMap.get(warehouse.warehouse_id);
            if (existingColor) {
              // Same warehouse should have the same color across products
              expect(warehouse.color).toBe(existingColor);
            } else {
              warehouseColorMap.set(warehouse.warehouse_id, warehouse.color);
            }
          }
        }
      }
    }, 10000);

    it("should sort products alphabetically by name", async () => {
      const response = await ApiTestHelpers.makeRequest(
        "GET",
        "/api/dashboard/stock-visualization"
      );
      expect(response.status).toBe(200);

      const products = response.body.data.chart_data.products;

      if (products.length >= 2) {
        for (let i = 1; i < products.length; i++) {
          expect(
            products[i].product_name.localeCompare(products[i - 1].product_name)
          ).toBeGreaterThanOrEqual(0);
        }
      }
    }, 10000);

    it("should only include products with stock > 0", async () => {
      const response = await ApiTestHelpers.makeRequest(
        "GET",
        "/api/dashboard/stock-visualization"
      );
      expect(response.status).toBe(200);

      const products = response.body.data.chart_data.products;

      for (const product of products) {
        for (const warehouse of product.warehouses) {
          expect(warehouse.quantity).toBeGreaterThan(0);
        }
      }
    }, 10000);

    it("should respond within performance threshold", async () => {
      const { duration } = await PerformanceHelpers.measureResponseTime(() =>
        ApiTestHelpers.makeRequest("GET", "/api/dashboard/stock-visualization")
      );
      PerformanceHelpers.validateResponseTime(duration, 2000); // 2 second threshold
    }, 10000);

    it("should handle concurrent requests properly", async () => {
      // Make multiple concurrent requests
      const requests = Array.from({ length: 5 }, () =>
        ApiTestHelpers.makeRequest("GET", "/api/dashboard/stock-visualization")
      );

      const responses = await Promise.all(requests);

      // All requests should succeed
      for (const response of responses) {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      }

      // All responses should have the same structure
      const firstResponseData = responses[0].body.data;
      for (let i = 1; i < responses.length; i++) {
        expect(responses[i].body.data.chart_data.chart_config).toEqual(
          firstResponseData.chart_data.chart_config
        );
        expect(responses[i].body.data.filters).toEqual(
          firstResponseData.filters
        );
      }
    }, 15000);
  });

  describe("Performance Tests", () => {
    it("should handle large datasets efficiently", async () => {
      // This test assumes the test database has a reasonable amount of data
      const response = await ApiTestHelpers.makeRequest(
        "GET",
        "/api/dashboard/stock-visualization"
      );
      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);

      // Verify the response structure is maintained even with larger datasets
      const products = response.body.data.chart_data.products;
      expect(Array.isArray(products)).toBe(true);

      // Each product should have the correct structure
      for (const product of products) {
        expect(product).toMatchObject({
          product_id: expect.any(Number),
          product_name: expect.any(String),
          sku: expect.any(String),
          warehouses: expect.any(Array),
        });
      }
    }, 10000);
  });
});
