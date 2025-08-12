import { Knex } from "knex";
import { BaseRepository } from "./BaseRepository";
import {
  PurchaseOrder,
  PurchaseOrderInput,
  PurchaseOrderUpdate,
  OrderStatus,
} from "../types";

export class PurchaseOrderRepository extends BaseRepository<
  PurchaseOrder,
  PurchaseOrderInput,
  PurchaseOrderUpdate
> {
  constructor() {
    super("purchase_orders");
  }

  /**
   * Apply filters specific to purchase orders
   */
  protected applyFilters(
    query: Knex.QueryBuilder,
    filters: any
  ): Knex.QueryBuilder {
    if (filters.supplier_id) {
      query = query.where("supplier_id", filters.supplier_id);
    }

    if (filters.status) {
      query = query.where("status", filters.status);
    }

    if (filters.date_from) {
      query = query.where("order_date", ">=", filters.date_from);
    }

    if (filters.date_to) {
      query = query.where("order_date", "<=", filters.date_to);
    }

    if (filters.search) {
      query = query.where((builder) => {
        builder
          .where("po_number", "ilike", `%${filters.search}%`)
          .orWhere("notes", "ilike", `%${filters.search}%`);
      });
    }

    return query;
  }

  /**
   * Apply search to purchase order queries
   */
  protected applySearch(
    query: Knex.QueryBuilder,
    searchTerm: string
  ): Knex.QueryBuilder {
    return query.where((builder) => {
      builder
        .where("po_number", "ilike", `%${searchTerm}%`)
        .orWhere("notes", "ilike", `%${searchTerm}%`);
    });
  }

  /**
   * Find purchase order by PO number
   */
  async findByPoNumber(poNumber: string): Promise<PurchaseOrder | null> {
    const result = await this.db(this.tableName)
      .where("po_number", poNumber)
      .first();

    return result || null;
  }

  /**
   * Check if PO number exists
   */
  async poNumberExists(poNumber: string, excludeId?: number): Promise<boolean> {
    let query = this.db(this.tableName).where("po_number", poNumber);

    if (excludeId) {
      query = query.where("id", "!=", excludeId);
    }

    const result = await query.first("id");
    return !!result;
  }

  /**
   * Get recent purchase orders with supplier information
   */
  async getRecentOrdersWithSuppliers(
    limit: number = 10,
    warehouseId?: number
  ): Promise<
    Array<
      PurchaseOrder & {
        supplier_name: string;
        supplier_contact_name?: string;
        product_count: number;
        is_overdue: boolean;
      }
    >
  > {
    let query = this.db(this.tableName)
      .join("companies", "purchase_orders.supplier_id", "companies.id")
      .leftJoin(
        "purchase_order_products",
        "purchase_orders.id",
        "purchase_order_products.purchase_order_id"
      )
      .groupBy("purchase_orders.id", "companies.name", "companies.contact_name")
      .orderBy("purchase_orders.order_date", "desc")
      .limit(limit)
      .select(
        "purchase_orders.*",
        "companies.name as supplier_name",
        "companies.contact_name as supplier_contact_name",
        this.db.raw("COUNT(purchase_order_products.id) as product_count"),
        this.db.raw(`
          CASE 
            WHEN purchase_orders.expected_delivery_date < CURRENT_DATE 
            AND purchase_orders.status NOT IN ('delivered', 'cancelled') 
            THEN true 
            ELSE false 
          END as is_overdue
        `)
      );

    // Note: Warehouse filtering for purchase orders would require additional logic
    // based on how warehouse assignments are tracked for purchase orders

    return query;
  }

  /**
   * Get purchase orders by status
   */
  async getOrdersByStatus(status: OrderStatus): Promise<PurchaseOrder[]> {
    return this.db(this.tableName)
      .where("status", status)
      .orderBy("order_date", "desc")
      .select("*");
  }

  /**
   * Get overdue purchase orders
   */
  async getOverdueOrders(): Promise<
    Array<
      PurchaseOrder & {
        supplier_name: string;
        days_overdue: number;
      }
    >
  > {
    return this.db(this.tableName)
      .join("companies", "purchase_orders.supplier_id", "companies.id")
      .where(
        "purchase_orders.expected_delivery_date",
        "<",
        this.db.raw("CURRENT_DATE")
      )
      .whereNotIn("purchase_orders.status", ["delivered", "cancelled"])
      .orderBy("purchase_orders.expected_delivery_date", "asc")
      .select(
        "purchase_orders.*",
        "companies.name as supplier_name",
        this.db.raw(
          "CURRENT_DATE - purchase_orders.expected_delivery_date as days_overdue"
        )
      );
  }

  /**
   * Get purchase order with detailed information
   */
  async getOrderWithDetails(orderId: number): Promise<
    | (PurchaseOrder & {
        supplier: {
          id: number;
          name: string;
          contact_name?: string;
          email?: string;
          phone?: string;
        };
        products: Array<{
          product_id: number;
          sku: string;
          name: string;
          quantity_ordered: number;
          unit_price: number;
          total_price: number;
          quantity_received: number;
        }>;
      })
    | null
  > {
    const order = await this.findById(orderId);
    if (!order) return null;

    // Get supplier information
    const supplier = await this.db("companies")
      .where("id", order.supplier_id)
      .select("id", "name", "contact_name", "email", "phone")
      .first();

    // Get order products
    const products = await this.db("purchase_order_products")
      .join("products", "purchase_order_products.product_id", "products.id")
      .where("purchase_order_products.purchase_order_id", orderId)
      .select(
        "purchase_order_products.product_id",
        "products.sku",
        "products.name",
        "purchase_order_products.quantity_ordered",
        "purchase_order_products.unit_price",
        "purchase_order_products.total_price",
        "purchase_order_products.quantity_received"
      );

    return {
      ...order,
      supplier,
      products,
    };
  }

  /**
   * Update purchase order status
   */
  async updateStatus(
    orderId: number,
    status: OrderStatus
  ): Promise<PurchaseOrder | null> {
    const [result] = await this.db(this.tableName)
      .where("id", orderId)
      .update({
        status,
        updated_at: new Date(),
      })
      .returning("*");

    return result || null;
  }

  /**
   * Generate next PO number
   */
  async generatePoNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `PO-${year}-`;

    const lastOrder = await this.db(this.tableName)
      .where("po_number", "like", `${prefix}%`)
      .orderBy("po_number", "desc")
      .first("po_number");

    if (!lastOrder) {
      return `${prefix}001`;
    }

    const lastNumber = parseInt(lastOrder.po_number.split("-")[2]) || 0;
    const nextNumber = (lastNumber + 1).toString().padStart(3, "0");

    return `${prefix}${nextNumber}`;
  }

  /**
   * Get purchase orders by supplier
   */
  async getOrdersBySupplier(
    supplierId: number,
    limit?: number
  ): Promise<PurchaseOrder[]> {
    let query = this.db(this.tableName)
      .where("supplier_id", supplierId)
      .orderBy("order_date", "desc");

    if (limit) {
      query = query.limit(limit);
    }

    return query.select("*");
  }

  /**
   * Get purchase order statistics
   */
  async getOrderStatistics(
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<{
    total_orders: number;
    total_value: number;
    pending_orders: number;
    delivered_orders: number;
    overdue_orders: number;
  }> {
    let query = this.db(this.tableName);

    if (dateFrom) {
      query = query.where("order_date", ">=", dateFrom);
    }

    if (dateTo) {
      query = query.where("order_date", "<=", dateTo);
    }

    const stats = await query
      .select(
        this.db.raw("COUNT(*) as total_orders"),
        this.db.raw("COALESCE(SUM(total_amount), 0) as total_value"),
        this.db.raw(
          "COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders"
        ),
        this.db.raw(
          "COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders"
        ),
        this.db.raw(`
          COUNT(CASE 
            WHEN expected_delivery_date < CURRENT_DATE 
            AND status NOT IN ('delivered', 'cancelled') 
            THEN 1 
          END) as overdue_orders
        `)
      )
      .first();

    return {
      total_orders: parseInt(stats.total_orders),
      total_value: parseFloat(stats.total_value),
      pending_orders: parseInt(stats.pending_orders),
      delivered_orders: parseInt(stats.delivered_orders),
      overdue_orders: parseInt(stats.overdue_orders),
    };
  }
}
