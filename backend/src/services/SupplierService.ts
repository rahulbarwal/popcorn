import { CompanyRepository } from "../repositories/CompanyRepository";
import { PurchaseOrderRepository } from "../repositories/PurchaseOrderRepository";
import { Company } from "../types/database";

export interface SupplierPerformanceMetrics {
  total_orders: number;
  total_value: number;
  average_order_value: number;
  on_time_delivery_rate: number;
  average_delivery_days: number;
  last_order_date?: string;
  orders_last_30_days: number;
  orders_last_90_days: number;
  reliability_score: number;
}

export interface SupplierWithPerformance extends Company {
  performance: SupplierPerformanceMetrics;
  recent_orders: Array<{
    id: number;
    po_number: string;
    order_date: string;
    expected_delivery_date?: string;
    status: string;
    total_amount: number;
    product_count: number;
    is_overdue: boolean;
  }>;
}

export interface SupplierContactInfo {
  id: number;
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  supplier_type: string;
  active: boolean;
}

export interface SupplierOrderHistory {
  supplier_id: number;
  orders: Array<{
    id: number;
    po_number: string;
    order_date: string;
    expected_delivery_date?: string;
    status: string;
    total_amount: number;
    product_count: number;
    products: Array<{
      product_id: number;
      sku: string;
      name: string;
      quantity_ordered: number;
      quantity_received: number;
      unit_price: number;
      total_price: number;
    }>;
  }>;
  total_orders: number;
  total_value: number;
}

export class SupplierService {
  private companyRepository: CompanyRepository;
  private purchaseOrderRepository: PurchaseOrderRepository;

  constructor() {
    this.companyRepository = new CompanyRepository();
    this.purchaseOrderRepository = new PurchaseOrderRepository();
  }

  /**
   * Get all suppliers with detailed information
   * Requirements: 4.1, 4.2
   */
  async getAllSuppliers(includeInactive: boolean = false): Promise<Company[]> {
    if (includeInactive) {
      return this.companyRepository.findAllSuppliersOrdered();
    } else {
      return this.companyRepository.findActiveSuppliers();
    }
  }

  /**
   * Get supplier by ID with detailed contact information
   * Requirements: 4.1, 4.2
   */
  async getSupplierById(
    supplierId: number
  ): Promise<SupplierContactInfo | null> {
    const supplier = await this.companyRepository.findById(supplierId);

    if (!supplier) {
      return null;
    }

    return {
      id: supplier.id,
      name: supplier.name,
      contact_name: supplier.contact_name,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      city: supplier.city,
      state: supplier.state,
      zip_code: supplier.zip_code,
      supplier_type: supplier.supplier_type,
      active: supplier.active,
    };
  }

  /**
   * Get supplier with performance metrics and recent order history
   * Requirements: 4.1, 4.2, 4.3, 4.4
   */
  async getSupplierWithPerformance(
    supplierId: number
  ): Promise<SupplierWithPerformance | null> {
    const supplier = await this.companyRepository.findById(supplierId);

    if (!supplier) {
      return null;
    }

    const performance = await this.calculateSupplierPerformance(supplierId);
    const recentOrders = await this.getSupplierRecentOrders(supplierId, 10);

    return {
      ...supplier,
      performance,
      recent_orders: recentOrders,
    };
  }

