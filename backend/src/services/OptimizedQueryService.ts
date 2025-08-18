import {
  cacheService,
  CacheService,
  CACHE_KEYS,
  CACHE_TTL,
} from "../utils/cache";
import db from "../config/database";
import { Knex } from "knex";

export interface QueryCacheOptions {
  ttl?: number;
  useCache?: boolean;
  invalidatePattern?: string;
}

export class OptimizedQueryService {
  private cache: CacheService;

  constructor() {
    this.cache = cacheService;
  }

  /**
   * Execute a cached query with automatic cache management
   */
  async cachedQuery<T>(
    cacheKey: string,
    queryFn: () => Promise<T>,
    options: QueryCacheOptions = {}
  ): Promise<T> {
    const { ttl = CACHE_TTL.MEDIUM, useCache = true } = options;

    // If caching is disabled or cache is not available, execute query directly
    if (!useCache || !this.cache.isAvailable()) {
      return await queryFn();
    }

    // Try to get from cache first
    const cachedResult = await this.cache.get<T>(cacheKey);
    if (cachedResult !== null) {
      return cachedResult;
    }

    // Execute query and cache result
    const result = await queryFn();
    await this.cache.set(cacheKey, result, ttl);

    return result;
  }

  /**
   * Optimized summary metrics query with caching
   */
  async getSummaryMetrics(warehouseId?: number): Promise<any> {
    const cacheKey = CacheService.generateKey(
      CACHE_KEYS.SUMMARY_METRICS,
      warehouseId || "all"
    );

    return this.cachedQuery(
      cacheKey,
      async () => {
        // Use a single optimized query to get all metrics
        const warehouseFilter = warehouseId ? "AND pl.location_id = ?" : "";
        const params = warehouseId ? [warehouseId] : [];

        const query = `
          WITH product_stats AS (
            SELECT 
              COUNT(DISTINCT p.id) as total_products,
              COUNT(DISTINCT CASE 
                WHEN COALESCE(SUM(pl.quantity_on_hand), 0) < p.reorder_point 
                AND COALESCE(SUM(pl.quantity_on_hand), 0) > 0 
                AND p.reorder_point > 0
                THEN p.id 
              END) as low_stock_count,
              COUNT(DISTINCT CASE 
                WHEN COALESCE(SUM(pl.quantity_on_hand), 0) = 0 
                THEN p.id 
              END) as out_of_stock_count,
              COALESCE(SUM(pl.quantity_on_hand * pl.unit_cost), 0) as total_stock_value,
              COUNT(DISTINCT CASE 
                WHEN pl.unit_cost IS NULL OR pl.unit_cost <= 0 
                THEN p.id 
              END) as excluded_products
            FROM products p
            LEFT JOIN product_locations pl ON p.id = pl.product_id ${warehouseFilter}
            WHERE p.active = true
            GROUP BY p.id, p.reorder_point
          ),
          supplier_stats AS (
            SELECT COUNT(*) as suppliers_count
            FROM companies 
            WHERE active = true
          )
          SELECT 
            (SELECT total_products FROM product_stats) as total_products,
            (SELECT low_stock_count FROM product_stats) as low_stock_count,
            (SELECT out_of_stock_count FROM product_stats) as out_of_stock_count,
            (SELECT total_stock_value FROM product_stats) as total_stock_value,
            (SELECT excluded_products FROM product_stats) as excluded_products,
            (SELECT suppliers_count FROM supplier_stats) as suppliers_count
        `;

        const result = await db.raw(query, params);
        return result.rows ? result.rows[0] : result[0];
      },
      { ttl: CACHE_TTL.MEDIUM }
    );
  }

