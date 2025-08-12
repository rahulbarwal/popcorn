import { Router } from "express";
import { DashboardController } from "../controllers/DashboardController";

const router = Router();
const dashboardController = new DashboardController();

/**
 * GET /api/dashboard/summary-metrics
 * Get summary metrics for the dashboard
 * Query parameters:
 * - warehouse_id (optional): Filter metrics by specific warehouse
 */
router.get(
  "/summary-metrics",
  dashboardController.getSummaryMetrics.bind(dashboardController)
);

/**
 * GET /api/dashboard/stock-levels
 * Get stock levels with filtering and sorting
 * Query parameters:
 * - warehouse_id (optional): Filter by specific warehouse
 * - stock_filter (optional): Filter by stock status ('all', 'low_stock', 'out_of_stock')
 * - search (optional): Search by product name, SKU, or category
 * - category (optional): Filter by product category
 * - page (optional): Page number for pagination (default: 1)
 * - limit (optional): Items per page (default: 50, max: 100)
 */
router.get(
  "/stock-levels",
  dashboardController.getStockLevels.bind(dashboardController)
);

export default router;
