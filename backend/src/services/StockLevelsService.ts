import { ProductRepository } from "../repositories/ProductRepository";
import { ProductLocationRepository } from "../repositories/ProductLocationRepository";
import { LocationRepository } from "../repositories/LocationRepository";
import {
  StockLevelItem,
  StockLevelsResponse,
  PaginationParams,
  PaginationMeta,
  StockStatus,
  StockFilter,
} from "../types";

export interface StockLevelsFilters {
  warehouse_id?: number;
  stock_filter?: StockFilter;
  search?: string;
  category?: string;
}

export class StockLevelsService {
  private productRepository: ProductRepository;
  private productLocationRepository: ProductLocationRepository;
  private locationRepository: LocationRepository;

  constructor() {
    this.productRepository = new ProductRepository();
    this.productLocationRepository = new ProductLocationRepository();
    this.locationRepository = new LocationRepository();
  }

  /**
   * Get stock levels with aggregation across locations and variants
   */
  async getStockLevels(
    filters: StockLevelsFilters = {},
    pagination?: PaginationParams
  ): Promise<StockLevelsResponse> {
    const products = await this.getAggregatedStockLevels(filters, pagination);

    // Get pagination metadata if pagination is requested
    let paginationMeta: PaginationMeta | undefined;
    if (pagination) {
      const total = await this.countFilteredProducts(filters);
      paginationMeta = this.calculatePaginationMeta(pagination, total);
    }

    return {
      products,
      filters: {
        warehouse_id: filters.warehouse_id,
        stock_filter: filters.stock_filter || "all",
        search: filters.search,
        category: filters.category,
      },
      pagination: paginationMeta,
    };
  }

  /**
   * Get aggregated stock levels using raw SQL to avoid protected db access
   */
  private async getAggregatedStockLevels(
    filters: StockLevelsFilters,
    pagination?: PaginationParams
  ): Promise<StockLevelItem[]> {
    // Build parameters array for the query
    const params: any[] = [];
    let whereClause = "WHERE p.active = true";

    if (filters.warehouse_id) {
      whereClause += " AND pl.location_id = ?";
      params.push(filters.warehouse_id);
    }

    if (filters.search) {
      whereClause +=
        " AND (p.name ILIKE ? OR p.sku ILIKE ? OR p.category ILIKE ?)";
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters.category) {
      whereClause += " AND p.category = ?";
      params.push(filters.category);
    }

    let havingClause = "";
    if (filters.stock_filter === "out_of_stock") {
      havingClause = "HAVING COALESCE(SUM(pl.quantity_on_hand), 0) = 0";
    } else if (filters.stock_filter === "low_stock") {
      havingClause =
        "HAVING COALESCE(SUM(pl.quantity_on_hand), 0) < p.reorder_point AND COALESCE(SUM(pl.quantity_on_hand), 0) > 0";
    }

    let limitClause = "";
    if (pagination) {
      const offset = ((pagination.page || 1) - 1) * (pagination.limit || 50);
      limitClause = `LIMIT ${pagination.limit || 50} OFFSET ${offset}`;
    }

    const query = `
      SELECT 
        p.id,
        p.sku,
        p.name,
        p.category,
        p.image_url,
        p.reorder_point,
        COALESCE(SUM(pl.quantity_on_hand), 0) as total_quantity,
        COALESCE(AVG(pl.unit_cost), p.cost_price) as avg_unit_cost,
        COALESCE(SUM(pl.quantity_on_hand * pl.unit_cost), 0) as total_value
      FROM products p
      LEFT JOIN product_locations pl ON p.id = pl.product_id
      LEFT JOIN locations l ON pl.location_id = l.id
      ${whereClause}
      GROUP BY p.id, p.sku, p.name, p.category, p.image_url, p.reorder_point, p.cost_price
      ${havingClause}
      ORDER BY p.name
      ${limitClause}
    `;

    const result = await this.productRepository.raw(query, params);
    const products = result.rows || result;

    // Get location breakdown for each product and build response
    const stockLevelItems: StockLevelItem[] = [];

    for (const product of products) {
      const locations = await this.getProductLocationBreakdown(
        product.id,
        filters.warehouse_id
      );

      const stockStatus = this.calculateStockStatus(
        parseInt(product.total_quantity),
        product.reorder_point
      );

      stockLevelItems.push({
        id: product.id,
        sku: product.sku,
        name: product.name,
        category: product.category,
        image_url: product.image_url,
        total_quantity: parseInt(product.total_quantity),
        unit_cost: parseFloat(product.avg_unit_cost),
        total_value: parseFloat(product.total_value),
        reorder_point: product.reorder_point,
        stock_status: stockStatus,
        locations,
      });
    }

    return stockLevelItems;
  }

