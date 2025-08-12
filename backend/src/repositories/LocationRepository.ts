import { Knex } from "knex";
import { BaseRepository } from "./BaseRepository";
import { Location, LocationInput, LocationUpdate } from "../types";

export class LocationRepository extends BaseRepository<
  Location,
  LocationInput,
  LocationUpdate
> {
  constructor() {
    super("locations");
  }

  /**
   * Apply filters specific to locations
   */
  protected applyFilters(
    query: Knex.QueryBuilder,
    filters: any
  ): Knex.QueryBuilder {
    if (filters.active !== undefined) {
      query = query.where("active", filters.active);
    }

    if (filters.warehouse_type) {
      query = query.where("warehouse_type", filters.warehouse_type);
    }

    if (filters.search) {
      query = query.where((builder) => {
        builder
          .where("name", "ilike", `%${filters.search}%`)
          .orWhere("city", "ilike", `%${filters.search}%`)
          .orWhere("state", "ilike", `%${filters.search}%`);
      });
    }

    return query;
  }

  /**
   * Apply search to location queries
   */
  protected applySearch(
    query: Knex.QueryBuilder,
    searchTerm: string
  ): Knex.QueryBuilder {
    return query.where((builder) => {
      builder
        .where("name", "ilike", `%${searchTerm}%`)
        .orWhere("city", "ilike", `%${searchTerm}%`)
        .orWhere("state", "ilike", `%${searchTerm}%`);
    });
  }

  /**
   * Find active warehouses
   */
  async findActiveWarehouses(): Promise<Location[]> {
    return this.db(this.tableName)
      .where("active", true)
      .orderBy("name", "asc")
      .select("*");
  }

  /**
   * Find warehouses by type
   */
  async findByWarehouseType(
    type: "main" | "secondary" | "distribution" | "storage"
  ): Promise<Location[]> {
    return this.db(this.tableName)
      .where("warehouse_type", type)
      .where("active", true)
      .orderBy("name", "asc")
      .select("*");
  }

  /**
   * Check if location name exists
   */
  async nameExists(name: string, excludeId?: number): Promise<boolean> {
    let query = this.db(this.tableName).where("name", "ilike", name);

    if (excludeId) {
      query = query.where("id", "!=", excludeId);
    }

    const result = await query.first("id");
    return !!result;
  }

  /**
   * Get locations with inventory
   */
  async getLocationsWithInventory(): Promise<Location[]> {
    return this.db(this.tableName)
      .join(
        "product_locations",
        "locations.id",
        "product_locations.location_id"
      )
      .where("locations.active", true)
      .where("product_locations.quantity_on_hand", ">", 0)
      .groupBy("locations.id")
      .orderBy("locations.name", "asc")
      .select("locations.*");
  }

  /**
   * Get location with total inventory value
   */
  async getLocationWithInventoryValue(
    locationId: number
  ): Promise<(Location & { total_inventory_value: number }) | null> {
    const result = await this.db(this.tableName)
      .leftJoin(
        "product_locations",
        "locations.id",
        "product_locations.location_id"
      )
      .where("locations.id", locationId)
      .groupBy("locations.id")
      .select(
        "locations.*",
        this.db.raw(
          "COALESCE(SUM(product_locations.quantity_on_hand * product_locations.unit_cost), 0) as total_inventory_value"
        )
      )
      .first();

    return result || null;
  }

  /**
   * Get all locations with their inventory values
   */
  async getAllLocationsWithInventoryValues(): Promise<
    Array<Location & { total_inventory_value: number }>
  > {
    return this.db(this.tableName)
      .leftJoin(
        "product_locations",
        "locations.id",
        "product_locations.location_id"
      )
      .where("locations.active", true)
      .groupBy("locations.id")
      .orderBy("locations.name", "asc")
      .select(
        "locations.*",
        this.db.raw(
          "COALESCE(SUM(product_locations.quantity_on_hand * product_locations.unit_cost), 0) as total_inventory_value"
        )
      );
  }
}
