import request from "supertest";
import express from "express";
import { DashboardController } from "../DashboardController";
import { SummaryMetricsService } from "../../services/SummaryMetricsService";
import { cache } from "../../utils/cache";

// Mock the service
jest.mock("../../services/SummaryMetricsService");
jest.mock("../../utils/cache");

describe("DashboardController", () => {
  let app: express.Application;
  let controller: DashboardController;
  let mockSummaryMetricsService: jest.Mocked<SummaryMetricsService>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create Express app for testing
    app = express();
    app.use(express.json());

    // Create controller instance
    controller = new DashboardController();
    mockSummaryMetricsService = (controller as any).summaryMetricsService;

    // Set up route
    app.get("/summary-metrics", controller.getSummaryMetrics.bind(controller));
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
});