  /**
   * Get location breakdown for a specific product using raw SQL
   */
  private async getProductLocationBreakdown(
    productId: number,
    warehouseFilter?: number
  ): Promise<StockLevelItem["locations"]> {
    const params = [productId];
    let whereClause = "WHERE pl.product_id = ? AND pl.quantity_on_hand > 0";

    if (warehouseFilter) {
      whereClause += " AND pl.location_id = ?";
      params.push(warehouseFilter);
    }

    const query = `
      SELECT 
        l.id as location_id,
        l.name as location_name,
        pl.quantity_on_hand as quantity,
        pl.unit_cost
      FROM product_locations pl
      JOIN locations l ON pl.location_id = l.id
      ${whereClause}
      ORDER BY l.name
    `;

    const result = await this.productRepository.raw(query, params);
    const locations = result.rows || result;

    return locations.map((location: any) => ({
      location_id: location.location_id,
      location_name: location.location_name,
      quantity: parseInt(location.quantity),
      unit_cost: parseFloat(location.unit_cost),
    }));
  }

  /**
   * Count filtered products for pagination using raw SQL
   */
  private async countFilteredProducts(
    filters: StockLevelsFilters
  ): Promise<number> {
    const params: any[] = [];
    let whereClause = "WHERE p.active = true";

    if (filters.warehouse_id) {
      whereClause += " AND pl.location_id = ?";
      params.push(filters.warehouse_id);
    }

    if (filters.search) {
      whereClause +=
        " AND (p.name ILIKE ? OR p.sku ILIKE ? OR p.category ILIKE ?)";
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters.category) {
      whereClause += " AND p.category = ?";
      params.push(filters.category);
    }

    let havingClause = "";
    if (filters.stock_filter === "out_of_stock") {
      havingClause = "HAVING COALESCE(SUM(pl.quantity_on_hand), 0) = 0";
    } else if (filters.stock_filter === "low_stock") {
      havingClause =
        "HAVING COALESCE(SUM(pl.quantity_on_hand), 0) < p.reorder_point AND COALESCE(SUM(pl.quantity_on_hand), 0) > 0";
    }

    const query = `
      SELECT COUNT(*) as total
      FROM (
        SELECT p.id
        FROM products p
        LEFT JOIN product_locations pl ON p.id = pl.product_id
        ${whereClause}
        GROUP BY p.id, p.reorder_point
        ${havingClause}
      ) as filtered_products
    `;

    const result = await this.productRepository.raw(query, params);
    const countResult = result.rows ? result.rows[0] : result[0];

    return parseInt(countResult?.total || "0");
  }

  /**
   * Calculate stock status based on quantity and reorder point
   */
  private calculateStockStatus(
    quantity: number,
    reorderPoint: number
  ): StockStatus {
    if (quantity === 0) return "out_of_stock";
    if (quantity < reorderPoint) return "low_stock";
    return "adequate";
  }

  /**
   * Calculate pagination metadata
   */
  private calculatePaginationMeta(
    pagination: PaginationParams,
    total: number
  ): PaginationMeta {
    const page = pagination.page || 1;
    const limit = pagination.limit || 50;
    const totalPages = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  /**
   * Get products by stock status for filtering
   */
  async getProductsByStockStatus(
    status: StockFilter,
    warehouseId?: number
  ): Promise<StockLevelItem[]> {
    return this.getAggregatedStockLevels({
      stock_filter: status,
      warehouse_id: warehouseId,
    });
  }

  /**
   * Get low stock products with detailed information
   */
  async getLowStockProducts(warehouseId?: number): Promise<StockLevelItem[]> {
    return this.getProductsByStockStatus("low_stock", warehouseId);
  }

  /**
   * Get out of stock products with detailed information
   */
  async getOutOfStockProducts(warehouseId?: number): Promise<StockLevelItem[]> {
    return this.getProductsByStockStatus("out_of_stock", warehouseId);
  }

  /**
   * Get stock levels for a specific product across all locations
   */
  async getProductStockLevels(
    productId: number
  ): Promise<StockLevelItem | null> {
    const stockLevels = await this.getAggregatedStockLevels({
      warehouse_id: undefined,
    });

    return stockLevels.find((item) => item.id === productId) || null;
  }

  /**
   * Search products by name or SKU
   */
  async searchProducts(
    searchTerm: string,
    filters: Omit<StockLevelsFilters, "search"> = {},
    pagination?: PaginationParams
  ): Promise<StockLevelsResponse> {
    return this.getStockLevels({ ...filters, search: searchTerm }, pagination);
  }
}
