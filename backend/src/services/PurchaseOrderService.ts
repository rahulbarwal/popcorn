import { PurchaseOrderRepository } from "../repositories/PurchaseOrderRepository";
import { CompanyRepository } from "../repositories/CompanyRepository";
import {
  RecentPurchaseOrder,
  RecentPurchasesResponse,
  OrderStatus,
} from "../types";

export interface PurchaseOrderFilters {
  warehouse_id?: number;
  supplier_id?: number;
  status?: OrderStatus;
  date_from?: string;
  date_to?: string;
}

export class PurchaseOrderService {
  private purchaseOrderRepository: PurchaseOrderRepository;
  private companyRepository: CompanyRepository;

  constructor() {
    this.purchaseOrderRepository = new PurchaseOrderRepository();
    this.companyRepository = new CompanyRepository();
  }

  /**
   * Get recent purchase orders with supplier information
   * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
   */
  async getRecentPurchases(
    filters: PurchaseOrderFilters = {},
    limit: number = 10
  ): Promise<RecentPurchasesResponse> {
    // Get recent orders with supplier information and product counts
    const recentOrdersData =
      await this.purchaseOrderRepository.getRecentOrdersWithSuppliers(
        limit,
        filters.warehouse_id
      );

    // Apply additional filters if specified
    let filteredOrders = recentOrdersData;

    if (filters.supplier_id) {
      filteredOrders = filteredOrders.filter(
        (order) => order.supplier_id === filters.supplier_id
      );
    }

    if (filters.status) {
      filteredOrders = filteredOrders.filter(
        (order) => order.status === filters.status
      );
    }

    if (filters.date_from) {
      const fromDate = new Date(filters.date_from);
      filteredOrders = filteredOrders.filter(
        (order) => new Date(order.order_date) >= fromDate
      );
    }

    if (filters.date_to) {
      const toDate = new Date(filters.date_to);
      filteredOrders = filteredOrders.filter(
        (order) => new Date(order.order_date) <= toDate
      );
    }

    // Transform to API response format
    const recentOrders: RecentPurchaseOrder[] = filteredOrders.map((order) => ({
      id: order.id,
      po_number: order.po_number,
      supplier: {
        id: order.supplier_id,
        name: order.supplier_name,
        contact_name: order.supplier_contact_name,
      },
      order_date: order.order_date.toISOString().split("T")[0], // Format as YYYY-MM-DD
      expected_delivery_date: order.expected_delivery_date
        ? order.expected_delivery_date.toISOString().split("T")[0]
        : undefined,
      status: order.status,
      product_count: parseInt(order.product_count.toString()),
      total_amount: order.total_amount,
      is_overdue: order.is_overdue,
    }));

    const response: RecentPurchasesResponse = {
      recent_orders: recentOrders,
    };

    // Add warehouse filter info if specified
    if (filters.warehouse_id) {
      // Note: This would require additional logic to get warehouse name
      // For now, we'll include the ID
      response.warehouse_filter = {
        id: filters.warehouse_id,
        name: `Warehouse ${filters.warehouse_id}`, // Placeholder - should be actual name
      };
    }

    return response;
  }

  /**
   * Get purchase orders by status with filtering
   * Requirements: 2.4, 2.5
   */
  async getPurchaseOrdersByStatus(
    status: OrderStatus,
    filters: Omit<PurchaseOrderFilters, "status"> = {}
  ): Promise<RecentPurchaseOrder[]> {
    const orders = await this.purchaseOrderRepository.getOrdersByStatus(status);

    // Apply additional filters
    let filteredOrders = orders;

    if (filters.supplier_id) {
      filteredOrders = filteredOrders.filter(
        (order) => order.supplier_id === filters.supplier_id
      );
    }

    if (filters.date_from) {
      const fromDate = new Date(filters.date_from);
      filteredOrders = filteredOrders.filter(
        (order) => new Date(order.order_date) >= fromDate
      );
    }

    if (filters.date_to) {
      const toDate = new Date(filters.date_to);
      filteredOrders = filteredOrders.filter(
        (order) => new Date(order.order_date) <= toDate
      );
    }

    // Get supplier information for each order
    const ordersWithSuppliers: RecentPurchaseOrder[] = [];

    for (const order of filteredOrders) {
      const supplier = await this.companyRepository.findById(order.supplier_id);

      // Get product count for this order
      const productCount = await this.getOrderProductCount(order.id);

      ordersWithSuppliers.push({
        id: order.id,
        po_number: order.po_number,
        supplier: {
          id: order.supplier_id,
          name: supplier?.name || "Unknown Supplier",
          contact_name: supplier?.contact_name,
        },
        order_date: order.order_date.toISOString().split("T")[0],
        expected_delivery_date: order.expected_delivery_date
          ? order.expected_delivery_date.toISOString().split("T")[0]
          : undefined,
        status: order.status,
        product_count: productCount,
        total_amount: order.total_amount,
        is_overdue: this.isOrderOverdue(order),
      });
    }

    return ordersWithSuppliers;
  }

