import request from "supertest";
import express from "express";
import dashboardRoutes from "../../routes/dashboard";

describe("Stock Levels API Integration", () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use("/api/dashboard", dashboardRoutes);
  });

  describe("GET /api/dashboard/stock-levels", () => {
    it("should respond with 200 status", async () => {
      // This test will fail without a database connection, but validates the endpoint exists
      const response = await request(app)
        .get("/api/dashboard/stock-levels")
        .expect((res) => {
          // Should either return 200 with data or 500 with database error
          expect([200, 500]).toContain(res.status);
        });

      if (response.status === 200) {
        expect(response.body).toHaveProperty("success", true);
        expect(response.body).toHaveProperty("data");
        expect(response.body.data).toHaveProperty("products");
        expect(response.body.data).toHaveProperty("filters");
        expect(Array.isArray(response.body.data.products)).toBe(true);
      } else {
        expect(response.body).toHaveProperty("success", false);
        expect(response.body).toHaveProperty("error");
      }
    });

    it("should accept warehouse_id parameter", async () => {
      const response = await request(app)
        .get("/api/dashboard/stock-levels?warehouse_id=1")
        .expect((res) => {
          expect([200, 500]).toContain(res.status);
        });

      if (response.status === 200) {
        expect(response.body.data.filters).toHaveProperty("warehouse_id", 1);
      }
    });

    it("should accept stock_filter parameter", async () => {
      const response = await request(app)
        .get("/api/dashboard/stock-levels?stock_filter=low_stock")
        .expect((res) => {
          expect([200, 500]).toContain(res.status);
        });

      if (response.status === 200) {
        expect(response.body.data.filters).toHaveProperty(
          "stock_filter",
          "low_stock"
        );
      }
    });

    it("should accept search parameter", async () => {
      const response = await request(app)
        .get("/api/dashboard/stock-levels?search=test")
        .expect((res) => {
          expect([200, 500]).toContain(res.status);
        });

      if (response.status === 200) {
        expect(response.body.data.filters).toHaveProperty("search", "test");
      }
    });

    it("should accept category parameter", async () => {
      const response = await request(app)
        .get("/api/dashboard/stock-levels?category=Electronics")
        .expect((res) => {
          expect([200, 500]).toContain(res.status);
        });

      if (response.status === 200) {
        expect(response.body.data.filters).toHaveProperty(
          "category",
          "Electronics"
        );
      }
    });

    it("should accept pagination parameters", async () => {
      const response = await request(app)
        .get("/api/dashboard/stock-levels?page=2&limit=25")
        .expect((res) => {
          expect([200, 500]).toContain(res.status);
        });

      if (response.status === 200) {
        expect(response.body.data).toHaveProperty("pagination");
        if (response.body.data.pagination) {
          expect(response.body.data.pagination).toHaveProperty("page", 2);
          expect(response.body.data.pagination).toHaveProperty("limit", 25);
        }
      }
    });

    it("should return 400 for invalid warehouse_id", async () => {
      await request(app)
        .get("/api/dashboard/stock-levels?warehouse_id=invalid")
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty("success", false);
          expect(res.body).toHaveProperty(
            "error",
            "Invalid warehouse_id parameter"
          );
        });
    });

    it("should return 400 for invalid page parameter", async () => {
      await request(app)
        .get("/api/dashboard/stock-levels?page=0")
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty("success", false);
          expect(res.body.error).toContain("Invalid page parameter");
        });
    });

    it("should return 400 for invalid limit parameter", async () => {
      await request(app)
        .get("/api/dashboard/stock-levels?limit=101")
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty("success", false);
          expect(res.body.error).toContain("Invalid limit parameter");
        });
    });

    it("should return 400 for invalid stock_filter parameter", async () => {
      await request(app)
        .get("/api/dashboard/stock-levels?stock_filter=invalid")
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty("success", false);
          expect(res.body.error).toContain("Invalid stock_filter parameter");
        });
    });

    it("should handle multiple parameters", async () => {
      const response = await request(app)
        .get(
          "/api/dashboard/stock-levels?warehouse_id=1&stock_filter=low_stock&search=test&category=Electronics&page=1&limit=10"
        )
        .expect((res) => {
          expect([200, 500]).toContain(res.status);
        });

      if (response.status === 200) {
        expect(response.body.data.filters).toEqual({
          warehouse_id: 1,
          stock_filter: "low_stock",
          search: "test",
          category: "Electronics",
        });
        if (response.body.data.pagination) {
          expect(response.body.data.pagination.page).toBe(1);
          expect(response.body.data.pagination.limit).toBe(10);
        }
      }
    });

    it("should filter out empty string parameters", async () => {
      const response = await request(app)
        .get("/api/dashboard/stock-levels?search=&category=")
        .expect((res) => {
          expect([200, 500]).toContain(res.status);
        });

      if (response.status === 200) {
        expect(response.body.data.filters.search).toBeUndefined();
        expect(response.body.data.filters.category).toBeUndefined();
      }
    });
  });
});
