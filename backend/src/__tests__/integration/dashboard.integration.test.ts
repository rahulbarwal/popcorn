import request from "supertest";
import app from "../../server";

describe("Dashboard API Integration", () => {
  describe("GET /api/dashboard/summary-metrics", () => {
    it("should return summary metrics", async () => {
      const response = await request(app)
        .get("/api/dashboard/summary-metrics")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.metrics).toBeDefined();
      expect(response.body.data.last_updated).toBeDefined();

      // Check that all required metrics are present
      const metrics = response.body.data.metrics;
      expect(metrics.total_products).toBeDefined();
      expect(metrics.low_stock).toBeDefined();
      expect(metrics.out_of_stock).toBeDefined();
      expect(metrics.suppliers).toBeDefined();
      expect(metrics.total_stock_value).toBeDefined();

      // Check metric structure
      expect(metrics.total_products.value).toBeGreaterThanOrEqual(0);
      expect(metrics.total_products.status).toMatch(
        /^(normal|warning|critical)$/
      );

      expect(metrics.low_stock.value).toBeGreaterThanOrEqual(0);
      expect(metrics.low_stock.status).toMatch(/^(normal|warning|critical)$/);
      expect(metrics.low_stock.threshold).toBeDefined();

      expect(metrics.out_of_stock.value).toBeGreaterThanOrEqual(0);
      expect(metrics.out_of_stock.status).toMatch(
        /^(normal|warning|critical)$/
      );

      expect(metrics.suppliers.value).toBeGreaterThanOrEqual(0);
      expect(metrics.suppliers.status).toMatch(/^(normal|warning|critical)$/);

      expect(metrics.total_stock_value.value).toBeGreaterThanOrEqual(0);
      expect(metrics.total_stock_value.currency).toBe("USD");
      expect(metrics.total_stock_value.status).toMatch(
        /^(normal|warning|critical)$/
      );
    }, 10000); // 10 second timeout for database operations

    it("should return summary metrics with warehouse filter", async () => {
      const response = await request(app)
        .get("/api/dashboard/summary-metrics?warehouse_id=1")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.warehouse_filter).toBeDefined();
      expect(response.body.data.warehouse_filter.id).toBe(1);
    }, 10000);

    it("should return 400 for invalid warehouse_id", async () => {
      const response = await request(app)
        .get("/api/dashboard/summary-metrics?warehouse_id=invalid")
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid warehouse_id parameter");
    });
  });
});