  /**
   * Optimized stock levels query with pagination and caching
   */
  async getStockLevels(filters: any = {}, pagination?: any): Promise<any> {
    const cacheKey = CacheService.generateKey(
      CACHE_KEYS.STOCK_LEVELS,
      JSON.stringify(filters),
      JSON.stringify(pagination)
    );

    return this.cachedQuery(
      cacheKey,
      async () => {
        // Build optimized query with proper indexing
        let query = db
          .select([
            "p.id",
            "p.sku",
            "p.name",
            "p.category",
            "p.image_url",
            "p.reorder_point",
            db.raw("COALESCE(SUM(pl.quantity_on_hand), 0) as total_quantity"),
            db.raw(
              "COALESCE(AVG(pl.unit_cost), p.cost_price) as avg_unit_cost"
            ),
            db.raw(
              "COALESCE(SUM(pl.quantity_on_hand * pl.unit_cost), 0) as total_value"
            ),
          ])
          .from("products as p")
          .leftJoin("product_locations as pl", "p.id", "pl.product_id")
          .where("p.active", true)
          .groupBy([
            "p.id",
            "p.sku",
            "p.name",
            "p.category",
            "p.image_url",
            "p.reorder_point",
            "p.cost_price",
          ]);

        // Apply filters
        if (filters.warehouse_id) {
          query = query.where("pl.location_id", filters.warehouse_id);
        }

        if (filters.search) {
          const searchTerm = `%${filters.search}%`;
          query = query.where(function () {
            this.whereILike("p.name", searchTerm)
              .orWhereILike("p.sku", searchTerm)
              .orWhereILike("p.category", searchTerm);
          });
        }

        if (filters.category) {
          query = query.where("p.category", filters.category);
        }

        // Apply stock filter using HAVING clause
        if (filters.stock_filter === "out_of_stock") {
          query = query.havingRaw("COALESCE(SUM(pl.quantity_on_hand), 0) = 0");
        } else if (filters.stock_filter === "low_stock") {
          query = query.havingRaw(
            "COALESCE(SUM(pl.quantity_on_hand), 0) < p.reorder_point AND COALESCE(SUM(pl.quantity_on_hand), 0) > 0 AND p.reorder_point > 0"
          );
        }

        // Apply pagination
        if (pagination) {
          const offset =
            ((pagination.page || 1) - 1) * (pagination.limit || 50);
          query = query.limit(pagination.limit || 50).offset(offset);
        }

        // Order by name for consistent results
        query = query.orderBy("p.name");

        return await query;
      },
      { ttl: CACHE_TTL.SHORT }
    );
  }

  /**
   * Optimized warehouse distribution query with caching
   */
  async getWarehouseDistribution(filters: any = {}): Promise<any> {
    const cacheKey = CacheService.generateKey(
      CACHE_KEYS.WAREHOUSE_DISTRIBUTION,
      JSON.stringify(filters)
    );

    return this.cachedQuery(
      cacheKey,
      async () => {
        let query = db
          .select([
            "l.id as warehouse_id",
            "l.name as warehouse_name",
            "l.address as warehouse_address",
            db.raw("COUNT(DISTINCT p.id) as total_products"),
            db.raw(
              "COALESCE(SUM(pl.quantity_on_hand * pl.unit_cost), 0) as total_value"
            ),
          ])
          .from("locations as l")
          .leftJoin("product_locations as pl", "l.id", "pl.location_id")
          .leftJoin("products as p", function () {
            this.on("pl.product_id", "p.id")
              .andOn("p.active", db.raw("true"))
              .andOn("pl.quantity_on_hand", ">", db.raw("0"));
          })
          .where("l.active", true)
          .groupBy(["l.id", "l.name", "l.address"]);

        // Apply filters
        if (filters.warehouse_id) {
          query = query.where("l.id", filters.warehouse_id);
        }

        if (filters.category) {
          query = query.where("p.category", filters.category);
        }

        if (filters.min_value) {
          query = query.havingRaw(
            "COALESCE(SUM(pl.quantity_on_hand * pl.unit_cost), 0) >= ?",
            [filters.min_value]
          );
        }

        query = query.orderBy("l.name");

        return await query;
      },
      { ttl: CACHE_TTL.MEDIUM }
    );
  }

