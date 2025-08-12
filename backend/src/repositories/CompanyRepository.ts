import { Knex } from "knex";
import { BaseRepository } from "./BaseRepository";
import { Company, CompanyInput, CompanyUpdate } from "../types";

export class CompanyRepository extends BaseRepository<
  Company,
  CompanyInput,
  CompanyUpdate
> {
  constructor() {
    super("companies");
  }

  /**
   * Apply filters specific to companies
   */
  protected applyFilters(
    query: Knex.QueryBuilder,
    filters: any
  ): Knex.QueryBuilder {
    if (filters.active !== undefined) {
      query = query.where("active", filters.active);
    }

    if (filters.supplier_type) {
      query = query.where("supplier_type", filters.supplier_type);
    }

    if (filters.search) {
      query = query.where((builder) => {
        builder
          .where("name", "ilike", `%${filters.search}%`)
          .orWhere("contact_name", "ilike", `%${filters.search}%`)
          .orWhere("email", "ilike", `%${filters.search}%`);
      });
    }

    return query;
  }

  /**
   * Apply search to company queries
   */
  protected applySearch(
    query: Knex.QueryBuilder,
    searchTerm: string
  ): Knex.QueryBuilder {
    return query.where((builder) => {
      builder
        .where("name", "ilike", `%${searchTerm}%`)
        .orWhere("contact_name", "ilike", `%${searchTerm}%`)
        .orWhere("email", "ilike", `%${searchTerm}%`);
    });
  }

  /**
   * Find active suppliers
   */
  async findActiveSuppliers(): Promise<Company[]> {
    return this.db(this.tableName)
      .where("active", true)
      .orderBy("name", "asc")
      .select("*");
  }

  /**
   * Find suppliers by type
   */
  async findBySupplierType(
    type: "primary" | "secondary" | "backup"
  ): Promise<Company[]> {
    return this.db(this.tableName)
      .where("supplier_type", type)
      .where("active", true)
      .orderBy("name", "asc")
      .select("*");
  }

  /**
   * Find company by email
   */
  async findByEmail(email: string): Promise<Company | null> {
    const result = await this.db(this.tableName).where("email", email).first();

    return result || null;
  }

  /**
   * Check if company name exists
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
   * Get suppliers with recent purchase orders
   */
  async getSuppliersWithRecentOrders(days: number = 30): Promise<Company[]> {
    return this.db(this.tableName)
      .join("purchase_orders", "companies.id", "purchase_orders.supplier_id")
      .where("companies.active", true)
      .where(
        "purchase_orders.order_date",
        ">=",
        this.db.raw("CURRENT_DATE - INTERVAL ? DAY", [days])
      )
      .groupBy("companies.id")
      .orderBy("companies.name", "asc")
      .select("companies.*");
  }
}
