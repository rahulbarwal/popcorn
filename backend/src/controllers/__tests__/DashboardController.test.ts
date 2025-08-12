import request from "supertest";
import express from "express";
import { DashboardController } from "../DashboardController";
import { SummaryMetricsService } from "../../services/SummaryMetricsService";
import { StockLevelsService } from "../../services/StockLevelsService";
import { cache } from "../../utils/cache";

// Mock the services
jest.mock("../../services/SummaryMetricsService");
jest.mock("../../services/StockLevelsService");
jest.mock("../../utils/cache");

describe("DashboardController", () => {
  let app: express.Application;
  let controller: DashboardController;
  let mockSummaryMetricsService: jest.Mocked<SummaryMetricsService>;
  let mockStockLevelsService: jest.Mocked<StockLevelsService>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create Express app for testing
    app = express();
    app.use(express.json());

    // Create controller instance
    controller = new DashboardController();
    mockSummaryMetricsService = (controller as any).summaryMetricsService;
    mockStockLevelsService = (controller as any).stockLevelsService;

    // Set up routes
    app.get("/summary-metrics", controller.getSummaryMetrics.bind(controller));
    app.get("/stock-levels", controller.getStockLevels.bind(controller));
  });

  describe("GET /summary-metrics", () => {
    const mockMetrics = {
      total_products: { value: 100, status: "normal" as const },
      low_stock: { value: 25, status: "warning" as const, threshold: 50 },
      out_of_stock: { value: 5, status: "warning" as const },
      suppliers: { value: 15, status: "normal" as const },
      total_stock_value: {
        value: 125000.5,
        currency: "USD",
        status: "normal" as const,
        excluded_products: 3,
      },
    };

    it("should return summary metrics without warehouse filter", async () => {
      // Mock cache miss
      (cache.get as jest.Mock).mockReturnValue(null);

      // Mock service response
      mockSummaryMetricsService.calculateSummaryMetrics.mockResolvedValue(
        mockMetrics
      );

      const response = await request(app).get("/summary-metrics").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.metrics).toEqual(mockMetrics);
      expect(response.body.data.warehouse_filter).toBeUndefined();
      expect(response.body.data.last_updated).toBeDefined();

      // Verify service was called without warehouse ID
      expect(
        mockSummaryMetricsService.calculateSummaryMetrics
      ).toHaveBeenCalledWith(undefined);

      // Verify cache was set
      expect(cache.set).toHaveBeenCalled();
    });

    it("should return summary metrics with warehouse filter", async () => {
      const warehouseId = 1;

      // Mock cache miss
      (cache.get as jest.Mock).mockReturnValue(null);

      // Mock service response
      mockSummaryMetricsService.calculateSummaryMetrics.mockResolvedValue(
        mockMetrics
      );

      const response = await request(app)
        .get(`/summary-metrics?warehouse_id=${warehouseId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.metrics).toEqual(mockMetrics);
      expect(response.body.data.warehouse_filter).toEqual({
        id: warehouseId,
        name: "Warehouse",
      });

      // Verify service was called with warehouse ID
      expect(
        mockSummaryMetricsService.calculateSummaryMetrics
      ).toHaveBeenCalledWith(warehouseId);
    });

    it("should return cached response when available", async () => {
      const cachedResponse = {
        metrics: mockMetrics,
        warehouse_filter: undefined,
        last_updated: "2024-12-08T10:00:00.000Z",
      };

      // Mock cache hit
      (cache.get as jest.Mock).mockReturnValue(cachedResponse);

      const response = await request(app).get("/summary-metrics").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(cachedResponse);

      // Verify service was not called
      expect(
        mockSummaryMetricsService.calculateSummaryMetrics
      ).not.toHaveBeenCalled();

      // Verify cache was checked
      expect(cache.get).toHaveBeenCalled();
    });

    it("should return 400 for invalid warehouse_id", async () => {
      const response = await request(app)
        .get("/summary-metrics?warehouse_id=invalid")
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid warehouse_id parameter");

      // Verify service was not called
      expect(
        mockSummaryMetricsService.calculateSummaryMetrics
      ).not.toHaveBeenCalled();
    });

    it("should handle service errors gracefully", async () => {
      // Mock cache miss
      (cache.get as jest.Mock).mockReturnValue(null);

      // Mock service error
      const errorMessage = "Database connection failed";
      mockSummaryMetricsService.calculateSummaryMetrics.mockRejectedValue(
        new Error(errorMessage)
      );

      const response = await request(app).get("/summary-metrics").expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Failed to fetch summary metrics");
      expect(response.body.message).toBe(errorMessage);
    });

    it("should handle non-Error exceptions", async () => {
      // Mock cache miss
      (cache.get as jest.Mock).mockReturnValue(null);

      // Mock service throwing non-Error
      mockSummaryMetricsService.calculateSummaryMetrics.mockRejectedValue(
        "String error"
      );

      const response = await request(app).get("/summary-metrics").expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Failed to fetch summary metrics");
      expect(response.body.message).toBe("Unknown error occurred");
    });

    it("should accept warehouse_id as 0", async () => {
      const warehouseId = 0;

      // Mock cache miss
      (cache.get as jest.Mock).mockReturnValue(null);

      // Mock service response
      mockSummaryMetricsService.calculateSummaryMetrics.mockResolvedValue(
        mockMetrics
      );

      const response = await request(app)
        .get(`/summary-metrics?warehouse_id=${warehouseId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.warehouse_filter).toEqual({
        id: warehouseId,
        name: "Warehouse",
      });

      // Verify service was called with warehouse ID 0
      expect(
        mockSummaryMetricsService.calculateSummaryMetrics
      ).toHaveBeenCalledWith(warehouseId);
    });
  });

  describe("GET /stock-levels", () => {
    const mockStockLevelsResponse = {
      products: [
        {
          id: 1,
          sku: "TEST-001",
          name: "Test Product 1",
          category: "Electronics",
          image_url: "test1.jpg",
          total_quantity: 25,
          unit_cost: 15.5,
          total_value: 387.5,
          reorder_point: 10,
          stock_status: "adequate" as const,
          locations: [
            {
              location_id: 1,
              location_name: "Main Warehouse",
              quantity: 25,
              unit_cost: 15.5,
            },
          ],
        },
        {
          id: 2,
          sku: "TEST-002",
          name: "Test Product 2",
          category: "Books",
          image_url: "test2.jpg",
          total_quantity: 3,
          unit_cost: 12,
          total_value: 36,
          reorder_point: 5,
          stock_status: "low_stock" as const,
          locations: [
            {
              location_id: 1,
              location_name: "Main Warehouse",
              quantity: 3,
              unit_cost: 12,
            },
          ],
        },
      ],
      filters: {
        warehouse_id: undefined,
        stock_filter: "all" as const,
        search: undefined,
        category: undefined,
      },
      pagination: {
        page: 1,
        limit: 50,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    };

    it("should return stock levels without filters", async () => {
      // Mock cache miss
      (cache.get as jest.Mock).mockReturnValue(null);

      // Mock service response
      mockStockLevelsService.getStockLevels.mockResolvedValue(
        mockStockLevelsResponse
      );

      const response = await request(app).get("/stock-levels").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockStockLevelsResponse);

      // Verify service was called with default parameters
      expect(mockStockLevelsService.getStockLevels).toHaveBeenCalledWith(
        { stock_filter: "all" },
        { page: 1, limit: 50 }
      );

      // Verify cache was set
      expect(cache.set).toHaveBeenCalled();
    });

    it("should return stock levels with warehouse filter", async () => {
      const warehouseId = 1;
      const filteredResponse = {
        ...mockStockLevelsResponse,
        filters: {
          ...mockStockLevelsResponse.filters,
          warehouse_id: warehouseId,
        },
      } as unknown as typeof mockStockLevelsResponse;

      // Mock cache miss
      (cache.get as jest.Mock).mockReturnValue(null);

      // Mock service response
      mockStockLevelsService.getStockLevels.mockResolvedValue(filteredResponse);

      const response = await request(app)
        .get(`/stock-levels?warehouse_id=${warehouseId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.filters.warehouse_id).toBe(warehouseId);

      // Verify service was called with warehouse filter
      expect(mockStockLevelsService.getStockLevels).toHaveBeenCalledWith(
        { warehouse_id: warehouseId, stock_filter: "all" },
        { page: 1, limit: 50 }
      );
    });

    it("should return stock levels with stock status filter", async () => {
      const stockFilter = "low_stock";
      const filteredResponse = {
        ...mockStockLevelsResponse,
        products: [mockStockLevelsResponse.products[1]], // Only low stock product
        filters: {
          ...mockStockLevelsResponse.filters,
          stock_filter: stockFilter as "low_stock",
        },
      };

      // Mock cache miss
      (cache.get as jest.Mock).mockReturnValue(null);

      // Mock service response
      mockStockLevelsService.getStockLevels.mockResolvedValue(filteredResponse);

      const response = await request(app)
        .get(`/stock-levels?stock_filter=${stockFilter}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.filters.stock_filter).toBe(stockFilter);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.products[0].stock_status).toBe("low_stock");

      // Verify service was called with stock filter
      expect(mockStockLevelsService.getStockLevels).toHaveBeenCalledWith(
        { stock_filter: stockFilter },
        { page: 1, limit: 50 }
      );
    });

    it("should return stock levels with search filter", async () => {
      const searchTerm = "Test Product";
      const filteredResponse = {
        ...mockStockLevelsResponse,
        filters: {
          ...mockStockLevelsResponse.filters,
          search: searchTerm,
        },
      } as unknown as typeof mockStockLevelsResponse;

      // Mock cache miss
      (cache.get as jest.Mock).mockReturnValue(null);

      // Mock service response
      mockStockLevelsService.getStockLevels.mockResolvedValue(filteredResponse);

      const response = await request(app)
        .get(`/stock-levels?search=${encodeURIComponent(searchTerm)}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.filters.search).toBe(searchTerm);

      // Verify service was called with search filter
      expect(mockStockLevelsService.getStockLevels).toHaveBeenCalledWith(
        { search: searchTerm, stock_filter: "all" },
        { page: 1, limit: 50 }
      );
    });

    it("should return stock levels with category filter", async () => {
      const category = "Electronics";
      const filteredResponse = {
        ...mockStockLevelsResponse,
        products: [mockStockLevelsResponse.products[0]], // Only electronics product
        filters: {
          ...mockStockLevelsResponse.filters,
          category: category,
        },
      } as unknown as typeof mockStockLevelsResponse;

      // Mock cache miss
      (cache.get as jest.Mock).mockReturnValue(null);

      // Mock service response
      mockStockLevelsService.getStockLevels.mockResolvedValue(filteredResponse);

      const response = await request(app)
        .get(`/stock-levels?category=${category}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.filters.category).toBe(category);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.products[0].category).toBe("Electronics");

      // Verify service was called with category filter
      expect(mockStockLevelsService.getStockLevels).toHaveBeenCalledWith(
        { category: category, stock_filter: "all" },
        { page: 1, limit: 50 }
      );
    });

    it("should handle pagination parameters", async () => {
      const page = 2;
      const limit = 25;
      const paginatedResponse = {
        ...mockStockLevelsResponse,
        pagination: {
          page: page,
          limit: limit,
          total: 100,
          totalPages: 4,
          hasNext: true,
          hasPrev: true,
        },
      };

      // Mock cache miss
      (cache.get as jest.Mock).mockReturnValue(null);

      // Mock service response
      mockStockLevelsService.getStockLevels.mockResolvedValue(
        paginatedResponse
      );

      const response = await request(app)
        .get(`/stock-levels?page=${page}&limit=${limit}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.page).toBe(page);
      expect(response.body.data.pagination.limit).toBe(limit);

      // Verify service was called with pagination
      expect(mockStockLevelsService.getStockLevels).toHaveBeenCalledWith(
        { stock_filter: "all" },
        { page: page, limit: limit }
      );
    });

    it("should return cached response when available", async () => {
      // Mock cache hit
      (cache.get as jest.Mock).mockReturnValue(mockStockLevelsResponse);

      const response = await request(app).get("/stock-levels").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockStockLevelsResponse);

      // Verify service was not called
      expect(mockStockLevelsService.getStockLevels).not.toHaveBeenCalled();

      // Verify cache was checked
      expect(cache.get).toHaveBeenCalled();
    });

    it("should return 400 for invalid warehouse_id", async () => {
      const response = await request(app)
        .get("/stock-levels?warehouse_id=invalid")
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid warehouse_id parameter");

      // Verify service was not called
      expect(mockStockLevelsService.getStockLevels).not.toHaveBeenCalled();
    });

    it("should return 400 for invalid page parameter", async () => {
      const response = await request(app)
        .get("/stock-levels?page=0")
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe(
        "Invalid page parameter. Must be a positive integer."
      );

      // Verify service was not called
      expect(mockStockLevelsService.getStockLevels).not.toHaveBeenCalled();
    });

    it("should return 400 for invalid limit parameter", async () => {
      const response = await request(app)
        .get("/stock-levels?limit=101")
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe(
        "Invalid limit parameter. Must be between 1 and 100."
      );

      // Verify service was not called
      expect(mockStockLevelsService.getStockLevels).not.toHaveBeenCalled();
    });

    it("should return 400 for invalid stock_filter parameter", async () => {
      const response = await request(app)
        .get("/stock-levels?stock_filter=invalid")
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe(
        "Invalid stock_filter parameter. Must be 'all', 'low_stock', or 'out_of_stock'."
      );

      // Verify service was not called
      expect(mockStockLevelsService.getStockLevels).not.toHaveBeenCalled();
    });

    it("should handle service errors gracefully", async () => {
      // Mock cache miss
      (cache.get as jest.Mock).mockReturnValue(null);

      // Mock service error
      const errorMessage = "Database connection failed";
      mockStockLevelsService.getStockLevels.mockRejectedValue(
        new Error(errorMessage)
      );

      const response = await request(app).get("/stock-levels").expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Failed to fetch stock levels");
      expect(response.body.message).toBe(errorMessage);
    });

    it("should filter out empty string parameters", async () => {
      // Mock cache miss
      (cache.get as jest.Mock).mockReturnValue(null);

      // Mock service response
      mockStockLevelsService.getStockLevels.mockResolvedValue(
        mockStockLevelsResponse
      );

      const response = await request(app)
        .get("/stock-levels?search=&category=")
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify service was called with empty filters removed
      expect(mockStockLevelsService.getStockLevels).toHaveBeenCalledWith(
        { stock_filter: "all" },
        { page: 1, limit: 50 }
      );
    });

    it("should handle multiple filters combined", async () => {
      const warehouseId = 1;
      const stockFilter = "low_stock";
      const search = "Test";
      const category = "Electronics";

      const combinedFilters = {
        warehouse_id: warehouseId,
        stock_filter: stockFilter as "low_stock",
        search: search,
        category: category,
      };

      const filteredResponse = {
        ...mockStockLevelsResponse,
        filters: combinedFilters,
      };

      // Mock cache miss
      (cache.get as jest.Mock).mockReturnValue(null);

      // Mock service response
      mockStockLevelsService.getStockLevels.mockResolvedValue(filteredResponse);

      const response = await request(app)
        .get(
          `/stock-levels?warehouse_id=${warehouseId}&stock_filter=${stockFilter}&search=${search}&category=${category}`
        )
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.filters).toEqual(combinedFilters);

      // Verify service was called with all filters
      expect(mockStockLevelsService.getStockLevels).toHaveBeenCalledWith(
        combinedFilters,
        { page: 1, limit: 50 }
      );
    });
  });
});
