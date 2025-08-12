import { Request, Response } from "express";
import { SummaryMetricsService } from "../services/SummaryMetricsService";
import { StockLevelsService } from "../services/StockLevelsService";
import {
  SummaryMetricsResponse,
  StockLevelsResponse,
  ApiResponse,
  PaginationParams,
  StockFilter,
} from "../types";
import { cache, MemoryCache } from "../utils/cache";

export class DashboardController {
  private summaryMetricsService: SummaryMetricsService;
  private stockLevelsService: StockLevelsService;

  constructor() {
    this.summaryMetricsService = new SummaryMetricsService();
    this.stockLevelsService = new StockLevelsService();
  }

  /**
   * GET /api/dashboard/summary-metrics
   * Get summary metrics for the dashboard
   */
  async getSummaryMetrics(req: Request, res: Response): Promise<void> {
    try {
      const warehouseId =
        req.query.warehouse_id !== undefined
          ? parseInt(req.query.warehouse_id as string)
          : undefined;

      // Validate warehouse_id if provided
      if (req.query.warehouse_id !== undefined && isNaN(warehouseId!)) {
        res.status(400).json({
          success: false,
          error: "Invalid warehouse_id parameter",
        } as ApiResponse);
        return;
      }

      // Check cache first
      const cacheKey = MemoryCache.generateSummaryMetricsKey(warehouseId);
      const cachedResponse = cache.get(cacheKey);

      if (cachedResponse) {
        res.json({
          success: true,
          data: cachedResponse,
        } as ApiResponse<SummaryMetricsResponse>);
        return;
      }

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
      cache.set(cacheKey, response, 2 * 60 * 1000);

      res.json({
        success: true,
        data: response,
      } as ApiResponse<SummaryMetricsResponse>);
    } catch (error) {
      console.error("Error fetching summary metrics:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch summary metrics",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      } as ApiResponse);
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
      const cachedResponse = cache.get(cacheKey);

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
      cache.set(cacheKey, stockLevelsResponse, 60 * 1000);

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
}
