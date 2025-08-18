import { Request, Response } from "express";
import { ProductManagementController } from "../ProductManagementController";
import { ProductManagementService } from "../../services/ProductManagementService";
import { LocationRepository } from "../../repositories/LocationRepository";

// Mock the service and repository
jest.mock("../../services/ProductManagementService");
jest.mock("../../repositories/LocationRepository");

describe("ProductManagementController", () => {
  let controller: ProductManagementController;
  let mockService: jest.Mocked<ProductManagementService>;
  let mockLocationRepository: jest.Mocked<LocationRepository>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create controller instance
    controller = new ProductManagementController();

    // Get mocked service instance
    mockService =
      ProductManagementService.prototype as jest.Mocked<ProductManagementService>;
    mockLocationRepository =
      LocationRepository.prototype as jest.Mocked<LocationRepository>;

    // Setup mock request and response
    mockRequest = {
      query: {},
      params: {},
      body: {},
    };

    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  describe("getProducts", () => {
    const mockProductsResponse = {
      products: [
        {
          id: 1,
          sku: "TEST-001",
          name: "Test Product",
          category: "Electronics",
          sale_price: 45.99,
          cost_price: 25.5,
          reorder_point: 50,
          total_stock: 150,
          warehouse_count: 2,
          stock_status: "adequate" as const,
        },
      ],
      filters: {
        search: undefined,
        category: undefined,
        stock_filter: "all" as const,
      },
      pagination: {
        page: 1,
        limit: 50,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    };

    beforeEach(() => {
      mockService.getProducts = jest
        .fn()
        .mockResolvedValue(mockProductsResponse);
    });

    it("should return products successfully", async () => {
      await controller.getProducts(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.getProducts).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
        "name",
        "asc"
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockProductsResponse,
      });
    });

    it("should handle query parameters correctly", async () => {
      mockRequest.query = {
        search: "test",
        category: "Electronics",
        stock_filter: "low_stock",
        price_min: "10",
        price_max: "100",
        warehouse_id: "1",
        page: "2",
        limit: "25",
        sort_by: "sale_price",
        sort_order: "desc",
      };

      await controller.getProducts(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.getProducts).toHaveBeenCalledWith(
        {
          search: "test",
          category: "Electronics",
          stock_filter: "low_stock",
          price_min: 10,
          price_max: 100,
          warehouse_id: 1,
        },
        { page: 2, limit: 25 },
        "sale_price",
        "desc"
      );
    });

    it("should handle service errors", async () => {
      const error = new Error("Service error");
      mockService.getProducts = jest.fn().mockRejectedValue(error);

      await controller.getProducts(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: "Service error",
      });
    });
  });

  describe("getProductById", () => {
    const mockProductResponse = {
      product: {
        id: 1,
        sku: "TEST-001",
        name: "Test Product",
        category: "Electronics",
        sale_price: 45.99,
        cost_price: 25.5,
        reorder_point: 50,
        stock_levels: [],
        total_stock: 150,
        stock_status: "adequate" as const,
      },
    };

    beforeEach(() => {
      mockService.getProductById = jest
        .fn()
        .mockResolvedValue(mockProductResponse);
    });

    it("should return product by ID successfully", async () => {
      mockRequest.params = { id: "1" };

      await controller.getProductById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.getProductById).toHaveBeenCalledWith(1);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockProductResponse,
      });
    });

    it("should handle invalid product ID", async () => {
      mockRequest.params = { id: "invalid" };

      await controller.getProductById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: "Invalid product ID",
      });
    });

    it("should handle product not found", async () => {
      mockRequest.params = { id: "999" };
      const error = new Error("Product with ID 999 not found");
      mockService.getProductById = jest.fn().mockRejectedValue(error);

      await controller.getProductById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: "Product with ID 999 not found",
      });
    });
  });

  describe("createProduct", () => {
    const mockProductData = {
      name: "Test Product",
      sku: "TEST-001",
      category: "Electronics",
      cost_price: 25.5,
      sale_price: 45.99,
      reorder_point: 50,
      warehouse_stock: [{ warehouse_id: 1, initial_quantity: 100 }],
    };

    const mockCreatedProduct = {
      product: {
        id: 1,
        ...mockProductData,
        stock_levels: [],
        total_stock: 100,
        stock_status: "adequate" as const,
      },
    };

    beforeEach(() => {
      mockService.createProduct = jest
        .fn()
        .mockResolvedValue(mockCreatedProduct);
    });

    it("should create product successfully", async () => {
      mockRequest.body = mockProductData;

      await controller.createProduct(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.createProduct).toHaveBeenCalledWith(mockProductData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockCreatedProduct,
        message: "Product created successfully",
      });
    });

    it("should handle validation errors", async () => {
      mockRequest.body = { name: "" }; // Invalid data

      await controller.createProduct(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: "Validation failed",
        errors: expect.any(Object),
      });
    });

    it("should handle duplicate SKU error", async () => {
      mockRequest.body = mockProductData;
      const error = new Error("SKU 'TEST-001' already exists");
      mockService.createProduct = jest.fn().mockRejectedValue(error);

      await controller.createProduct(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: "SKU 'TEST-001' already exists",
      });
    });
  });

  describe("updateProduct", () => {
    const mockUpdateData = {
      name: "Updated Product",
      sale_price: 49.99,
    };

    const mockUpdatedProduct = {
      product: {
        id: 1,
        name: "Updated Product",
        sku: "TEST-001",
        sale_price: 49.99,
        stock_levels: [],
        total_stock: 150,
        stock_status: "adequate" as const,
      },
    };

    beforeEach(() => {
      mockService.updateProduct = jest
        .fn()
        .mockResolvedValue(mockUpdatedProduct);
    });

    it("should update product successfully", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = mockUpdateData;

      await controller.updateProduct(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.updateProduct).toHaveBeenCalledWith(1, mockUpdateData);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedProduct,
        message: "Product updated successfully",
      });
    });

    it("should handle invalid product ID", async () => {
      mockRequest.params = { id: "invalid" };
      mockRequest.body = mockUpdateData;

      await controller.updateProduct(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: "Invalid product ID",
      });
    });

    it("should handle validation errors", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { sale_price: -10 }; // Invalid data

      await controller.updateProduct(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: "Validation failed",
        errors: expect.any(Object),
      });
    });
  });

  describe("deleteProduct", () => {
    beforeEach(() => {
      mockService.deleteProduct = jest.fn().mockResolvedValue(undefined);
    });

    it("should delete product successfully", async () => {
      mockRequest.params = { id: "1" };

      await controller.deleteProduct(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.deleteProduct).toHaveBeenCalledWith(1);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "Product deleted successfully",
      });
    });

    it("should handle invalid product ID", async () => {
      mockRequest.params = { id: "invalid" };

      await controller.deleteProduct(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: "Invalid product ID",
      });
    });

    it("should handle product not found", async () => {
      mockRequest.params = { id: "999" };
      const error = new Error("Product with ID 999 not found");
      mockService.deleteProduct = jest.fn().mockRejectedValue(error);

      await controller.deleteProduct(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: "Product with ID 999 not found",
      });
    });

    it("should handle active purchase orders error", async () => {
      mockRequest.params = { id: "1" };
      const error = new Error(
        "Cannot delete product with active purchase orders"
      );
      mockService.deleteProduct = jest.fn().mockRejectedValue(error);

      await controller.deleteProduct(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: "Cannot delete product with active purchase orders",
      });
    });
  });

  describe("getCategories", () => {
    const mockCategories = ["Electronics", "Books", "Clothing"];

    beforeEach(() => {
      mockService.getCategories = jest.fn().mockResolvedValue(mockCategories);
    });

    it("should return categories successfully", async () => {
      await controller.getCategories(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.getCategories).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { categories: mockCategories },
      });
    });

    it("should handle service errors", async () => {
      const error = new Error("Service error");
      mockService.getCategories = jest.fn().mockRejectedValue(error);

      await controller.getCategories(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: "Service error",
      });
    });
  });

  describe("validateSku", () => {
    beforeEach(() => {
      mockService.validateSku = jest.fn().mockResolvedValue(true);
    });

    it("should validate SKU successfully", async () => {
      mockRequest.params = { sku: "NEW-SKU" };

      await controller.validateSku(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.validateSku).toHaveBeenCalledWith(
        "NEW-SKU",
        undefined
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          sku: "NEW-SKU",
          is_valid: true,
          message: "SKU is available",
        },
      });
    });

    it("should handle exclude product ID parameter", async () => {
      mockRequest.params = { sku: "TEST-SKU" };
      mockRequest.query = { exclude_product_id: "1" };

      await controller.validateSku(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.validateSku).toHaveBeenCalledWith("TEST-SKU", 1);
    });

    it("should return false for existing SKU", async () => {
      mockRequest.params = { sku: "EXISTING-SKU" };
      mockService.validateSku = jest.fn().mockResolvedValue(false);

      await controller.validateSku(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          sku: "EXISTING-SKU",
          is_valid: false,
          message: "SKU already exists",
        },
      });
    });
  });

  describe("getWarehouses", () => {
    const mockWarehouses = [
      {
        id: 1,
        name: "Main Warehouse",
        address: "123 Main St",
        city: "City",
        state: "State",
        zip_code: "12345",
        active: true,
      },
      {
        id: 2,
        name: "Secondary Warehouse",
        address: "456 Oak Ave",
        city: "City",
        state: "State",
        zip_code: "67890",
        active: true,
      },
    ];

    beforeEach(() => {
      mockLocationRepository.findAll = jest
        .fn()
        .mockResolvedValue(mockWarehouses);
    });

    it("should return warehouses successfully", async () => {
      await controller.getWarehouses(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockLocationRepository.findAll).toHaveBeenCalledWith({
        active: true,
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          warehouses: [
            {
              id: 1,
              name: "Main Warehouse",
              address: "123 Main St, City, State 12345",
              active: true,
            },
            {
              id: 2,
              name: "Secondary Warehouse",
              address: "456 Oak Ave, City, State 67890",
              active: true,
            },
          ],
        },
      });
    });

    it("should handle service errors", async () => {
      const error = new Error("Service error");
      mockLocationRepository.findAll = jest.fn().mockRejectedValue(error);

      await controller.getWarehouses(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: "Service error",
      });
    });
  });

  describe("updateInlineField", () => {
    const mockOldProduct = {
      product: {
        id: 1,
        sale_price: 45.99,
      },
    };

    const mockUpdatedProduct = {
      id: 1,
      sale_price: 49.99,
      updated_at: new Date(),
    };

    beforeEach(() => {
      mockService.getProductById = jest.fn().mockResolvedValue(mockOldProduct);
      mockService.updateInlineField = jest
        .fn()
        .mockResolvedValue(mockUpdatedProduct);
    });

    it("should update inline field successfully", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { field: "sale_price", value: 49.99 };

      await controller.updateInlineField(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.updateInlineField).toHaveBeenCalledWith(
        1,
        "sale_price",
        49.99
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          product: {
            id: 1,
            field: "sale_price",
            old_value: 45.99,
            new_value: 49.99,
            updated_at: mockUpdatedProduct.updated_at,
          },
          message: "sale price updated successfully",
        },
      });
    });

    it("should handle invalid product ID", async () => {
      mockRequest.params = { id: "invalid" };
      mockRequest.body = { field: "sale_price", value: 49.99 };

      await controller.updateInlineField(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: "Invalid product ID",
      });
    });

    it("should handle invalid field", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { field: "invalid_field", value: "test" };

      await controller.updateInlineField(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: "Invalid field for inline editing",
      });
    });
  });

  describe("bulkUpdateFields", () => {
    const mockOldProduct = {
      product: {
        id: 1,
        sale_price: 45.99,
        cost_price: 25.5,
      },
    };

    const mockUpdatedProduct = {
      product: {
        id: 1,
        sale_price: 49.99,
        cost_price: 27.0,
        updated_at: new Date(),
      },
    };

    beforeEach(() => {
      mockService.getProductById = jest.fn().mockResolvedValue(mockOldProduct);
      mockService.updateProduct = jest
        .fn()
        .mockResolvedValue(mockUpdatedProduct);
    });

    it("should bulk update fields successfully", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = {
        fields: {
          sale_price: 49.99,
          cost_price: 27.0,
        },
      };

      await controller.bulkUpdateFields(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.updateProduct).toHaveBeenCalledWith(1, {
        sale_price: 49.99,
        cost_price: 27.0,
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          product: {
            id: 1,
            updated_fields: {
              sale_price: { old_value: 45.99, new_value: 49.99 },
              cost_price: { old_value: 25.5, new_value: 27.0 },
            },
            updated_at: mockUpdatedProduct.product.updated_at,
          },
          message: "Product updated successfully",
        },
      });
    });

    it("should handle invalid product ID", async () => {
      mockRequest.params = { id: "invalid" };
      mockRequest.body = { fields: { sale_price: 49.99 } };

      await controller.bulkUpdateFields(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: "Invalid product ID",
      });
    });
  });
});