  /**
   * Optimized recent purchases query with caching
   */
  async getRecentPurchases(
    warehouseId?: number,
    limit: number = 10
  ): Promise<any> {
    const cacheKey = CacheService.generateKey(
      CACHE_KEYS.RECENT_PURCHASES,
      warehouseId || "all",
      limit
    );

    return this.cachedQuery(
      cacheKey,
      async () => {
        let query = db
          .select([
            "po.id",
            "po.po_number",
            "po.order_date",
            "po.expected_delivery_date",
            "po.status",
            "po.total_amount",
            "c.id as supplier_id",
            "c.name as supplier_name",
            db.raw("COUNT(pop.product_id) as product_count"),
          ])
          .from("purchase_orders as po")
          .join("companies as c", "po.supplier_id", "c.id")
          .leftJoin(
            "purchase_order_products as pop",
            "po.id",
            "pop.purchase_order_id"
          )
          .groupBy([
            "po.id",
            "po.po_number",
            "po.order_date",
            "po.expected_delivery_date",
            "po.status",
            "po.total_amount",
            "c.id",
            "c.name",
          ])
          .orderBy("po.order_date", "desc")
          .limit(limit);

        // If warehouse filtering is needed, we'd need to join through product_locations
        // For now, we'll return all recent purchases as the warehouse filter
        // is more relevant for inventory-specific queries

        return await query;
      },
      { ttl: CACHE_TTL.SHORT }
    );
  }

  /**
   * Optimized stock visualization data query with caching
   */
  async getStockVisualizationData(warehouseId?: number): Promise<any> {
    const cacheKey = CacheService.generateKey(
      CACHE_KEYS.STOCK_VISUALIZATION,
      warehouseId || "all"
    );

    return this.cachedQuery(
      cacheKey,
      async () => {
        let query = db
          .select([
            "p.id as product_id",
            "p.name as product_name",
            "p.sku",
            "l.id as warehouse_id",
            "l.name as warehouse_name",
            "pl.quantity_on_hand as quantity",
          ])
          .from("products as p")
          .join("product_locations as pl", "p.id", "pl.product_id")
          .join("locations as l", "pl.location_id", "l.id")
          .where("p.active", true)
          .where("l.active", true)
          .where("pl.quantity_on_hand", ">", 0);

        if (warehouseId) {
          query = query.where("l.id", warehouseId);
        }

        query = query.orderBy(["p.name", "l.name"]);

        const results = await query;

        // Group by product for chart data structure
        const productMap = new Map();

        for (const row of results) {
          if (!productMap.has(row.product_id)) {
            productMap.set(row.product_id, {
              product_id: row.product_id,
              product_name: row.product_name,
              sku: row.sku,
              warehouses: [],
            });
          }

          const product = productMap.get(row.product_id);
          product.warehouses.push({
            warehouse_id: row.warehouse_id,
            warehouse_name: row.warehouse_name,
            quantity: parseInt(row.quantity),
          });
        }

        return Array.from(productMap.values());
      },
      { ttl: CACHE_TTL.MEDIUM }
    );
  }

  /**
   * Invalidate cache for specific patterns
   */
  async invalidateCache(patterns: string[]): Promise<void> {
    if (!this.cache.isAvailable()) {
      return;
    }

    for (const pattern of patterns) {
      await this.cache.invalidatePattern(`inventory_dashboard:${pattern}:*`);
    }
  }

  /**
   * Invalidate all dashboard caches
   */
  async invalidateAllDashboardCaches(): Promise<void> {
    await this.invalidateCache([
      CACHE_KEYS.SUMMARY_METRICS,
      CACHE_KEYS.STOCK_LEVELS,
      CACHE_KEYS.WAREHOUSE_DISTRIBUTION,
      CACHE_KEYS.RECENT_PURCHASES,
      CACHE_KEYS.STOCK_VISUALIZATION,
    ]);
  }

  /**
   * Warm up cache with common queries
   */
  async warmUpCache(): Promise<void> {
    console.log("🔥 Warming up cache...");

    try {
      // Warm up summary metrics for all warehouses
      await this.getSummaryMetrics();

      // Warm up stock levels with common filters
      await this.getStockLevels({ stock_filter: "all" });
      await this.getStockLevels({ stock_filter: "low_stock" });
      await this.getStockLevels({ stock_filter: "out_of_stock" });

      // Warm up warehouse distribution
      await this.getWarehouseDistribution();

      // Warm up recent purchases
      await this.getRecentPurchases();

      // Warm up stock visualization
      await this.getStockVisualizationData();

      console.log("✅ Cache warm-up completed");
    } catch (error) {
      console.error("❌ Cache warm-up failed:", error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<any> {
    return await this.cache.getStats();
  }
}
