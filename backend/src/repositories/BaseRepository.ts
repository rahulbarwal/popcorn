import { Knex } from "knex";
import db from "../config/database";
import { Repository, PaginationParams, PaginationMeta, ID } from "../types";

export abstract class BaseRepository<T, TInput, TUpdate>
  implements Repository<T, TInput, TUpdate>
{
  protected db: Knex;
  protected tableName: string;

  constructor(tableName: string) {
    this.db = db;
    this.tableName = tableName;
  }

  /**
   * Find all records with optional filtering and pagination
   */
  async findAll(filters?: any, pagination?: PaginationParams): Promise<T[]> {
    let query = this.db(this.tableName);

    // Apply filters if provided
    if (filters) {
      query = this.applyFilters(query, filters);
    }

    // Apply pagination if provided
    if (pagination) {
      if (pagination.limit) {
        query = query.limit(pagination.limit);
      }
      if (pagination.offset) {
        query = query.offset(pagination.offset);
      }
    }

    return query.select("*");
  }

  /**
   * Find a single record by ID
   */
  async findById(id: ID): Promise<T | null> {
    const result = await this.db(this.tableName).where("id", id).first();

    return result || null;
  }

  /**
   * Create a new record
   */
  async create(data: TInput): Promise<T> {
    const [result] = await this.db(this.tableName).insert(data).returning("*");

    return result;
  }

  /**
   * Update a record by ID
   */
  async update(id: ID, data: TUpdate): Promise<T | null> {
    const [result] = await this.db(this.tableName)
      .where("id", id)
      .update({
        ...data,
        updated_at: new Date(),
      })
      .returning("*");

    return result || null;
  }

  /**
   * Delete a record by ID
   */
  async delete(id: ID): Promise<boolean> {
    const deletedCount = await this.db(this.tableName).where("id", id).del();

    return deletedCount > 0;
  }

  /**
   * Count records with optional filtering
   */
  async count(filters?: any): Promise<number> {
    let query = this.db(this.tableName);

    if (filters) {
      query = this.applyFilters(query, filters);
    }

    const result = await query.count("* as count").first();
    return parseInt(result?.count as string) || 0;
  }

  /**
   * Find records with pagination metadata
   */
  async findWithPagination(
    filters?: any,
    pagination: PaginationParams = {}
  ): Promise<{ data: T[]; pagination: PaginationMeta }> {
    const { page = 1, limit = 50 } = pagination;
    const offset = (page - 1) * limit;

    // Get total count
    const total = await this.count(filters);

    // Get paginated data
    const data = await this.findAll(filters, { limit, offset });

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const paginationMeta: PaginationMeta = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    return { data, pagination: paginationMeta };
  }

  /**
   * Check if a record exists by ID
   */
  async exists(id: ID): Promise<boolean> {
    const result = await this.db(this.tableName).where("id", id).first("id");

    return !!result;
  }

  /**
   * Find records by multiple IDs
   */
  async findByIds(ids: ID[]): Promise<T[]> {
    if (ids.length === 0) return [];

    return this.db(this.tableName).whereIn("id", ids).select("*");
  }

  /**
   * Bulk create records
   */
  async bulkCreate(data: TInput[]): Promise<T[]> {
    if (data.length === 0) return [];

    return this.db(this.tableName).insert(data).returning("*");
  }

  /**
   * Bulk update records
   */
  async bulkUpdate(updates: Array<{ id: ID; data: TUpdate }>): Promise<T[]> {
    if (updates.length === 0) return [];

    const results: T[] = [];

    // Use transaction for bulk updates
    await this.db.transaction(async (trx) => {
      for (const update of updates) {
        const [result] = await trx(this.tableName)
          .where("id", update.id)
          .update({
            ...update.data,
            updated_at: new Date(),
          })
          .returning("*");

        if (result) {
          results.push(result);
        }
      }
    });

    return results;
  }

  /**
   * Soft delete (if the table has an 'active' column)
   */
  async softDelete(id: ID): Promise<boolean> {
    try {
      const result = await this.db(this.tableName).where("id", id).update({
        active: false,
        updated_at: new Date(),
      });

      return result > 0;
    } catch (error) {
      // If 'active' column doesn't exist, fall back to hard delete
      return this.delete(id);
    }
  }

  /**
   * Find one record by custom criteria
   */
  async findOne(criteria: Partial<T>): Promise<T | null> {
    const result = await this.db(this.tableName).where(criteria).first();

    return result || null;
  }

  /**
   * Find records by custom criteria
   */
  async findBy(criteria: Partial<T>): Promise<T[]> {
    return this.db(this.tableName).where(criteria).select("*");
  }

  /**
   * Execute raw query
   */
  async raw(query: string, bindings?: any[]): Promise<any> {
    return bindings ? this.db.raw(query, bindings) : this.db.raw(query);
  }

  /**
   * Get query builder for complex queries
   */
  query(): Knex.QueryBuilder {
    return this.db(this.tableName);
  }

  /**
   * Apply filters to query - to be implemented by child classes
   */
  protected applyFilters(
    query: Knex.QueryBuilder,
    filters: any
  ): Knex.QueryBuilder {
    // Default implementation - child classes should override this
    return query;
  }

  /**
   * Apply sorting to query
   */
  protected applySorting(
    query: Knex.QueryBuilder,
    sortBy: string = "created_at",
    sortOrder: "asc" | "desc" = "desc"
  ): Knex.QueryBuilder {
    return query.orderBy(sortBy, sortOrder);
  }

  /**
   * Apply search to query - to be implemented by child classes
   */
  protected applySearch(
    query: Knex.QueryBuilder,
    searchTerm: string
  ): Knex.QueryBuilder {
    // Default implementation - child classes should override this
    return query;
  }
}
