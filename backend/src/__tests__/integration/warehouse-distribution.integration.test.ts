import request from "supertest";
import express from "express";
import dashboardRoutes from "../../routes/dashboard";

describe("Warehouse Distribution Integration Tests", () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use("/api/dashboard", dashboardRoutes);
  });

  describe("GET /api/dashboard/warehouse-distribution", () => {
    it("should return warehouse distribution data", async () => {
      const response = await request(app)
        .get("/api/dashboard/warehouse-distribution")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("warehouses");
      expect(Array.isArray(response.body.data.warehouses)).toBe(true);

      // Each warehouse should have the expected structure
      if (response.body.data.warehouses.length > 0) {
        const warehouse = response.body.data.warehouses[0];
        expect(warehouse).toHaveProperty("warehouse_id");
        expect(warehouse).toHaveProperty("warehouse_name");
        expect(warehouse).toHaveProperty("products");
        expect(warehouse).toHaveProperty("total_products");
        expect(warehouse).toHaveProperty("total_value");
        expect(Array.isArray(warehouse.products)).toBe(true);

        // Each product should have the expected structure
        if (warehouse.products.length > 0) {
          const product = warehouse.products[0];
          expect(product).toHaveProperty("product_id");
          expect(product).toHaveProperty("sku");
          expect(product).toHaveProperty("name");
          expect(product).toHaveProperty("quantity");
          expect(product).toHaveProperty("unit_cost");
          expect(product).toHaveProperty("total_value");
        }
      }
    });

    it("should filter by warehouse_id when provided", async () => {
      const response = await request(app)
        .get("/api/dashboard/warehouse-distribution?warehouse_id=1")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("warehouses");

      // Should only return data for warehouse_id 1 (if it exists)
      response.body.data.warehouses.forEach((warehouse: any) => {
        expect(warehouse.warehouse_id).toBe(1);
      });
    });

    it("should filter by category when provided", async () => {
      const response = await request(app)
        .get("/api/dashboard/warehouse-distribution?category=Electronics")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("warehouses");
    });

    it("should return 400 for invalid warehouse_id", async () => {
      const response = await request(app)
        .get("/api/dashboard/warehouse-distribution?warehouse_id=invalid")
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid warehouse_id parameter");
    });

    it("should return 400 for invalid product_id", async () => {
      const response = await request(app)
        .get("/api/dashboard/warehouse-distribution?product_id=invalid")
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid product_id parameter");
    });

    it("should return 400 for invalid min_value", async () => {
      const response = await request(app)
        .get("/api/dashboard/warehouse-distribution?min_value=invalid")
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid min_value parameter");
    });

    it("should handle multiple filters", async () => {
      const response = await request(app)
        .get(
          "/api/dashboard/warehouse-distribution?warehouse_id=1&category=Electronics&min_value=100"
        )
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("warehouses");
    });

    it("should return empty warehouses array when no data matches filters", async () => {
      const response = await request(app)
        .get("/api/dashboard/warehouse-distribution?warehouse_id=999")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.warehouses).toEqual([]);
    });
  });
});
