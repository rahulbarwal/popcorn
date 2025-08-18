import { Router } from "express";
import { DashboardController } from "../controllers/DashboardController";
import { validate, dashboardSchemas } from "../middleware/validation";
import { dashboardRateLimit } from "../middleware/rateLimiter";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();
const dashboardController = new DashboardController();

// Apply dashboard-specific rate limiting
router.use(dashboardRateLimit.middleware());

/**
 * GET /api/dashboard/summary-metrics
 * Get summary metrics for the dashboard
 * Query parameters:
 * - warehouse_id (optional): Filter metrics by specific warehouse
 */
router.get(
  "/summary-metrics",
  validate(dashboardSchemas.summaryMetrics),
  asyncHandler(dashboardController.getSummaryMetrics.bind(dashboardController))
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
  validate(dashboardSchemas.stockLevels),
  asyncHandler(dashboardController.getStockLevels.bind(dashboardController))
);

/**
 * GET /api/dashboard/recent-purchases
 * Get recent purchase orders with supplier information
 * Query parameters:
 * - warehouse_id (optional): Filter by specific warehouse
 * - supplier_id (optional): Filter by specific supplier
 * - status (optional): Filter by order status ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')
 * - date_from (optional): Filter orders from this date (YYYY-MM-DD format)
 * - date_to (optional): Filter orders to this date (YYYY-MM-DD format)
 * - limit (optional): Number of orders to return (default: 10, max: 50)
 */
router.get(
  "/recent-purchases",
  validate(dashboardSchemas.recentPurchases),
  asyncHandler(dashboardController.getRecentPurchases.bind(dashboardController))
);

/**
 * GET /api/dashboard/warehouse-distribution
 * Get inventory distribution across warehouse locations
 * Query parameters:
 * - warehouse_id (optional): Filter by specific warehouse
 * - product_id (optional): Filter by specific product
 * - category (optional): Filter by product category
 * - min_value (optional): Filter products with minimum total value
 */
router.get(
  "/warehouse-distribution",
  validate(dashboardSchemas.warehouseDistribution),
  asyncHandler(
    dashboardController.getWarehouseDistribution.bind(dashboardController)
  )
);

export default router;
