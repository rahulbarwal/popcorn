import { Request, Response } from "express";
import { SummaryMetricsService } from "../services/SummaryMetricsService";
import { StockLevelsService } from "../services/StockLevelsService";
import { PurchaseOrderService } from "../services/PurchaseOrderService";
import { WarehouseDistributionService } from "../services/WarehouseDistributionService";
import { StockVisualizationService } from "../services/StockVisualizationService";
import {
  SummaryMetricsResponse,
  StockLevelsResponse,
  RecentPurchasesResponse,
  WarehouseDistributionResponse,
  StockVisualizationResponse,
  ApiResponse,
  PaginationParams,
  StockFilter,
  OrderStatus,
} from "../types";
import { cache, MemoryCache } from "../utils/cache";
import { logger } from "../utils/logger";
import {
  ValidationError,
  NotFoundError,
  DatabaseError,
} from "../middleware/errorHandler";

export class DashboardController {
  private summaryMetricsService: SummaryMetricsService;
  private stockLevelsService: StockLevelsService;
  private purchaseOrderService: PurchaseOrderService;
  private warehouseDistributionService: WarehouseDistributionService;
  private stockVisualizationService: StockVisualizationService;

  constructor() {
    this.summaryMetricsService = new SummaryMetricsService();
    this.stockLevelsService = new StockLevelsService();
    this.purchaseOrderService = new PurchaseOrderService();
    this.warehouseDistributionService = new WarehouseDistributionService();
    this.stockVisualizationService = new StockVisualizationService();
  }

  /**
   * GET /api/dashboard/summary-metrics
   * Get summary metrics for the dashboard
   */
  async getSummaryMetrics(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const warehouseId = req.query.warehouse_id
      ? parseInt(req.query.warehouse_id as string)
      : undefined;

    logger.info("Fetching summary metrics", {
      requestId: req.requestId,
      warehouseId,
    });

    // Check cache first
    const cacheKey = MemoryCache.generateSummaryMetricsKey(warehouseId);
    const cachedResponse = cache.getSync<SummaryMetricsResponse>(cacheKey);

    if (cachedResponse) {
      logger.debug("Summary metrics served from cache", {
        requestId: req.requestId,
        cacheKey,
        responseTime: `${Date.now() - startTime}ms`,
      });

      res.json({
        success: true,
        data: cachedResponse,
      } as ApiResponse<SummaryMetricsResponse>);
      return;
    }

    try {
      const metrics = await this.summaryMetricsService.calculateSummaryMetrics(
        warehouseId
      );

      const response: SummaryMetricsResponse = {
        metrics,
        warehouse_filter:
          warehouseId !== undefined
            ? {
                id: warehouseId,
                name: "Warehouse", // This would be fetched from LocationRepository in a real implementation
              }
            : undefined,
        last_updated: new Date().toISOString(),
      };

      // Cache the response for 2 minutes (metrics don't need to be real-time)
      cache.setSync(cacheKey, response, 2 * 60 * 1000);

      const responseTime = Date.now() - startTime;
      logger.info("Summary metrics calculated successfully", {
        requestId: req.requestId,
        warehouseId,
        responseTime: `${responseTime}ms`,
        metricsCount: Object.keys(metrics).length,
      });

      res.json({
        success: true,
        data: response,
      } as ApiResponse<SummaryMetricsResponse>);
    } catch (error) {
      logger.error("Failed to fetch summary metrics", {
        requestId: req.requestId,
        warehouseId,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });

      if (error instanceof Error && error.message.includes("database")) {
        throw new DatabaseError(
          "Failed to fetch summary metrics from database",
          error
        );
      }

      throw error;
    }
  }