  /**
   * Get overdue purchase orders
   * Requirements: 2.5
   */
  async getOverduePurchaseOrders(): Promise<RecentPurchaseOrder[]> {
    const overdueOrders = await this.purchaseOrderRepository.getOverdueOrders();

    return overdueOrders.map((order) => ({
      id: order.id,
      po_number: order.po_number,
      supplier: {
        id: order.supplier_id,
        name: order.supplier_name,
        contact_name: undefined, // Not included in overdue query
      },
      order_date: order.order_date.toISOString().split("T")[0],
      expected_delivery_date: order.expected_delivery_date
        ? order.expected_delivery_date.toISOString().split("T")[0]
        : undefined,
      status: order.status,
      product_count: 0, // Would need additional query to get this
      total_amount: order.total_amount,
      is_overdue: true,
    }));
  }

  /**
   * Get detailed purchase order information
   * Requirements: 2.1, 2.2, 2.3
   */
  async getPurchaseOrderDetails(orderId: number) {
    return this.purchaseOrderRepository.getOrderWithDetails(orderId);
  }

  /**
   * Update purchase order status
   * Requirements: 2.4, 2.5
   */
  async updatePurchaseOrderStatus(orderId: number, status: OrderStatus) {
    return this.purchaseOrderRepository.updateStatus(orderId, status);
  }

  /**
   * Get purchase order statistics for dashboard metrics
   */
  async getPurchaseOrderStatistics(dateFrom?: Date, dateTo?: Date) {
    return this.purchaseOrderRepository.getOrderStatistics(dateFrom, dateTo);
  }

  /**
   * Helper method to get product count for an order
   */
  private async getOrderProductCount(orderId: number): Promise<number> {
    // This would typically be done with a join, but for now we'll use a separate query
    const result = await this.purchaseOrderRepository.raw(
      "SELECT COUNT(*) as count FROM purchase_order_products WHERE purchase_order_id = ?",
      [orderId]
    );

    const countResult = result.rows ? result.rows[0] : result[0];
    return parseInt(countResult?.count || "0");
  }

  /**
   * Helper method to determine if an order is overdue
   */
  private isOrderOverdue(order: {
    expected_delivery_date?: Date;
    status: OrderStatus;
  }): boolean {
    if (!order.expected_delivery_date) return false;
    if (order.status === "delivered" || order.status === "cancelled")
      return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day

    const deliveryDate = new Date(order.expected_delivery_date);
    deliveryDate.setHours(0, 0, 0, 0);

    return deliveryDate < today;
  }

  /**
   * Search purchase orders by PO number or notes
   */
  async searchPurchaseOrders(
    searchTerm: string,
    filters: PurchaseOrderFilters = {},
    limit: number = 10
  ): Promise<RecentPurchasesResponse> {
    // Use the repository's built-in search functionality
    const orders = await this.purchaseOrderRepository.findAll(
      {
        search: searchTerm,
        supplier_id: filters.supplier_id,
        status: filters.status,
        date_from: filters.date_from,
        date_to: filters.date_to,
      },
      { limit }
    );

    // Transform to response format with supplier information
    const recentOrders: RecentPurchaseOrder[] = [];

    for (const order of orders) {
      const supplier = await this.companyRepository.findById(order.supplier_id);
      const productCount = await this.getOrderProductCount(order.id);

      recentOrders.push({
        id: order.id,
        po_number: order.po_number,
        supplier: {
          id: order.supplier_id,
          name: supplier?.name || "Unknown Supplier",
          contact_name: supplier?.contact_name,
        },
        order_date: order.order_date.toISOString().split("T")[0],
        expected_delivery_date: order.expected_delivery_date
          ? order.expected_delivery_date.toISOString().split("T")[0]
          : undefined,
        status: order.status,
        product_count: productCount,
        total_amount: order.total_amount,
        is_overdue: this.isOrderOverdue(order),
      });
    }

    return {
      recent_orders: recentOrders,
      warehouse_filter: filters.warehouse_id
        ? {
            id: filters.warehouse_id,
            name: `Warehouse ${filters.warehouse_id}`,
          }
        : undefined,
    };
  }
}
