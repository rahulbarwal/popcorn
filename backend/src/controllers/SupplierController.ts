import { Request, Response } from "express";
import { SupplierService } from "../services/SupplierService";
import { ApiResponse, PaginationParams } from "../types";
import { cache, MemoryCache } from "../utils/cache";

export class SupplierController {
  private supplierService: SupplierService;

  constructor() {
    this.supplierService = new SupplierService();
  }

  /**
   * GET /api/suppliers
   * Get all suppliers with detailed information
   * Requirements: 4.1, 4.2
   */
  async getAllSuppliers(req: Request, res: Response): Promise<void> {
    try {
      const includeInactive = req.query.include_inactive === "true";
      const search = req.query.search as string;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string)
        : undefined;

      // Validate limit parameter
      if (req.query.limit && (isNaN(limit!) || limit! < 1 || limit! > 100)) {
        res.status(400).json({
          success: false,
          error: "Invalid limit parameter. Must be between 1 and 100.",
        } as ApiResponse);
        return;
      }

      // Check cache first
      const cacheKey = `suppliers_${includeInactive}_${search || "all"}_${
        limit || "all"
      }`;
      const cachedResponse = cache.get(cacheKey);

      if (cachedResponse) {
        res.json({
          success: true,
          data: cachedResponse,
        } as ApiResponse);
        return;
      }

      let suppliers;

      if (search) {
        suppliers = await this.supplierService.searchSuppliers(
          search,
          limit || 20
        );
      } else {
        suppliers = await this.supplierService.getAllSuppliers(includeInactive);

        if (limit) {
          suppliers = suppliers.slice(0, limit);
        }
      }

      // Cache the response for 5 minutes (supplier data doesn't change frequently)
      cache.set(cacheKey, suppliers, 5 * 60 * 1000);

      res.json({
        success: true,
        data: suppliers,
      } as ApiResponse);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch suppliers",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      } as ApiResponse);
    }
  }

  /**
   * GET /api/suppliers/:id
   * Get supplier by ID with detailed contact information
   * Requirements: 4.1, 4.2
   */
  async getSupplierById(req: Request, res: Response): Promise<void> {
    try {
      const supplierId = parseInt(req.params.id);

      if (isNaN(supplierId)) {
        res.status(400).json({
          success: false,
          error: "Invalid supplier ID",
        } as ApiResponse);
        return;
      }

      // Check cache first
      const cacheKey = `supplier_${supplierId}`;
      const cachedResponse = cache.get(cacheKey);

      if (cachedResponse) {
        res.json({
          success: true,
          data: cachedResponse,
        } as ApiResponse);
        return;
      }

      const supplier = await this.supplierService.getSupplierById(supplierId);

      if (!supplier) {
        res.status(404).json({
          success: false,
          error: "Supplier not found",
        } as ApiResponse);
        return;
      }

      // Cache the response for 10 minutes
      cache.set(cacheKey, supplier, 10 * 60 * 1000);

      res.json({
        success: true,
        data: supplier,
      } as ApiResponse);
    } catch (error) {
      console.error("Error fetching supplier:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch supplier",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      } as ApiResponse);
    }
  }

  /**
   * GET /api/suppliers/:id/performance
   * Get supplier with performance metrics and recent order history
   * Requirements: 4.1, 4.2, 4.3, 4.4
   */
  async getSupplierPerformance(req: Request, res: Response): Promise<void> {
    try {
      const supplierId = parseInt(req.params.id);

      if (isNaN(supplierId)) {
        res.status(400).json({
          success: false,
          error: "Invalid supplier ID",
        } as ApiResponse);
        return;
      }

      // Check cache first (shorter cache for performance data)
      const cacheKey = `supplier_performance_${supplierId}`;
      const cachedResponse = cache.get(cacheKey);

      if (cachedResponse) {
        res.json({
          success: true,
          data: cachedResponse,
        } as ApiResponse);
        return;
      }

      const supplierWithPerformance =
        await this.supplierService.getSupplierWithPerformance(supplierId);

      if (!supplierWithPerformance) {
        res.status(404).json({
          success: false,
          error: "Supplier not found",
        } as ApiResponse);
        return;
      }

      // Cache the response for 2 minutes (performance data should be relatively fresh)
      cache.set(cacheKey, supplierWithPerformance, 2 * 60 * 1000);

      res.json({
        success: true,
        data: supplierWithPerformance,
      } as ApiResponse);
    } catch (error) {
      console.error("Error fetching supplier performance:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch supplier performance",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      } as ApiResponse);
    }
  }

  /**
   * GET /api/suppliers/:id/orders
   * Get detailed order history for a supplier
   * Requirements: 4.3, 4.4
   */
  async getSupplierOrderHistory(req: Request, res: Response): Promise<void> {
    try {
      const supplierId = parseInt(req.params.id);
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      if (isNaN(supplierId)) {
        res.status(400).json({
          success: false,
          error: "Invalid supplier ID",
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

      const offset = (page - 1) * limit;

      // Check cache first
      const cacheKey = `supplier_orders_${supplierId}_${page}_${limit}`;
      const cachedResponse = cache.get(cacheKey);

      if (cachedResponse) {
        res.json({
          success: true,
          data: cachedResponse,
        } as ApiResponse);
        return;
      }

      const orderHistory = await this.supplierService.getSupplierOrderHistory(
        supplierId,
        limit,
        offset
      );

      // Add pagination metadata
      const totalPages = Math.ceil(orderHistory.total_orders / limit);
      const response = {
        ...orderHistory,
        pagination: {
          page,
          limit,
          total: orderHistory.total_orders,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };

      // Cache the response for 5 minutes
      cache.set(cacheKey, response, 5 * 60 * 1000);

      res.json({
        success: true,
        data: response,
      } as ApiResponse);
    } catch (error) {
      console.error("Error fetching supplier order history:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch supplier order history",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      } as ApiResponse);
    }
  }

  /**
   * GET /api/suppliers/by-products
   * Get suppliers associated with specific products
   * Requirements: 4.1, 4.2
   */
  async getSuppliersForProducts(req: Request, res: Response): Promise<void> {
    try {
      const productIdsParam = req.query.product_ids as string;

      if (!productIdsParam) {
        res.status(400).json({
          success: false,
          error: "product_ids parameter is required",
        } as ApiResponse);
        return;
      }

      // Parse product IDs from comma-separated string
      const productIds = productIdsParam
        .split(",")
        .map((id) => parseInt(id.trim()))
        .filter((id) => !isNaN(id));

      if (productIds.length === 0) {
        res.status(400).json({
          success: false,
          error:
            "Invalid product_ids parameter. Must be comma-separated integers.",
        } as ApiResponse);
        return;
      }

      // Check cache first
      const cacheKey = `suppliers_by_products_${productIds.sort().join(",")}`;
      const cachedResponse = cache.get(cacheKey);

      if (cachedResponse) {
        res.json({
          success: true,
          data: cachedResponse,
        } as ApiResponse);
        return;
      }

      const suppliers = await this.supplierService.getSuppliersForProducts(
        productIds
      );

      const response = {
        suppliers,
        product_ids: productIds,
      };

      // Cache the response for 10 minutes
      cache.set(cacheKey, response, 10 * 60 * 1000);

      res.json({
        success: true,
        data: response,
      } as ApiResponse);
    } catch (error) {
      console.error("Error fetching suppliers for products:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch suppliers for products",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      } as ApiResponse);
    }
  }

  /**
   * GET /api/suppliers/performance-rankings
   * Get supplier performance rankings
   * Requirements: 4.3, 4.4
   */
  async getSupplierPerformanceRankings(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      if (isNaN(limit) || limit < 1 || limit > 50) {
        res.status(400).json({
          success: false,
          error: "Invalid limit parameter. Must be between 1 and 50.",
        } as ApiResponse);
        return;
      }

      // Check cache first
      const cacheKey = `supplier_rankings_${limit}`;
      const cachedResponse = cache.get(cacheKey);

      if (cachedResponse) {
        res.json({
          success: true,
          data: cachedResponse,
        } as ApiResponse);
        return;
      }

      const rankings =
        await this.supplierService.getSupplierPerformanceRankings(limit);

      const response = {
        rankings,
        total_ranked: rankings.length,
        last_updated: new Date().toISOString(),
      };

      // Cache the response for 15 minutes (rankings don't change frequently)
      cache.set(cacheKey, response, 15 * 60 * 1000);

      res.json({
        success: true,
        data: response,
      } as ApiResponse);
    } catch (error) {
      console.error("Error fetching supplier performance rankings:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch supplier performance rankings",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      } as ApiResponse);
    }
  }

  /**
   * GET /api/suppliers/recent-activity
   * Get suppliers with recent activity (orders in last N days)
   * Requirements: 4.3, 4.4
   */
  async getSuppliersWithRecentActivity(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;

      if (isNaN(days) || days < 1 || days > 365) {
        res.status(400).json({
          success: false,
          error: "Invalid days parameter. Must be between 1 and 365.",
        } as ApiResponse);
        return;
      }

      // Check cache first
      const cacheKey = `suppliers_recent_activity_${days}`;
      const cachedResponse = cache.get(cacheKey);

      if (cachedResponse) {
        res.json({
          success: true,
          data: cachedResponse,
        } as ApiResponse);
        return;
      }

      const suppliers =
        await this.supplierService.getSuppliersWithRecentActivity(days);

      const response = {
        suppliers,
        activity_period_days: days,
        total_active_suppliers: suppliers.length,
        last_updated: new Date().toISOString(),
      };

      // Cache the response for 5 minutes
      cache.set(cacheKey, response, 5 * 60 * 1000);

      res.json({
        success: true,
        data: response,
      } as ApiResponse);
    } catch (error) {
      console.error("Error fetching suppliers with recent activity:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch suppliers with recent activity",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      } as ApiResponse);
    }
  }
}
