import { ProductRepository } from "../repositories/ProductRepository";
import { ProductLocationRepository } from "../repositories/ProductLocationRepository";
import { CompanyRepository } from "../repositories/CompanyRepository";
import { OptimizedQueryService } from "./OptimizedQueryService";
import { SummaryMetrics } from "../types";

export class SummaryMetricsService {
  private productRepository: ProductRepository;
  private productLocationRepository: ProductLocationRepository;
  private companyRepository: CompanyRepository;
  private optimizedQueryService: OptimizedQueryService;

  constructor() {
    this.productRepository = new ProductRepository();
    this.productLocationRepository = new ProductLocationRepository();
    this.companyRepository = new CompanyRepository();
    this.optimizedQueryService = new OptimizedQueryService();
  }

  /**
   * Calculate all summary metrics for the dashboard using optimized queries
   */
  async calculateSummaryMetrics(warehouseId?: number): Promise<SummaryMetrics> {
    // Use optimized query service for better performance
    const metrics = await this.optimizedQueryService.getSummaryMetrics(
      warehouseId
    );

    const totalProducts = parseInt(metrics.total_products || "0");
    const lowStockCount = parseInt(metrics.low_stock_count || "0");
    const outOfStockCount = parseInt(metrics.out_of_stock_count || "0");
    const suppliersCount = parseInt(metrics.suppliers_count || "0");
    const totalStockValue = parseFloat(metrics.total_stock_value || "0");
    const excludedProducts = parseInt(metrics.excluded_products || "0");

    return {
      total_products: {
        value: totalProducts,
        status: this.getProductCountStatus(totalProducts),
      },
      low_stock: {
        value: lowStockCount,
        status: this.getLowStockStatus(lowStockCount),
        threshold: 50, // Configurable threshold for warning
      },
      out_of_stock: {
        value: outOfStockCount,
        status: this.getOutOfStockStatus(outOfStockCount),
      },
      suppliers: {
        value: suppliersCount,
        status: this.getSuppliersStatus(suppliersCount),
      },
      total_stock_value: {
        value: totalStockValue,
        currency: "USD",
        status: this.getStockValueStatus(totalStockValue),
        excluded_products: excludedProducts,
      },
    };
  }

  /**
   * Get total count of active products
   */
  private async getTotalProductsCount(warehouseId?: number): Promise<number> {
    if (warehouseId) {
      // Count products that have stock in the specific warehouse
      const result = await this.productRepository
        .query()
        .join(
          "product_locations",
          "products.id",
          "product_locations.product_id"
        )
        .where("products.active", true)
        .where("product_locations.location_id", warehouseId)
        .countDistinct("products.id as count")
        .first();

      return parseInt(result?.count as string) || 0;
    }

    // Count all active products
    return this.productRepository.count({ active: true });
  }

  /**
   * Get count of products below reorder point
   */
  private async getLowStockCount(warehouseId?: number): Promise<number> {
    let query = this.productRepository
      .query()
      .leftJoin(
        "product_locations",
        "products.id",
        "product_locations.product_id"
      )
      .where("products.active", true)
      .where("products.reorder_point", ">", 0);

    if (warehouseId) {
      query = query.where("product_locations.location_id", warehouseId);
    }

    const result = await query
      .groupBy("products.id")
      .havingRaw(
        "COALESCE(SUM(product_locations.quantity_on_hand), 0) < products.reorder_point"
      )
      .havingRaw("COALESCE(SUM(product_locations.quantity_on_hand), 0) > 0")
      .count("products.id as count")
      .first();

    return parseInt(result?.count as string) || 0;
  }

  /**
   * Get count of products with zero quantity across all locations
   */
  private async getOutOfStockCount(warehouseId?: number): Promise<number> {
    let query = this.productRepository
      .query()
      .leftJoin(
        "product_locations",
        "products.id",
        "product_locations.product_id"
      )
      .where("products.active", true);

    if (warehouseId) {
      query = query.where("product_locations.location_id", warehouseId);
    }

    const result = await query
      .groupBy("products.id")
      .havingRaw("COALESCE(SUM(product_locations.quantity_on_hand), 0) = 0")
      .count("products.id as count")
      .first();

    return parseInt(result?.count as string) || 0;
  }

  /**
   * Get count of active suppliers
   */
  private async getSuppliersCount(): Promise<number> {
    return this.companyRepository.count({ active: true });
  }

  /**
   * Calculate total stock value using Σ(unit_cost × quantity) formula
   */
  private async getTotalStockValue(
    warehouseId?: number
  ): Promise<{ value: number; excludedProducts: number }> {
    let query = this.productLocationRepository.query();

    if (warehouseId) {
      query = query.where("location_id", warehouseId);
    }

    // Get total value and count of products with unit_cost
    const valueResult = await query
      .whereNotNull("unit_cost")
      .where("unit_cost", ">", 0)
      .sum("quantity_on_hand * unit_cost as total_value")
      .first();

    // Count products without unit_cost (excluded from calculation)
    let excludedQuery = this.productLocationRepository
      .query()
      .join("products", "product_locations.product_id", "products.id")
      .where("products.active", true)
      .where((builder) => {
        builder.whereNull("unit_cost").orWhere("unit_cost", "<=", 0);
      });

    if (warehouseId) {
      excludedQuery = excludedQuery.where("location_id", warehouseId);
    }

    const excludedResult = await excludedQuery
      .countDistinct("products.id as count")
      .first();

    return {
      value: parseFloat(valueResult?.total_value as string) || 0,
      excludedProducts: parseInt(excludedResult?.count as string) || 0,
    };
  }

  /**
   * Determine status for total products count
   */
  private getProductCountStatus(
    count: number
  ): "normal" | "warning" | "critical" {
    // These thresholds can be made configurable
    if (count === 0) return "critical";
    if (count < 10) return "warning";
    return "normal";
  }

  /**
   * Determine status for low stock count
   */
  private getLowStockStatus(count: number): "normal" | "warning" | "critical" {
    if (count === 0) return "normal";
    if (count >= 50) return "critical";
    if (count >= 20) return "warning";
    return "normal";
  }

  /**
   * Determine status for out of stock count
   */
  private getOutOfStockStatus(
    count: number
  ): "normal" | "warning" | "critical" {
    if (count === 0) return "normal";
    if (count >= 10) return "critical";
    if (count >= 5) return "warning";
    return "normal";
  }

  /**
   * Determine status for suppliers count
   */
  private getSuppliersStatus(count: number): "normal" | "warning" | "critical" {
    if (count === 0) return "critical";
    if (count < 5) return "warning";
    return "normal";
  }

  /**
   * Determine status for total stock value
   */
  private getStockValueStatus(
    value: number
  ): "normal" | "warning" | "critical" {
    // These thresholds can be made configurable based on business needs
    if (value === 0) return "critical";
    if (value < 10000) return "warning";
    return "normal";
  }
}
