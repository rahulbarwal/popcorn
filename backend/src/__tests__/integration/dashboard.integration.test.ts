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

  describe("GET /api/dashboard/recent-purchases", () => {
    it("should return recent purchases", async () => {
      const response = await request(app)
        .get("/api/dashboard/recent-purchases")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.recent_orders).toBeDefined();
      expect(Array.isArray(response.body.data.recent_orders)).toBe(true);

      // If there are orders, check their structure
      if (response.body.data.recent_orders.length > 0) {
        const order = response.body.data.recent_orders[0];
        expect(order.id).toBeDefined();
        expect(order.po_number).toBeDefined();
        expect(order.supplier).toBeDefined();
        expect(order.supplier.id).toBeDefined();
        expect(order.supplier.name).toBeDefined();
        expect(order.order_date).toBeDefined();
        expect(order.status).toMatch(
          /^(pending|confirmed|shipped|delivered|cancelled)$/
        );
        expect(order.product_count).toBeGreaterThanOrEqual(0);
        expect(parseFloat(order.total_amount)).toBeGreaterThanOrEqual(0);
        expect(typeof order.is_overdue).toBe("boolean");
      }
    }, 10000);

    it("should return recent purchases with warehouse filter", async () => {
      const response = await request(app)
        .get("/api/dashboard/recent-purchases?warehouse_id=1")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data.recent_orders)).toBe(true);
    }, 10000);

    it("should return recent purchases with limit", async () => {
      const response = await request(app)
        .get("/api/dashboard/recent-purchases?limit=5")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recent_orders.length).toBeLessThanOrEqual(5);
    }, 10000);

    it("should return 400 for invalid warehouse_id", async () => {
      const response = await request(app)
        .get("/api/dashboard/recent-purchases?warehouse_id=invalid")
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid warehouse_id parameter");
    });

    it("should return 400 for invalid limit", async () => {
      const response = await request(app)
        .get("/api/dashboard/recent-purchases?limit=51")
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe(
        "Invalid limit parameter. Must be between 1 and 50."
      );
    });

    it("should return 400 for invalid status", async () => {
      const response = await request(app)
        .get("/api/dashboard/recent-purchases?status=invalid")
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe(
        "Invalid status parameter. Must be 'pending', 'confirmed', 'shipped', 'delivered', or 'cancelled'."
      );
    });
  });
});
