import { Knex } from "knex";
import { BaseRepository } from "./BaseRepository";
import { Product, ProductInput, ProductUpdate, StockStatus } from "../types";

export class ProductRepository extends BaseRepository<
  Product,
  ProductInput,
  ProductUpdate
> {
  constructor() {
    super("products");
  }

  /**
   * Apply filters specific to products
   */
  protected applyFilters(
    query: Knex.QueryBuilder,
    filters: any
  ): Knex.QueryBuilder {
    if (filters.active !== undefined) {
      query = query.where("active", filters.active);
    }

    if (filters.category) {
      query = query.where("category", filters.category);
    }

    if (filters.price_min !== undefined) {
      query = query.where("sale_price", ">=", filters.price_min);
    }

    if (filters.price_max !== undefined) {
      query = query.where("sale_price", "<=", filters.price_max);
    }

    if (filters.search) {
      query = query.where((builder) => {
        builder
          .where("name", "ilike", `%${filters.search}%`)
          .orWhere("sku", "ilike", `%${filters.search}%`)
          .orWhere("description", "ilike", `%${filters.search}%`);
      });
    }

    return query;
  }

  /**
   * Apply search to product queries
   */
  protected applySearch(
    query: Knex.QueryBuilder,
    searchTerm: string
  ): Knex.QueryBuilder {
    return query.where((builder) => {
      builder
        .where("name", "ilike", `%${searchTerm}%`)
        .orWhere("sku", "ilike", `%${searchTerm}%`)
        .orWhere("description", "ilike", `%${searchTerm}%`);
    });
  }

  /**
   * Find product by SKU
   */
  async findBySku(sku: string): Promise<Product | null> {
    const result = await this.db(this.tableName).where("sku", sku).first();

    return result || null;
  }

  /**
   * Check if SKU exists
   */
  async skuExists(sku: string, excludeId?: number): Promise<boolean> {
    let query = this.db(this.tableName).where("sku", sku);

    if (excludeId) {
      query = query.where("id", "!=", excludeId);
    }

    const result = await query.first("id");
    return !!result;
  }

  /**
   * Get all unique categories
   */
  async getCategories(): Promise<string[]> {
    const results = await this.db(this.tableName)
      .distinct("category")
      .where("active", true)
      .orderBy("category", "asc");

    return results.map((row) => row.category);
  }

  /**
   * Get products with stock levels
   */
  async getProductsWithStockLevels(filters?: any): Promise<
    Array<
      Product & {
        total_stock: number;
        warehouse_count: number;
        stock_status: StockStatus;
        total_value: number;
      }
    >
  > {
    let query = this.db(this.tableName)
      .leftJoin(
        "product_locations",
        "products.id",
        "product_locations.product_id"
      )
      .where("products.active", true)
      .groupBy("products.id")
      .select(
        "products.*",
        this.db.raw(
          "COALESCE(SUM(product_locations.quantity_on_hand), 0) as total_stock"
        ),
        this.db.raw(
          "COUNT(DISTINCT CASE WHEN product_locations.quantity_on_hand > 0 THEN product_locations.location_id END) as warehouse_count"
        ),
        this.db.raw(
          "COALESCE(SUM(product_locations.quantity_on_hand * product_locations.unit_cost), 0) as total_value"
        )
      );

    // Apply filters
    if (filters) {
      if (filters.warehouse_id) {
        query = query.where(
          "product_locations.location_id",
          filters.warehouse_id
        );
      }

      if (filters.search) {
        query = query.where((builder) => {
          builder
            .where("products.name", "ilike", `%${filters.search}%`)
            .orWhere("products.sku", "ilike", `%${filters.search}%`);
        });
      }

      if (filters.category) {
        query = query.where("products.category", filters.category);
      }
    }

    const results = await query;

    // Add stock status calculation
    return results.map((product) => ({
      ...product,
      stock_status: this.calculateStockStatus(
        product.total_stock,
        product.reorder_point
      ),
    }));
  }

  /**
   * Get product with detailed stock breakdown
   */
  async getProductWithStockBreakdown(productId: number): Promise<
    | (Product & {
        stock_levels: Array<{
          warehouse_id: number;
          warehouse_name: string;
          warehouse_address?: string;
          quantity: number;
          unit_cost: number;
          reorder_point: number;
        }>;
        total_stock: number;
        stock_status: StockStatus;
      })
    | null
  > {
    const product = await this.findById(productId);
    if (!product) return null;

    const stockLevels = await this.db("product_locations")
      .join("locations", "product_locations.location_id", "locations.id")
      .where("product_locations.product_id", productId)
      .select(
        "locations.id as warehouse_id",
        "locations.name as warehouse_name",
        "locations.address as warehouse_address",
        "product_locations.quantity_on_hand as quantity",
        "product_locations.unit_cost",
        "product_locations.reorder_point"
      );

    const totalStock = stockLevels.reduce(
      (sum, level) => sum + level.quantity,
      0
    );
    const stockStatus = this.calculateStockStatus(
      totalStock,
      product.reorder_point
    );

    return {
      ...product,
      stock_levels: stockLevels,
      total_stock: totalStock,
      stock_status: stockStatus,
    };
  }

  /**
   * Get products by stock status
   */
  async getProductsByStockStatus(
    status: StockStatus,
    warehouseId?: number
  ): Promise<Product[]> {
    let query = this.db(this.tableName)
      .leftJoin(
        "product_locations",
        "products.id",
        "product_locations.product_id"
      )
      .where("products.active", true);

    if (warehouseId) {
      query = query.where("product_locations.location_id", warehouseId);
    }

    query = query
      .groupBy("products.id")
      .having(
        this.db.raw("COALESCE(SUM(product_locations.quantity_on_hand), 0)"),
        status === "out_of_stock" ? "=" : status === "low_stock" ? "<" : ">=",
        status === "out_of_stock" ? 0 : this.db.raw("products.reorder_point")
      );

    return query.select("products.*");
  }

  /**
   * Get low stock products (below reorder point)
   */
  async getLowStockProducts(warehouseId?: number): Promise<Product[]> {
    return this.getProductsByStockStatus("low_stock", warehouseId);
  }

  /**
   * Get out of stock products
   */
  async getOutOfStockProducts(warehouseId?: number): Promise<Product[]> {
    return this.getProductsByStockStatus("out_of_stock", warehouseId);
  }

  /**
   * Get products for reorder suggestions
   */
  async getProductsForReorderSuggestions(warehouseId?: number): Promise<
    Array<
      Product & {
        current_stock: number;
        suggested_quantity: number;
        urgency_score: number;
      }
    >
  > {
    let query = this.db(this.tableName)
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

    const results = await query
      .groupBy("products.id")
      .having(
        this.db.raw("COALESCE(SUM(product_locations.quantity_on_hand), 0)"),
        "<=",
        this.db.raw("products.reorder_point * 1.1")
      )
      .select(
        "products.*",
        this.db.raw(
          "COALESCE(SUM(product_locations.quantity_on_hand), 0) as current_stock"
        )
      );

    return results.map((product) => ({
      ...product,
      suggested_quantity: Math.max(
        1,
        product.reorder_point * 2 - product.current_stock
      ),
      urgency_score: product.current_stock / product.reorder_point,
    }));
  }

  /**
   * Update product inline field
   */
  async updateInlineField(
    productId: number,
    field: "sale_price" | "cost_price" | "category" | "reorder_point",
    value: any
  ): Promise<Product | null> {
    const updateData: any = {
      [field]: value,
      updated_at: new Date(),
    };

    const [result] = await this.db(this.tableName)
      .where("id", productId)
      .update(updateData)
      .returning("*");

    return result || null;
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
}
