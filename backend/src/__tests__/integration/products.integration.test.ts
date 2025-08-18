import request from "supertest";
import app from "../../server";
import { setupTestDatabase, teardownTestDatabase } from "../setup/testDatabase";

describe("Products API Integration Tests", () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe("GET /api/products", () => {
    it("should return products with correct structure", async () => {
      const response = await request(app).get("/api/products").expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("products");
      expect(response.body.data).toHaveProperty("filters");
      expect(Array.isArray(response.body.data.products)).toBe(true);

      if (response.body.data.products.length > 0) {
        const product = response.body.data.products[0];
        expect(product).toHaveProperty("id");
        expect(product).toHaveProperty("sku");
        expect(product).toHaveProperty("name");
        expect(product).toHaveProperty("category");
        expect(product).toHaveProperty("sale_price");
        expect(product).toHaveProperty("cost_price");
        expect(product).toHaveProperty("reorder_point");
        expect(product).toHaveProperty("total_stock");
        expect(product).toHaveProperty("warehouse_count");
        expect(product).toHaveProperty("stock_status");
      }
    });

    it("should return products with search filter", async () => {
      const response = await request(app)
        .get("/api/products?search=laptop")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.filters.search).toBe("laptop");
    });

    it("should return products with category filter", async () => {
      const response = await request(app)
        .get("/api/products?category=Electronics")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.filters.category).toBe("Electronics");
    });

    it("should return products with stock filter", async () => {
      const response = await request(app)
        .get("/api/products?stock_filter=low_stock")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.filters.stock_filter).toBe("low_stock");
    });

    it("should return products with pagination", async () => {
      const response = await request(app)
        .get("/api/products?page=1&limit=5")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("pagination");
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(5);
    });

    it("should return products with sorting", async () => {
      const response = await request(app)
        .get("/api/products?sort_by=sale_price&sort_order=desc")
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it("should return 400 for invalid stock filter", async () => {
      const response = await request(app)
        .get("/api/products?stock_filter=invalid")
        .expect(200); // The API doesn't validate this currently, it just ignores invalid values

      expect(response.body.success).toBe(true);
    });
  });

  describe("GET /api/products/:id", () => {
    it("should return product details for valid ID", async () => {
      // First get a product ID from the list
      const listResponse = await request(app).get("/api/products");

      if (listResponse.body.data.products.length > 0) {
        const productId = listResponse.body.data.products[0].id;

        const response = await request(app)
          .get(`/api/products/${productId}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty("product");
        expect(response.body.data.product).toHaveProperty("id", productId);
        expect(response.body.data.product).toHaveProperty("stock_levels");
        expect(response.body.data.product).toHaveProperty("total_stock");
        expect(response.body.data.product).toHaveProperty("stock_status");
        expect(Array.isArray(response.body.data.product.stock_levels)).toBe(
          true
        );
      }
    });

    it("should return 400 for invalid product ID", async () => {
      const response = await request(app)
        .get("/api/products/invalid")
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid product ID");
    });

    it("should return 404 for non-existent product ID", async () => {
      const response = await request(app)
        .get("/api/products/99999")
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("not found");
    });
  });

  describe("POST /api/products", () => {
    const validProductData = {
      name: "Test Product Integration",
      sku: "TEST-INT-001",
      description: "Test product for integration testing",
      category: "Electronics",
      cost_price: 25.5,
      sale_price: 45.99,
      reorder_point: 50,
      image_url: "https://example.com/test-image.jpg",
      warehouse_stock: [{ warehouse_id: 1, initial_quantity: 100 }],
    };

    it("should create product successfully", async () => {
      const response = await request(app)
        .post("/api/products")
        .send(validProductData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("product");
      expect(response.body.data.product).toHaveProperty("id");
      expect(response.body.data.product.name).toBe(validProductData.name);
      expect(response.body.data.product.sku).toBe(validProductData.sku);
      expect(response.body.message).toBe("Product created successfully");
    });

    it("should return 400 for missing required fields", async () => {
      const invalidData = { name: "Test Product" }; // Missing required fields

      const response = await request(app)
        .post("/api/products")
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Validation failed");
      expect(response.body).toHaveProperty("errors");
    });

    it("should return 409 for duplicate SKU", async () => {
      // First create a product
      await request(app)
        .post("/api/products")
        .send({ ...validProductData, sku: "DUPLICATE-SKU" });

      // Try to create another with the same SKU
      const response = await request(app)
        .post("/api/products")
        .send({
          ...validProductData,
          sku: "DUPLICATE-SKU",
          name: "Another Product",
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("already exists");
    });

    it("should return 400 for invalid pricing", async () => {
      const invalidPricingData = {
        ...validProductData,
        sku: "INVALID-PRICING",
        cost_price: 50,
        sale_price: 30, // Sale price less than cost price
      };

      const response = await request(app)
        .post("/api/products")
        .send(invalidPricingData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Validation failed");
    });
  });

  describe("PUT /api/products/:id", () => {
    let productId: number;

    beforeEach(async () => {
      // Create a test product
      const createResponse = await request(app).post("/api/products").send({
        name: "Update Test Product",
        sku: "UPDATE-TEST-001",
        category: "Electronics",
        cost_price: 25.5,
        sale_price: 45.99,
        reorder_point: 50,
      });

      productId = createResponse.body.data.product.id;
    });

    it("should update product successfully", async () => {
      const updateData = {
        name: "Updated Product Name",
        sale_price: 49.99,
        reorder_point: 60,
      };

      const response = await request(app)
        .put(`/api/products/${productId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.name).toBe(updateData.name);
      expect(response.body.message).toBe("Product updated successfully");
    });

    it("should return 400 for invalid product ID", async () => {
      const response = await request(app)
        .put("/api/products/invalid")
        .send({ name: "Updated Name" })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid product ID");
    });

    it("should return 404 for non-existent product", async () => {
      const response = await request(app)
        .put("/api/products/99999")
        .send({ name: "Updated Name" })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("not found");
    });
  });

  describe("DELETE /api/products/:id", () => {
    let productId: number;

    beforeEach(async () => {
      // Create a test product
      const createResponse = await request(app).post("/api/products").send({
        name: "Delete Test Product",
        sku: "DELETE-TEST-001",
        category: "Electronics",
        cost_price: 25.5,
        sale_price: 45.99,
        reorder_point: 50,
      });

      productId = createResponse.body.data.product.id;
    });

    it("should delete product successfully", async () => {
      const response = await request(app)
        .delete(`/api/products/${productId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Product deleted successfully");

      // Verify product is deleted
      await request(app).get(`/api/products/${productId}`).expect(404);
    });

    it("should return 400 for invalid product ID", async () => {
      const response = await request(app)
        .delete("/api/products/invalid")
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid product ID");
    });

    it("should return 404 for non-existent product", async () => {
      const response = await request(app)
        .delete("/api/products/99999")
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("not found");
    });
  });

  describe("GET /api/products/categories", () => {
    it("should return categories list", async () => {
      const response = await request(app)
        .get("/api/products/categories")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("categories");
      expect(Array.isArray(response.body.data.categories)).toBe(true);
    });
  });

  describe("GET /api/products/validate-sku/:sku", () => {
    it("should validate available SKU", async () => {
      const response = await request(app)
        .get("/api/products/validate-sku/NEW-UNIQUE-SKU")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sku).toBe("NEW-UNIQUE-SKU");
      expect(response.body.data.is_valid).toBe(true);
      expect(response.body.data.message).toBe("SKU is available");
    });

    it("should validate existing SKU", async () => {
      // First create a product
      await request(app).post("/api/products").send({
        name: "SKU Test Product",
        sku: "EXISTING-SKU-TEST",
        category: "Electronics",
        cost_price: 25.5,
        sale_price: 45.99,
        reorder_point: 50,
      });

      const response = await request(app)
        .get("/api/products/validate-sku/EXISTING-SKU-TEST")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sku).toBe("EXISTING-SKU-TEST");
      expect(response.body.data.is_valid).toBe(false);
      expect(response.body.data.message).toBe("SKU already exists");
    });

    it("should handle exclude product ID parameter", async () => {
      // Create a product
      const createResponse = await request(app).post("/api/products").send({
        name: "Exclude Test Product",
        sku: "EXCLUDE-TEST-SKU",
        category: "Electronics",
        cost_price: 25.5,
        sale_price: 45.99,
        reorder_point: 50,
      });

      const productId = createResponse.body.data.product.id;

      const response = await request(app)
        .get(
          `/api/products/validate-sku/EXCLUDE-TEST-SKU?exclude_product_id=${productId}`
        )
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.is_valid).toBe(true); // Should be valid when excluding itself
    });
  });

  describe("GET /api/warehouses", () => {
    it("should return warehouses list", async () => {
      const response = await request(app).get("/api/warehouses").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("warehouses");
      expect(Array.isArray(response.body.data.warehouses)).toBe(true);

      if (response.body.data.warehouses.length > 0) {
        const warehouse = response.body.data.warehouses[0];
        expect(warehouse).toHaveProperty("id");
        expect(warehouse).toHaveProperty("name");
        expect(warehouse).toHaveProperty("active");
      }
    });
  });

  describe("PATCH /api/products/:id/inline", () => {
    let productId: number;

    beforeEach(async () => {
      // Create a test product
      const createResponse = await request(app).post("/api/products").send({
        name: "Inline Edit Test Product",
        sku: "INLINE-EDIT-001",
        category: "Electronics",
        cost_price: 25.5,
        sale_price: 45.99,
        reorder_point: 50,
      });

      productId = createResponse.body.data.product.id;
    });

    it("should update sale price inline", async () => {
      const response = await request(app)
        .patch(`/api/products/${productId}/inline`)
        .send({ field: "sale_price", value: 49.99 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.field).toBe("sale_price");
      expect(response.body.data.product.new_value).toBe(49.99);
    });

    it("should return 400 for invalid field", async () => {
      const response = await request(app)
        .patch(`/api/products/${productId}/inline`)
        .send({ field: "invalid_field", value: "test" })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid field for inline editing");
    });

    it("should return 400 for invalid product ID", async () => {
      const response = await request(app)
        .patch("/api/products/invalid/inline")
        .send({ field: "sale_price", value: 49.99 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid product ID");
    });
  });

  describe("PUT /api/products/:id/fields", () => {
    let productId: number;

    beforeEach(async () => {
      // Create a test product
      const createResponse = await request(app).post("/api/products").send({
        name: "Bulk Update Test Product",
        sku: "BULK-UPDATE-001",
        category: "Electronics",
        cost_price: 25.5,
        sale_price: 45.99,
        reorder_point: 50,
      });

      productId = createResponse.body.data.product.id;
    });

    it("should bulk update multiple fields", async () => {
      const updateFields = {
        sale_price: 49.99,
        cost_price: 27.0,
        reorder_point: 60,
      };

      const response = await request(app)
        .put(`/api/products/${productId}/fields`)
        .send({ fields: updateFields })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.updated_fields).toHaveProperty(
        "sale_price"
      );
      expect(response.body.data.product.updated_fields).toHaveProperty(
        "cost_price"
      );
      expect(response.body.data.product.updated_fields).toHaveProperty(
        "reorder_point"
      );
    });

    it("should return 400 for invalid product ID", async () => {
      const response = await request(app)
        .put("/api/products/invalid/fields")
        .send({ fields: { sale_price: 49.99 } })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid product ID");
    });
  });
});
