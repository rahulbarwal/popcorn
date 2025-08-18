import { ProductManagementService } from "../ProductManagementService";
import { ProductCreateRequest, ProductUpdateRequest } from "../../types";
import { it } from "node:test";
import { it } from "node:test";
import { it } from "node:test";
import { it } from "node:test";
import { it } from "node:test";
import { it } from "node:test";
import { beforeEach } from "node:test";
import { describe } from "node:test";
import { it } from "node:test";
import { beforeEach } from "node:test";
import { describe } from "node:test";
import { it } from "node:test";
import { it } from "node:test";
import { it } from "node:test";
import { describe } from "node:test";
import { it } from "node:test";
import { it } from "node:test";
import { it } from "node:test";
import { beforeEach } from "node:test";
import { describe } from "node:test";
import { it } from "node:test";
import { it } from "node:test";
import { it } from "node:test";
import { it } from "node:test";
import { beforeEach } from "node:test";
import { describe } from "node:test";
import { it } from "node:test";
import { it } from "node:test";
import { beforeEach } from "node:test";
import { describe } from "node:test";
import { it } from "node:test";
import { it } from "node:test";
import { it } from "node:test";
import { beforeEach } from "node:test";
import { describe } from "node:test";
import { it } from "node:test";
import { it } from "node:test";
import { it } from "node:test";
import { it } from "node:test";
import { it } from "node:test";
import { beforeEach } from "node:test";
import { describe } from "node:test";
import { beforeEach } from "node:test";
import { describe } from "node:test";

// Mock the database module
const mockTransaction = {
  insert: jest.fn().mockReturnValue({
    returning: jest.fn().mockResolvedValue([{ id: 1 }]),
  }),
  del: jest.fn().mockResolvedValue(1),
};

jest.mock("../../config/database", () => ({
  __esModule: true,
  default: {
    transaction: jest.fn((callback) => callback(mockTransaction)),
  },
}));

// Mock the repositories
const mockProductRepository = {
  skuExists: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  updateInlineField: jest.fn(),
  getCategories: jest.fn(),
  raw: jest.fn(),
};

const mockLocationRepository = {
  findById: jest.fn(),
  findAll: jest.fn(),
};

const mockProductLocationRepository = {};
const mockCompanyRepository = {};

jest.mock("../../repositories/ProductRepository", () => ({
  ProductRepository: jest.fn().mockImplementation(() => mockProductRepository),
}));

jest.mock("../../repositories/LocationRepository", () => ({
  LocationRepository: jest
    .fn()
    .mockImplementation(() => mockLocationRepository),
}));

jest.mock("../../repositories/ProductLocationRepository", () => ({
  ProductLocationRepository: jest
    .fn()
    .mockImplementation(() => mockProductLocationRepository),
}));

jest.mock("../../repositories/CompanyRepository", () => ({
  CompanyRepository: jest.fn().mockImplementation(() => mockCompanyRepository),
}));

