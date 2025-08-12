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

export default router;
