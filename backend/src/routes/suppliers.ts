import { Router } from "express";
import { SupplierController } from "../controllers/SupplierController";

const router = Router();
const supplierController = new SupplierController();

/**
 * GET /api/suppliers
 * Get all suppliers with detailed information
 * Query parameters:
 * - include_inactive (optional): Include inactive suppliers (default: false)
 * - search (optional): Search by supplier name, contact, or email
 * - limit (optional): Limit number of results (default: all, max: 100)
 * Requirements: 4.1, 4.2
 */
router.get("/", supplierController.getAllSuppliers.bind(supplierController));

/**
 * GET /api/suppliers/by-products
 * Get suppliers associated with specific products
 * Query parameters:
 * - product_ids (required): Comma-separated list of product IDs
 * Requirements: 4.1, 4.2
 */
router.get(
  "/by-products",
  supplierController.getSuppliersForProducts.bind(supplierController)
);

/**
 * GET /api/suppliers/performance-rankings
 * Get supplier performance rankings
 * Query parameters:
 * - limit (optional): Number of suppliers to return (default: 10, max: 50)
 * Requirements: 4.3, 4.4
 */
router.get(
  "/performance-rankings",
  supplierController.getSupplierPerformanceRankings.bind(supplierController)
);

/**
 * GET /api/suppliers/recent-activity
 * Get suppliers with recent activity (orders in last N days)
 * Query parameters:
 * - days (optional): Number of days to look back (default: 30, max: 365)
 * Requirements: 4.3, 4.4
 */
router.get(
  "/recent-activity",
  supplierController.getSuppliersWithRecentActivity.bind(supplierController)
);

/**
 * GET /api/suppliers/:id
 * Get supplier by ID with detailed contact information
 * Path parameters:
 * - id (required): Supplier ID
 * Requirements: 4.1, 4.2
 */
router.get("/:id", supplierController.getSupplierById.bind(supplierController));

/**
 * GET /api/suppliers/:id/performance
 * Get supplier with performance metrics and recent order history
 * Path parameters:
 * - id (required): Supplier ID
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */
router.get(
  "/:id/performance",
  supplierController.getSupplierPerformance.bind(supplierController)
);

/**
 * GET /api/suppliers/:id/orders
 * Get detailed order history for a supplier
 * Path parameters:
 * - id (required): Supplier ID
 * Query parameters:
 * - page (optional): Page number for pagination (default: 1)
 * - limit (optional): Items per page (default: 20, max: 100)
 * Requirements: 4.3, 4.4
 */
router.get(
  "/:id/orders",
  supplierController.getSupplierOrderHistory.bind(supplierController)
);

export default router;