  /**
   * GET /api/dashboard/stock-levels
   * Get stock levels with filtering and sorting
   */
  async getStockLevels(req: Request, res: Response): Promise<void> {
    try {
      // Parse query parameters
      const warehouseId = req.query.warehouse_id
        ? parseInt(req.query.warehouse_id as string)
        : undefined;

      const stockFilter = (req.query.stock_filter as StockFilter) || "all";
      const search = req.query.search as string;
      const category = req.query.category as string;

      // Parse pagination parameters
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

      // Validate parameters
      if (req.query.warehouse_id && isNaN(warehouseId!)) {
        res.status(400).json({
          success: false,
          error: "Invalid warehouse_id parameter",
        } as ApiResponse);
        return;
      }

      if (isNaN(page) || page < 1) {
        res.status(400).json({
          success: false,
          error: "Invalid page parameter. Must be a positive integer.",
        } as ApiResponse);
        return;
      }

      if (isNaN(limit) || limit < 1 || limit > 100) {
        res.status(400).json({
          success: false,
          error: "Invalid limit parameter. Must be between 1 and 100.",
        } as ApiResponse);
        return;
      }

      if (
        stockFilter &&
        !["all", "low_stock", "out_of_stock"].includes(stockFilter)
      ) {
        res.status(400).json({
          success: false,
          error:
            "Invalid stock_filter parameter. Must be 'all', 'low_stock', or 'out_of_stock'.",
        } as ApiResponse);
        return;
      }

      // Build filters object
      const filters = {
        warehouse_id: warehouseId,
        stock_filter: stockFilter,
        search: search?.trim(),
        category: category?.trim(),
      };

      // Remove undefined values
      Object.keys(filters).forEach((key) => {
        if (
          filters[key as keyof typeof filters] === undefined ||
          filters[key as keyof typeof filters] === ""
        ) {
          delete filters[key as keyof typeof filters];
        }
      });

      const pagination: PaginationParams = { page, limit };

      // Check cache first (shorter cache for stock levels as they change more frequently)
      const cacheKey = MemoryCache.generateStockLevelsKey(filters, {
        page,
        limit,
      });
      const cachedResponse = cache.getSync<StockLevelsResponse>(cacheKey);

      if (cachedResponse) {
        res.json({
          success: true,
          data: cachedResponse,
        } as ApiResponse<StockLevelsResponse>);
        return;
      }

      // Get stock levels from service
      const stockLevelsResponse = await this.stockLevelsService.getStockLevels(
        filters,
        pagination
      );

      // Cache the response for 1 minute (stock levels need more frequent updates)
      cache.setSync(cacheKey, stockLevelsResponse, 60 * 1000);

      res.json({
        success: true,
        data: stockLevelsResponse,
      } as ApiResponse<StockLevelsResponse>);
    } catch (error) {
      console.error("Error fetching stock levels:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch stock levels",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      } as ApiResponse);
    }
  }

  /**
   * GET /api/dashboard/recent-purchases
   * Get recent purchase orders with supplier information
   * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
   */
  async getRecentPurchases(req: Request, res: Response): Promise<void> {
    try {
      // Parse query parameters
      const warehouseId = req.query.warehouse_id
        ? parseInt(req.query.warehouse_id as string)
        : undefined;

      const supplierId = req.query.supplier_id
        ? parseInt(req.query.supplier_id as string)
        : undefined;

      const status = req.query.status as OrderStatus;
      const dateFrom = req.query.date_from as string;
      const dateTo = req.query.date_to as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      // Validate parameters
      if (req.query.warehouse_id && isNaN(warehouseId!)) {
        res.status(400).json({
          success: false,
          error: "Invalid warehouse_id parameter",
        } as ApiResponse);
        return;
      }

      if (req.query.supplier_id && isNaN(supplierId!)) {
        res.status(400).json({
          success: false,
          error: "Invalid supplier_id parameter",
        } as ApiResponse);
        return;
      }

      if (isNaN(limit) || limit < 1 || limit > 50) {
        res.status(400).json({
          success: false,
          error: "Invalid limit parameter. Must be between 1 and 50.",
        } as ApiResponse);
        return;
      }

      if (
        status &&
        !["pending", "confirmed", "shipped", "delivered", "cancelled"].includes(
          status
        )
      ) {
        res.status(400).json({
          success: false,
          error:
            "Invalid status parameter. Must be 'pending', 'confirmed', 'shipped', 'delivered', or 'cancelled'.",
        } as ApiResponse);
        return;
      }

      // Validate date formats if provided
      if (dateFrom && isNaN(Date.parse(dateFrom))) {
        res.status(400).json({
          success: false,
          error: "Invalid date_from parameter. Must be a valid date string.",
        } as ApiResponse);
        return;
      }

      if (dateTo && isNaN(Date.parse(dateTo))) {
        res.status(400).json({
          success: false,
          error: "Invalid date_to parameter. Must be a valid date string.",
        } as ApiResponse);
        return;
      }

      // Build filters object
      const filters = {
        warehouse_id: warehouseId,
        supplier_id: supplierId,
        status,
        date_from: dateFrom,
        date_to: dateTo,
      };

      // Remove undefined values
      Object.keys(filters).forEach((key) => {
        if (filters[key as keyof typeof filters] === undefined) {
          delete filters[key as keyof typeof filters];
        }
      });

      // Check cache first (cache for 30 seconds as purchase orders change less frequently than stock)
      const cacheKey = MemoryCache.generateRecentPurchasesKey(filters, limit);
      const cachedResponse = cache.getSync<RecentPurchasesResponse>(cacheKey);

      if (cachedResponse) {
        res.json({
          success: true,
          data: cachedResponse,
        } as ApiResponse<RecentPurchasesResponse>);
        return;
      }

      // Get recent purchases from service
      const recentPurchasesResponse =
        await this.purchaseOrderService.getRecentPurchases(filters, limit);

      // Cache the response for 30 seconds
      cache.setSync(cacheKey, recentPurchasesResponse, 30 * 1000);

      res.json({
        success: true,
        data: recentPurchasesResponse,
      } as ApiResponse<RecentPurchasesResponse>);
    } catch (error) {
      console.error("Error fetching recent purchases:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch recent purchases",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      } as ApiResponse);
    }
  }

  /**
   * GET /api/dashboard/warehouse-distribution
   * Get inventory distribution across warehouse locations
   * Requirements: 3.1, 3.2, 3.3, 3.4
   */
  async getWarehouseDistribution(req: Request, res: Response): Promise<void> {
    try {
      // Parse query parameters
      const warehouseId = req.query.warehouse_id
        ? parseInt(req.query.warehouse_id as string)
        : undefined;

      const productId = req.query.product_id
        ? parseInt(req.query.product_id as string)
        : undefined;

      const category = req.query.category as string;
      const minValue = req.query.min_value
        ? parseFloat(req.query.min_value as string)
        : undefined;

      // Validate parameters
      if (req.query.warehouse_id && isNaN(warehouseId!)) {
        res.status(400).json({
          success: false,
          error: "Invalid warehouse_id parameter",
        } as ApiResponse);
        return;
      }

      if (req.query.product_id && isNaN(productId!)) {
        res.status(400).json({
          success: false,
          error: "Invalid product_id parameter",
        } as ApiResponse);
        return;
      }

      if (req.query.min_value && isNaN(minValue!)) {
        res.status(400).json({
          success: false,
          error: "Invalid min_value parameter",
        } as ApiResponse);
        return;
      }

      // Build filters object
      const filters = {
        warehouse_id: warehouseId,
        product_id: productId,
        category: category?.trim(),
        min_value: minValue,
      };

      // Remove undefined and empty string values
      Object.keys(filters).forEach((key) => {
        if (
          filters[key as keyof typeof filters] === undefined ||
          filters[key as keyof typeof filters] === ""
        ) {
          delete filters[key as keyof typeof filters];
        }
      });

      // Check cache first (cache for 2 minutes as warehouse distribution changes less frequently)
      const cacheKey = MemoryCache.generateWarehouseDistributionKey(filters);
      const cachedResponse =
        cache.getSync<WarehouseDistributionResponse>(cacheKey);

      if (cachedResponse) {
        res.json({
          success: true,
          data: cachedResponse,
        } as ApiResponse<WarehouseDistributionResponse>);
        return;
      }

      // Get warehouse distribution from service
      const warehouseDistributionResponse =
        await this.warehouseDistributionService.getWarehouseDistribution(
          filters
        );

      // Cache the response for 2 minutes
      cache.setSync(cacheKey, warehouseDistributionResponse, 2 * 60 * 1000);

      res.json({
        success: true,
        data: warehouseDistributionResponse,
      } as ApiResponse<WarehouseDistributionResponse>);
    } catch (error) {
      console.error("Error fetching warehouse distribution:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch warehouse distribution",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      } as ApiResponse);
    }
  }

  /**
   * GET /api/dashboard/stock-visualization
   * Get stock visualization data for chart rendering
   * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.8
   */
  async getStockVisualization(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      // Parse query parameters
      const warehouseId = req.query.warehouse_id
        ? parseInt(req.query.warehouse_id as string)
        : undefined;

      // Validate parameters
      if (req.query.warehouse_id && isNaN(warehouseId!)) {
        res.status(400).json({
          success: false,
          error: "Invalid warehouse_id parameter",
        } as ApiResponse);
        return;
      }

      // Build filters object
      const filters = {
        warehouse_id: warehouseId,
      };

      // Remove undefined values
      Object.keys(filters).forEach((key) => {
        if (filters[key as keyof typeof filters] === undefined) {
          delete filters[key as keyof typeof filters];
        }
      });

      logger.info("Fetching stock visualization data", {
        requestId: req.requestId,
        warehouseId,
      });

      // Check cache first (cache for 5 minutes as chart data doesn't need real-time updates)
      const cacheKey = MemoryCache.generateStockVisualizationKey(filters);
      const cachedResponse =
        cache.getSync<StockVisualizationResponse>(cacheKey);

      if (cachedResponse) {
        logger.debug("Stock visualization data served from cache", {
          requestId: req.requestId,
          cacheKey,
          responseTime: `${Date.now() - startTime}ms`,
        });

        res.json({
          success: true,
          data: cachedResponse,
        } as ApiResponse<StockVisualizationResponse>);
        return;
      }

      // Get stock visualization data from service
      const stockVisualizationResponse =
        await this.stockVisualizationService.getStockVisualizationData(filters);

      // Cache the response for 5 minutes (chart data can be cached longer)
      cache.setSync(cacheKey, stockVisualizationResponse, 5 * 60 * 1000);

      const responseTime = Date.now() - startTime;
      logger.info("Stock visualization data fetched successfully", {
        requestId: req.requestId,
        warehouseId,
        responseTime: `${responseTime}ms`,
        productsCount: stockVisualizationResponse.chart_data.products.length,
      });

      res.json({
        success: true,
        data: stockVisualizationResponse,
      } as ApiResponse<StockVisualizationResponse>);
    } catch (error) {
      logger.error("Failed to fetch stock visualization data", {
        requestId: req.requestId,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });

      if (error instanceof Error && error.message.includes("database")) {
        throw new DatabaseError(
          "Failed to fetch stock visualization data from database",
          error
        );
      }

      res.status(500).json({
        success: false,
        error: "Failed to fetch stock visualization data",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      } as ApiResponse);
    }
  }
}
