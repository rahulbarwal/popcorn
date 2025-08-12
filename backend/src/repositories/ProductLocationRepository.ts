import { Knex } from "knex";
import { BaseRepository } from "./BaseRepository";
import {
  ProductLocation,
  ProductLocationInput,
  ProductLocationUpdate,
} from "../types";

export class ProductLocationRepository extends BaseRepository<
  ProductLocation,
  ProductLocationInput,
  ProductLocationUpdate
> {
  constructor() {
    super("product_locations");
  }

  /**
   * Apply filters specific to product locations
   */
  protected applyFilters(
    query: Knex.QueryBuilder,
    filters: any
  ): Knex.QueryBuilder {
    if (filters.product_id) {
      query = query.where("product_id", filters.product_id);
    }

    if (filters.location_id) {
      query = query.where("location_id", filters.location_id);
    }

    if (filters.product_variant_id) {
      query = query.where("product_variant_id", filters.product_variant_id);
    }

    if (filters.min_quantity !== undefined) {
      query = query.where("quantity_on_hand", ">=", filters.min_quantity);
    }

    if (filters.max_quantity !== undefined) {
      query = query.where("quantity_on_hand", "<=", filters.max_quantity);
    }

    return query;
  }

  /**
   * Find product location by product and location
   */
  async findByProductAndLocation(
    productId: number,
    locationId: number,
    variantId?: number
  ): Promise<ProductLocation | null> {
    let query = this.db(this.tableName)
      .where("product_id", productId)
      .where("location_id", locationId);

    if (variantId) {
      query = query.where("product_variant_id", variantId);
    } else {
      query = query.whereNull("product_variant_id");
    }

    const result = await query.first();
    return result || null;
  }

  /**
   * Get stock levels for a product across all locations
   */
  async getStockLevelsByProduct(productId: number): Promise<
    Array<
      ProductLocation & {
        location_name: string;
        location_address?: string;
      }
    >
  > {
    return this.db(this.tableName)
      .join("locations", "product_locations.location_id", "locations.id")
      .where("product_locations.product_id", productId)
      .select(
        "product_locations.*",
        "locations.name as location_name",
        "locations.address as location_address"
      );
  }

  /**
   * Get stock levels for a location
   */
  async getStockLevelsByLocation(locationId: number): Promise<
    Array<
      ProductLocation & {
        product_name: string;
        product_sku: string;
        product_category: string;
      }
    >
  > {
    return this.db(this.tableName)
      .join("products", "product_locations.product_id", "products.id")
      .where("product_locations.location_id", locationId)
      .where("products.active", true)
      .select(
        "product_locations.*",
        "products.name as product_name",
        "products.sku as product_sku",
        "products.category as product_category"
      );
  }

  /**
   * Update stock quantity
   */
  async updateStockQuantity(
    productId: number,
    locationId: number,
    quantityChange: number,
    variantId?: number
  ): Promise<ProductLocation | null> {
    const existing = await this.findByProductAndLocation(
      productId,
      locationId,
      variantId
    );

    if (!existing) {
      throw new Error("Product location record not found");
    }

    const newQuantity = existing.quantity_on_hand + quantityChange;
    const newAvailable = Math.max(0, newQuantity - existing.quantity_reserved);

    const [result] = await this.db(this.tableName)
      .where("id", existing.id)
      .update({
        quantity_on_hand: newQuantity,
        quantity_available: newAvailable,
        last_updated: new Date(),
        updated_at: new Date(),
      })
      .returning("*");

    return result || null;
  }

  /**
   * Reserve stock quantity
   */
  async reserveStock(
    productId: number,
    locationId: number,
    quantity: number,
    variantId?: number
  ): Promise<ProductLocation | null> {
    const existing = await this.findByProductAndLocation(
      productId,
      locationId,
      variantId
    );

    if (!existing) {
      throw new Error("Product location record not found");
    }

    if (existing.quantity_available < quantity) {
      throw new Error("Insufficient available stock");
    }

    const newReserved = existing.quantity_reserved + quantity;
    const newAvailable = existing.quantity_on_hand - newReserved;

    const [result] = await this.db(this.tableName)
      .where("id", existing.id)
      .update({
        quantity_reserved: newReserved,
        quantity_available: newAvailable,
        last_updated: new Date(),
        updated_at: new Date(),
      })
      .returning("*");

    return result || null;
  }

  /**
   * Release reserved stock
   */
  async releaseReservedStock(
    productId: number,
    locationId: number,
    quantity: number,
    variantId?: number
  ): Promise<ProductLocation | null> {
    const existing = await this.findByProductAndLocation(
      productId,
      locationId,
      variantId
    );

    if (!existing) {
      throw new Error("Product location record not found");
    }

    const newReserved = Math.max(0, existing.quantity_reserved - quantity);
    const newAvailable = existing.quantity_on_hand - newReserved;

    const [result] = await this.db(this.tableName)
      .where("id", existing.id)
      .update({
        quantity_reserved: newReserved,
        quantity_available: newAvailable,
        last_updated: new Date(),
        updated_at: new Date(),
      })
      .returning("*");

    return result || null;
  }

  /**
   * Create or update product location
   */
  async createOrUpdate(data: ProductLocationInput): Promise<ProductLocation> {
    const existing = await this.findByProductAndLocation(
      data.product_id,
      data.location_id,
      data.product_variant_id
    );

    if (existing) {
      return this.update(existing.id, data) as Promise<ProductLocation>;
    } else {
      return this.create({
        ...data,
        quantity_available:
          data.quantity_on_hand - (data.quantity_reserved || 0),
      });
    }
  }

  /**
   * Get total stock value by location
   */
  async getTotalStockValueByLocation(locationId: number): Promise<number> {
    const result = await this.db(this.tableName)
      .where("location_id", locationId)
      .sum("quantity_on_hand * unit_cost as total_value")
      .first();

    return parseFloat(result?.total_value || "0");
  }

  /**
   * Get total stock value across all locations
   */
  async getTotalStockValue(warehouseId?: number): Promise<number> {
    let query = this.db(this.tableName);

    if (warehouseId) {
      query = query.where("location_id", warehouseId);
    }

    const result = await query
      .sum("quantity_on_hand * unit_cost as total_value")
      .first();

    return parseFloat(result?.total_value || "0");
  }

  /**
   * Get low stock items across locations
   */
  async getLowStockItems(locationId?: number): Promise<
    Array<
      ProductLocation & {
        product_name: string;
        product_sku: string;
        location_name: string;
      }
    >
  > {
    let query = this.db(this.tableName)
      .join("products", "product_locations.product_id", "products.id")
      .join("locations", "product_locations.location_id", "locations.id")
      .where("products.active", true)
      .whereRaw(
        "product_locations.quantity_on_hand < product_locations.reorder_point"
      );

    if (locationId) {
      query = query.where("product_locations.location_id", locationId);
    }

    return query.select(
      "product_locations.*",
      "products.name as product_name",
      "products.sku as product_sku",
      "locations.name as location_name"
    );
  }

  /**
   * Bulk update stock levels for product creation
   */
  async bulkCreateForProduct(
    productId: number,
    warehouseStock: Array<{
      warehouse_id: number;
      initial_quantity: number;
      unit_cost: number;
    }>
  ): Promise<ProductLocation[]> {
    const stockRecords = warehouseStock.map((stock) => ({
      product_id: productId,
      location_id: stock.warehouse_id,
      quantity_on_hand: stock.initial_quantity,
      quantity_reserved: 0,
      quantity_available: stock.initial_quantity,
      unit_cost: stock.unit_cost,
      reorder_point: 0,
    }));

    return this.bulkCreate(stockRecords);
  }
}