  /**
   * Calculate supplier performance metrics
   * Requirements: 4.3, 4.4
   */
  async calculateSupplierPerformance(
    supplierId: number
  ): Promise<SupplierPerformanceMetrics> {
    // Get all orders for this supplier
    const ordersQuery = await this.purchaseOrderRepository.raw(
      `
      SELECT 
        po.id,
        po.order_date,
        po.expected_delivery_date,
        po.status,
        po.total_amount,
        COUNT(pop.id) as product_count,
        CASE 
          WHEN po.status = 'delivered' AND po.expected_delivery_date IS NOT NULL 
          THEN EXTRACT(DAYS FROM (po.updated_at - po.expected_delivery_date))
          ELSE NULL 
        END as delivery_variance_days
      FROM purchase_orders po
      LEFT JOIN purchase_order_products pop ON po.id = pop.purchase_order_id
      WHERE po.supplier_id = ?
      GROUP BY po.id, po.order_date, po.expected_delivery_date, po.status, po.total_amount, po.updated_at
      ORDER BY po.order_date DESC
    `,
      [supplierId]
    );

    const orders = ordersQuery.rows || ordersQuery;

    if (orders.length === 0) {
      return {
        total_orders: 0,
        total_value: 0,
        average_order_value: 0,
        on_time_delivery_rate: 0,
        average_delivery_days: 0,
        orders_last_30_days: 0,
        orders_last_90_days: 0,
        reliability_score: 0,
      };
    }

    // Calculate basic metrics
    const totalOrders = orders.length;
    const totalValue = orders.reduce(
      (sum: number, order: any) => sum + parseFloat(order.total_amount || 0),
      0
    );
    const averageOrderValue = totalValue / totalOrders;

    // Calculate date-based metrics
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const ordersLast30Days = orders.filter(
      (order: any) => new Date(order.order_date) >= thirtyDaysAgo
    ).length;

    const ordersLast90Days = orders.filter(
      (order: any) => new Date(order.order_date) >= ninetyDaysAgo
    ).length;

    // Calculate delivery performance
    const deliveredOrders = orders.filter(
      (order: any) => order.status === "delivered"
    );
    const ordersWithDeliveryData = deliveredOrders.filter(
      (order: any) => order.delivery_variance_days !== null
    );

    let onTimeDeliveryRate = 0;
    let averageDeliveryDays = 0;

    if (ordersWithDeliveryData.length > 0) {
      const onTimeOrders = ordersWithDeliveryData.filter(
        (order: any) => parseFloat(order.delivery_variance_days) <= 0
      );
      onTimeDeliveryRate =
        (onTimeOrders.length / ordersWithDeliveryData.length) * 100;

      // Calculate average delivery variance (positive means late, negative means early)
      const totalVariance = ordersWithDeliveryData.reduce(
        (sum: number, order: any) =>
          sum + parseFloat(order.delivery_variance_days),
        0
      );
      averageDeliveryDays = totalVariance / ordersWithDeliveryData.length;
    }

    // Calculate reliability score (0-1 scale)
    // Based on: order frequency (30%), on-time delivery (40%), order consistency (30%)
    const frequencyScore = Math.min(ordersLast30Days / 5, 1); // Normalize to max 5 orders per month
    const deliveryScore = onTimeDeliveryRate / 100;
    const consistencyScore =
      ordersLast90Days > 0 ? Math.min(ordersLast90Days / 10, 1) : 0;

    const reliabilityScore =
      frequencyScore * 0.3 + deliveryScore * 0.4 + consistencyScore * 0.3;

    // Get last order date
    const lastOrderDate = orders.length > 0 ? orders[0].order_date : undefined;

    return {
      total_orders: totalOrders,
      total_value: totalValue,
      average_order_value: averageOrderValue,
      on_time_delivery_rate: Math.round(onTimeDeliveryRate * 100) / 100,
      average_delivery_days: Math.round(averageDeliveryDays * 100) / 100,
      last_order_date: lastOrderDate
        ? new Date(lastOrderDate).toISOString().split("T")[0]
        : undefined,
      orders_last_30_days: ordersLast30Days,
      orders_last_90_days: ordersLast90Days,
      reliability_score: Math.round(reliabilityScore * 100) / 100,
    };
  }

  /**
   * Get recent orders for a supplier
   * Requirements: 4.3, 4.4
   */
  async getSupplierRecentOrders(
    supplierId: number,
    limit: number = 10
  ): Promise<
    Array<{
      id: number;
      po_number: string;
      order_date: string;
      expected_delivery_date?: string;
      status: string;
      total_amount: number;
      product_count: number;
      is_overdue: boolean;
    }>
  > {
    const ordersQuery = await this.purchaseOrderRepository.raw(
      `
      SELECT 
        po.id,
        po.po_number,
        po.order_date,
        po.expected_delivery_date,
        po.status,
        po.total_amount,
        COUNT(pop.id) as product_count,
        CASE 
          WHEN po.expected_delivery_date IS NOT NULL 
            AND po.expected_delivery_date < CURRENT_DATE 
            AND po.status NOT IN ('delivered', 'cancelled')
          THEN true
          ELSE false
        END as is_overdue
      FROM purchase_orders po
      LEFT JOIN purchase_order_products pop ON po.id = pop.purchase_order_id
      WHERE po.supplier_id = ?
      GROUP BY po.id, po.po_number, po.order_date, po.expected_delivery_date, po.status, po.total_amount
      ORDER BY po.order_date DESC
      LIMIT ?
    `,
      [supplierId, limit]
    );

    const orders = ordersQuery.rows || ordersQuery;

    return orders.map((order: any) => ({
      id: order.id,
      po_number: order.po_number,
      order_date: new Date(order.order_date).toISOString().split("T")[0],
      expected_delivery_date: order.expected_delivery_date
        ? new Date(order.expected_delivery_date).toISOString().split("T")[0]
        : undefined,
      status: order.status,
      total_amount: parseFloat(order.total_amount),
      product_count: parseInt(order.product_count),
      is_overdue: order.is_overdue,
    }));
  }

