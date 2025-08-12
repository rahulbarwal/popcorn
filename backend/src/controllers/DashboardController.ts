import { Request, Response } from "express";
import { SummaryMetricsService } from "../services/SummaryMetricsService";
import { SummaryMetricsResponse, ApiResponse } from "../types";
import { cache, MemoryCache } from "../utils/cache";

export class DashboardController {
  private summaryMetricsService: SummaryMetricsService;

  constructor() {
    this.summaryMetricsService = new SummaryMetricsService();
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
}