describe("ProductManagementService", () => {
  let service: ProductManagementService;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create service instance
    service = new ProductManagementService();
  });

  describe("createProduct", () => {
    const mockProductData: ProductCreateRequest = {
      name: "Test Product",
      sku: "TEST-001",
      description: "Test product description",
      category: "Electronics",
      cost_price: 25.5,
      sale_price: 45.99,
      reorder_point: 50,
      image_url: "https://example.com/image.jpg",
      warehouse_stock: [
        { warehouse_id: 1, initial_quantity: 100 },
        { warehouse_id: 2, initial_quantity: 50 },
      ],
    };

    const mockWarehouses = [
      { id: 1, name: "Main Warehouse", active: true },
      { id: 2, name: "Secondary Warehouse", active: true },
    ];

    beforeEach(() => {
      mockProductRepository.skuExists.mockResolvedValue(false);
      mockLocationRepository.findById
        .mockResolvedValueOnce(mockWarehouses[0])
        .mockResolvedValueOnce(mockWarehouses[1]);
      mockProductRepository.raw.mockResolvedValue({ rows: [] });
    });

    it("should validate SKU uniqueness", async () => {
      mockProductRepository.skuExists.mockResolvedValue(true);

      await expect(service.createProduct(mockProductData)).rejects.toThrow(
        "SKU 'TEST-001' already exists"
      );

      expect(mockProductRepository.skuExists).toHaveBeenCalledWith("TEST-001");
    });

    it("should validate reorder point", async () => {
      const invalidData = { ...mockProductData, reorder_point: -1 };

      await expect(service.createProduct(invalidData)).rejects.toThrow(
        "Reorder point must be a non-negative number"
      );
    });

    it("should validate pricing", async () => {
      const invalidData = {
        ...mockProductData,
        sale_price: 20,
        cost_price: 25,
      };

      await expect(service.createProduct(invalidData)).rejects.toThrow(
        "Sale price must be greater than or equal to cost price"
      );
    });

    it("should validate warehouse existence", async () => {
      mockLocationRepository.findById.mockResolvedValue(null);

      await expect(service.createProduct(mockProductData)).rejects.toThrow(
        "Warehouse with ID 1 not found"
      );
    });

    it("should validate initial quantity", async () => {
      const invalidData = {
        ...mockProductData,
        warehouse_stock: [{ warehouse_id: 1, initial_quantity: -10 }],
      };

      await expect(service.createProduct(invalidData)).rejects.toThrow(
        "Initial quantity must be non-negative"
      );
    });
  });

  describe("getProducts", () => {
    const mockProducts = [
      {
        id: 1,
        sku: "TEST-001",
        name: "Test Product 1",
        category: "Electronics",
        sale_price: 45.99,
        cost_price: 25.5,
        reorder_point: 50,
        image_url: "https://example.com/image1.jpg",
        total_stock: 150,
        warehouse_count: 2,
        total_value: 3825,
      },
    ];

    beforeEach(() => {
      mockProductRepository.raw.mockResolvedValue({ rows: mockProducts });
    });

    it("should return products with stock information", async () => {
      const result = await service.getProducts();

      expect(result.products).toHaveLength(1);
      expect(result.products[0].id).toBe(1);
      expect(result.products[0].stock_status).toBe("adequate");
    });

    it("should apply search filter", async () => {
      const filters = { search: "Test Product 1" };
      await service.getProducts(filters);

      expect(mockProductRepository.raw).toHaveBeenCalledWith(
        expect.stringContaining("ILIKE"),
        expect.arrayContaining(["%Test Product 1%"])
      );
    });

    it("should apply category filter", async () => {
      const filters = { category: "Electronics" };
      await service.getProducts(filters);

      expect(mockProductRepository.raw).toHaveBeenCalledWith(
        expect.stringContaining("category = ?"),
        expect.arrayContaining(["Electronics"])
      );
    });
  });

  describe("getProductById", () => {
    const mockProduct = {
      id: 1,
      name: "Test Product",
      sku: "TEST-001",
      category: "Electronics",
      sale_price: 45.99,
      cost_price: 25.5,
      reorder_point: 50,
      image_url: "https://example.com/image.jpg",
      active: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const mockStockLevels = [
      {
        warehouse_id: 1,
        warehouse_name: "Main Warehouse",
        warehouse_address: "123 Main St",
        quantity: 100,
        unit_cost: 25.5,
        reorder_point: 50,
      },
    ];

    beforeEach(() => {
      mockProductRepository.findById.mockResolvedValue(mockProduct);
      mockProductRepository.raw.mockResolvedValue({ rows: mockStockLevels });
    });

    it("should return product with stock breakdown", async () => {
      const result = await service.getProductById(1);

      expect(result.product.id).toBe(1);
      expect(result.product.stock_levels).toHaveLength(1);
      expect(result.product.total_stock).toBe(100);
      expect(result.product.stock_status).toBe("adequate");
    });

    it("should throw error for non-existent product", async () => {
      mockProductRepository.findById.mockResolvedValue(null);

      await expect(service.getProductById(999)).rejects.toThrow(
        "Product with ID 999 not found"
      );
    });
  });

  describe("updateProduct", () => {
    const mockProduct = {
      id: 1,
      name: "Test Product",
      sku: "TEST-001",
      category: "Electronics",
      sale_price: 45.99,
      cost_price: 25.5,
      reorder_point: 50,
      active: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const updateData: ProductUpdateRequest = {
      name: "Updated Product",
      sale_price: 49.99,
      reorder_point: 60,
    };

    beforeEach(() => {
      mockProductRepository.findById.mockResolvedValue(mockProduct);
      mockProductRepository.update.mockResolvedValue({
        ...mockProduct,
        ...updateData,
      });
      mockProductRepository.raw.mockResolvedValue({ rows: [] });
    });

    it("should update product successfully", async () => {
      const result = await service.updateProduct(1, updateData);

      expect(mockProductRepository.update).toHaveBeenCalledWith(1, updateData);
      expect(result.product.name).toBe("Updated Product");
    });

    it("should throw error for non-existent product", async () => {
      mockProductRepository.findById.mockResolvedValue(null);

      await expect(service.updateProduct(999, updateData)).rejects.toThrow(
        "Product with ID 999 not found"
      );
    });

    it("should validate pricing constraints", async () => {
      const invalidUpdate = { sale_price: 20, cost_price: 30 };

      await expect(service.updateProduct(1, invalidUpdate)).rejects.toThrow(
        "Sale price must be greater than or equal to cost price"
      );
    });

    it("should validate reorder point", async () => {
      const invalidUpdate = { reorder_point: -5 };

      await expect(service.updateProduct(1, invalidUpdate)).rejects.toThrow(
        "Reorder point must be a non-negative number"
      );
    });
  });

  describe("deleteProduct", () => {
    const mockProduct = {
      id: 1,
      name: "Test Product",
      sku: "TEST-001",
      category: "Electronics",
      sale_price: 45.99,
      cost_price: 25.5,
      reorder_point: 50,
      active: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    beforeEach(() => {
      mockProductRepository.findById.mockResolvedValue(mockProduct);
      mockProductRepository.raw
        .mockResolvedValueOnce({ rows: [{ count: 0 }] }) // No active purchase orders
        .mockResolvedValueOnce({ rows: [] }); // No stock levels
    });

    it("should delete product successfully", async () => {
      await expect(service.deleteProduct(1)).resolves.not.toThrow();
    });

    it("should throw error for non-existent product", async () => {
      mockProductRepository.findById.mockResolvedValue(null);

      await expect(service.deleteProduct(999)).rejects.toThrow(
        "Product with ID 999 not found"
      );
    });

    it("should throw error for product with active purchase orders", async () => {
      mockProductRepository.raw.mockResolvedValueOnce({ rows: [{ count: 2 }] });

      await expect(service.deleteProduct(1)).rejects.toThrow(
        "Cannot delete product with active purchase orders"
      );
    });
  });

  describe("validateSku", () => {
    it("should return true for available SKU", async () => {
      mockProductRepository.skuExists.mockResolvedValue(false);

      const result = await service.validateSku("NEW-SKU");

      expect(result).toBe(true);
      expect(mockProductRepository.skuExists).toHaveBeenCalledWith(
        "NEW-SKU",
        undefined
      );
    });

    it("should return false for existing SKU", async () => {
      mockProductRepository.skuExists.mockResolvedValue(true);

      const result = await service.validateSku("EXISTING-SKU");

      expect(result).toBe(false);
    });

    it("should exclude specific product ID when validating", async () => {
      mockProductRepository.skuExists.mockResolvedValue(false);

      await service.validateSku("TEST-SKU", 1);

      expect(mockProductRepository.skuExists).toHaveBeenCalledWith(
        "TEST-SKU",
        1
      );
    });
  });

  describe("getCategories", () => {
    const mockCategories = ["Electronics", "Books", "Clothing"];

    beforeEach(() => {
      mockProductRepository.getCategories.mockResolvedValue(mockCategories);
    });

    it("should return all categories", async () => {
      const result = await service.getCategories();

      expect(result).toEqual(mockCategories);
      expect(mockProductRepository.getCategories).toHaveBeenCalled();
    });
  });

  describe("updateInlineField", () => {
    const mockProduct = {
      id: 1,
      name: "Test Product",
      sku: "TEST-001",
      category: "Electronics",
      sale_price: 45.99,
      cost_price: 25.5,
      reorder_point: 50,
      active: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    beforeEach(() => {
      mockProductRepository.findById.mockResolvedValue(mockProduct);
      mockProductRepository.updateInlineField.mockResolvedValue({
        ...mockProduct,
        sale_price: 49.99,
      });
    });

    it("should update sale price successfully", async () => {
      const result = await service.updateInlineField(1, "sale_price", 49.99);

      expect(result.sale_price).toBe(49.99);
      expect(mockProductRepository.updateInlineField).toHaveBeenCalledWith(
        1,
        "sale_price",
        49.99
      );
    });

    it("should throw error for invalid sale price", async () => {
      await expect(
        service.updateInlineField(1, "sale_price", 20)
      ).rejects.toThrow(
        "Sale price must be greater than or equal to cost price"
      );
    });

    it("should throw error for invalid cost price", async () => {
      await expect(
        service.updateInlineField(1, "cost_price", 50)
      ).rejects.toThrow("Cost price must be less than or equal to sale price");
    });

    it("should throw error for negative reorder point", async () => {
      await expect(
        service.updateInlineField(1, "reorder_point", -5)
      ).rejects.toThrow("Reorder point must be a non-negative number");
    });

    it("should throw error for empty category", async () => {
      await expect(
        service.updateInlineField(1, "category", "")
      ).rejects.toThrow("Category must be a non-empty string");
    });

    it("should throw error for non-existent product", async () => {
      mockProductRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateInlineField(999, "sale_price", 49.99)
      ).rejects.toThrow("Product with ID 999 not found");
    });
  });
});