  /**
   * Get detailed order history for a supplier
   * Requirements: 4.3, 4.4
   */
  async getSupplierOrderHistory(
    supplierId: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<SupplierOrderHistory> {
    // Get orders with product details
    const ordersQuery = await this.purchaseOrderRepository.raw(
      `
      SELECT 
        po.id,
        po.po_number,
        po.order_date,
        po.expected_delivery_date,
        po.status,
        po.total_amount,
        COUNT(pop.id) as product_count
      FROM purchase_orders po
      LEFT JOIN purchase_order_products pop ON po.id = pop.purchase_order_id
      WHERE po.supplier_id = ?
      GROUP BY po.id, po.po_number, po.order_date, po.expected_delivery_date, po.status, po.total_amount
      ORDER BY po.order_date DESC
      LIMIT ? OFFSET ?
    `,
      [supplierId, limit, offset]
    );

    const orders = ordersQuery.rows || ordersQuery;

    // Get total count and value for all orders
    const totalsQuery = await this.purchaseOrderRepository.raw(
      `
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_value
      FROM purchase_orders
      WHERE supplier_id = ?
    `,
      [supplierId]
    );

    const totals = (totalsQuery.rows || totalsQuery)[0];

    // Get product details for each order
    const ordersWithProducts = await Promise.all(
      orders.map(async (order: any) => {
        const productsQuery = await this.purchaseOrderRepository.raw(
          `
          SELECT 
            pop.product_id,
            p.sku,
            p.name,
            pop.quantity_ordered,
            pop.quantity_received,
            pop.unit_price,
            pop.total_price
          FROM purchase_order_products pop
          JOIN products p ON pop.product_id = p.id
          WHERE pop.purchase_order_id = ?
          ORDER BY p.name
        `,
          [order.id]
        );

        const products = productsQuery.rows || productsQuery;

        return {
          id: order.id,
          po_number: order.po_number,
          order_date: new Date(order.order_date).toISOString().split("T")[0],
          expected_delivery_date: order.expected_delivery_date
            ? new Date(order.expected_delivery_date).toISOString().split("T")[0]
            : undefined,
          status: order.status,
          total_amount: parseFloat(order.total_amount),
          product_count: parseInt(order.product_count),
          products: products.map((product: any) => ({
            product_id: product.product_id,
            sku: product.sku,
            name: product.name,
            quantity_ordered: parseInt(product.quantity_ordered),
            quantity_received: parseInt(product.quantity_received),
            unit_price: parseFloat(product.unit_price),
            total_price: parseFloat(product.total_price),
          })),
        };
      })
    );

    return {
      supplier_id: supplierId,
      orders: ordersWithProducts,
      total_orders: parseInt(totals.total_orders),
      total_value: parseFloat(totals.total_value),
    };
  }

  /**
   * Get suppliers associated with specific products
   * Requirements: 4.1, 4.2
   */
  async getSuppliersForProducts(productIds: number[]): Promise<Company[]> {
    if (productIds.length === 0) {
      return [];
    }

    // Get suppliers who have supplied these products in purchase orders
    const suppliersQuery = await this.companyRepository.raw(
      `
      SELECT DISTINCT c.*
      FROM companies c
      JOIN purchase_orders po ON c.id = po.supplier_id
      JOIN purchase_order_products pop ON po.id = pop.purchase_order_id
      WHERE pop.product_id = ANY(?)
        AND c.active = true
      ORDER BY c.name ASC
    `,
      [productIds]
    );

    return suppliersQuery.rows || suppliersQuery;
  }

  /**
   * Search suppliers by name, contact, or email
   * Requirements: 4.1, 4.2
   */
  async searchSuppliers(
    searchTerm: string,
    limit: number = 20
  ): Promise<Company[]> {
    return this.companyRepository.searchSuppliersOrdered(searchTerm, limit);
  }

  /**
   * Get supplier performance rankings
   * Requirements: 4.3, 4.4
   */
  async getSupplierPerformanceRankings(limit: number = 10): Promise<
    Array<{
      supplier: SupplierContactInfo;
      performance: SupplierPerformanceMetrics;
      rank: number;
    }>
  > {
    const suppliers = await this.getAllSuppliers(false);

    const suppliersWithPerformance = await Promise.all(
      suppliers.map(async (supplier) => {
        const performance = await this.calculateSupplierPerformance(
          supplier.id
        );
        return {
          supplier: {
            id: supplier.id,
            name: supplier.name,
            contact_name: supplier.contact_name,
            email: supplier.email,
            phone: supplier.phone,
            address: supplier.address,
            city: supplier.city,
            state: supplier.state,
            zip_code: supplier.zip_code,
            supplier_type: supplier.supplier_type,
            active: supplier.active,
          },
          performance,
        };
      })
    );

    // Sort by reliability score and add rankings
    const rankedSuppliers = suppliersWithPerformance
      .filter((s) => s.performance.total_orders > 0) // Only include suppliers with orders
      .sort(
        (a, b) =>
          b.performance.reliability_score - a.performance.reliability_score
      )
      .slice(0, limit)
      .map((supplier, index) => ({
        ...supplier,
        rank: index + 1,
      }));

    return rankedSuppliers;
  }

  /**
   * Get suppliers with recent activity (orders in last N days)
   * Requirements: 4.3, 4.4
   */
  async getSuppliersWithRecentActivity(days: number = 30): Promise<Company[]> {
    return this.companyRepository.getSuppliersWithRecentOrders(days);
  }
}
