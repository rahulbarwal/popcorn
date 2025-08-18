import request from "supertest";
import app from "../../server";

// Helper functions for API testing
export class ApiTestHelpers {
  static makeRequest(method: string, endpoint: string, data?: any) {
    const agent = request(app);
    let req: any;

    switch (method.toLowerCase()) {
      case "get":
        req = agent.get(endpoint);
        break;
      case "post":
        req = agent.post(endpoint);
        break;
      case "put":
        req = agent.put(endpoint);
        break;
      case "patch":
        req = agent.patch(endpoint);
        break;
      case "delete":
        req = agent.delete(endpoint);
        break;
      default:
        req = agent.get(endpoint);
    }

    if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
      req = req.send(data);
    }

    return req;
  }

  static getDashboardMetrics(warehouseId?: number) {
    const url = warehouseId
      ? `/api/dashboard/summary-metrics?warehouse_id=${warehouseId}`
      : "/api/dashboard/summary-metrics";

    return this.makeRequest("GET", url);
  }

  static getStockLevels(
    params: {
      warehouseId?: number;
      stockFilter?: string;
      search?: string;
      category?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const queryParams = new URLSearchParams();

    if (params.warehouseId)
      queryParams.append("warehouse_id", params.warehouseId.toString());
    if (params.stockFilter)
      queryParams.append("stock_filter", params.stockFilter);
    if (params.search) queryParams.append("search", params.search);
    if (params.category) queryParams.append("category", params.category);
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());

    const url = `/api/dashboard/stock-levels${
      queryParams.toString() ? "?" + queryParams.toString() : ""
    }`;
    return this.makeRequest("GET", url);
  }

  static getRecentPurchases(
    params: {
      warehouseId?: number;
      supplierId?: number;
      status?: string;
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
    } = {}
  ) {
    const queryParams = new URLSearchParams();

    if (params.warehouseId)
      queryParams.append("warehouse_id", params.warehouseId.toString());
    if (params.supplierId)
      queryParams.append("supplier_id", params.supplierId.toString());
    if (params.status) queryParams.append("status", params.status);
    if (params.dateFrom) queryParams.append("date_from", params.dateFrom);
    if (params.dateTo) queryParams.append("date_to", params.dateTo);
    if (params.limit) queryParams.append("limit", params.limit.toString());

    const url = `/api/dashboard/recent-purchases${
      queryParams.toString() ? "?" + queryParams.toString() : ""
    }`;
    return this.makeRequest("GET", url);
  }

  static getWarehouseDistribution(
    params: {
      warehouseId?: number;
      productId?: number;
      category?: string;
      minValue?: number;
    } = {}
  ) {
    const queryParams = new URLSearchParams();

    if (params.warehouseId)
      queryParams.append("warehouse_id", params.warehouseId.toString());
    if (params.productId)
      queryParams.append("product_id", params.productId.toString());
    if (params.category) queryParams.append("category", params.category);
    if (params.minValue)
      queryParams.append("min_value", params.minValue.toString());

    const url = `/api/dashboard/warehouse-distribution${
      queryParams.toString() ? "?" + queryParams.toString() : ""
    }`;
    return this.makeRequest("GET", url);
  }

  static getStockVisualization(
    params: {
      warehouseId?: number;
    } = {}
  ) {
    const queryParams = new URLSearchParams();

    if (params.warehouseId)
      queryParams.append("warehouse_id", params.warehouseId.toString());

    const url = `/api/dashboard/stock-visualization${
      queryParams.toString() ? "?" + queryParams.toString() : ""
    }`;
    return this.makeRequest("GET", url);
  }

  static getSuppliers(
    params: {
      includeInactive?: boolean;
      search?: string;
      limit?: number;
    } = {}
  ) {
    const queryParams = new URLSearchParams();

    if (params.includeInactive) queryParams.append("include_inactive", "true");
    if (params.search) queryParams.append("search", params.search);
    if (params.limit) queryParams.append("limit", params.limit.toString());

    const url = `/api/suppliers${
      queryParams.toString() ? "?" + queryParams.toString() : ""
    }`;
    return this.makeRequest("GET", url);
  }

  static getSupplierById(id: number) {
    return this.makeRequest("GET", `/api/suppliers/${id}`);
  }

  static getSuppliersForProducts(productIds: number[]) {
    const url = `/api/suppliers/by-products?product_ids=${productIds.join(
      ","
    )}`;
    return this.makeRequest("GET", url);
  }
}

// Validation helpers
export class ValidationHelpers {
  static validateMetricsResponse(response: any) {
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.metrics).toBeDefined();
    expect(response.body.data.last_updated).toBeDefined();

    const metrics = response.body.data.metrics;

    // Validate each metric structure
    [
      "total_products",
      "low_stock",
      "out_of_stock",
      "suppliers",
      "total_stock_value",
    ].forEach((metricKey) => {
      expect(metrics[metricKey]).toBeDefined();
      expect(metrics[metricKey].value).toBeGreaterThanOrEqual(0);
      expect(metrics[metricKey].status).toMatch(/^(normal|warning|critical)$/);
    });

    // Validate specific metric properties
    expect(metrics.low_stock.threshold).toBeDefined();
    expect(metrics.total_stock_value.currency).toBe("USD");
  }

  static validateStockLevelsResponse(response: any) {
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.products).toBeDefined();
    expect(Array.isArray(response.body.data.products)).toBe(true);
    expect(response.body.data.pagination).toBeDefined();

    if (response.body.data.products.length > 0) {
      const product = response.body.data.products[0];
      expect(product.id).toBeDefined();
      expect(product.sku).toBeDefined();
      expect(product.name).toBeDefined();
      expect(product.category).toBeDefined();
      expect(product.total_quantity).toBeGreaterThanOrEqual(0);
      expect(typeof product.low_stock).toBe("boolean");
      expect(typeof product.out_of_stock).toBe("boolean");
      expect(Array.isArray(product.locations)).toBe(true);
    }
  }

  static validateRecentPurchasesResponse(response: any) {
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.recent_orders).toBeDefined();
    expect(Array.isArray(response.body.data.recent_orders)).toBe(true);

    if (response.body.data.recent_orders.length > 0) {
      const order = response.body.data.recent_orders[0];
      expect(order.id).toBeDefined();
      expect(order.po_number).toBeDefined();
      expect(order.supplier).toBeDefined();
      expect(order.supplier.id).toBeDefined();
      expect(order.supplier.name).toBeDefined();
      expect(order.order_date).toBeDefined();
      expect(order.status).toMatch(
        /^(pending|confirmed|shipped|delivered|cancelled)$/
      );
      expect(order.product_count).toBeGreaterThanOrEqual(0);
      expect(typeof order.is_overdue).toBe("boolean");
    }
  }

  static validateWarehouseDistributionResponse(response: any) {
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.distribution).toBeDefined();
    expect(Array.isArray(response.body.data.distribution)).toBe(true);

    if (response.body.data.distribution.length > 0) {
      const item = response.body.data.distribution[0];
      expect(item.location_id).toBeDefined();
      expect(item.location_name).toBeDefined();
      expect(item.total_products).toBeGreaterThanOrEqual(0);
      expect(item.total_quantity).toBeGreaterThanOrEqual(0);
      expect(item.total_value).toBeGreaterThanOrEqual(0);
    }
  }

  static validateSuppliersResponse(response: any) {
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.suppliers).toBeDefined();
    expect(Array.isArray(response.body.data.suppliers)).toBe(true);

    if (response.body.data.suppliers.length > 0) {
      const supplier = response.body.data.suppliers[0];
      expect(supplier.id).toBeDefined();
      expect(supplier.name).toBeDefined();
      expect(supplier.contact_name).toBeDefined();
      expect(supplier.email).toBeDefined();
      expect(supplier.phone).toBeDefined();
    }
  }

  static validateErrorResponse(response: any, expectedStatus: number) {
    expect(response.status).toBe(expectedStatus);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeDefined();
  }
}

// Performance testing helpers
export class PerformanceHelpers {
  static async measureResponseTime(
    requestFn: () => Promise<any>
  ): Promise<{ response: any; duration: number }> {
    const startTime = Date.now();
    const response = await requestFn();
    const duration = Date.now() - startTime;

    return { response, duration };
  }

  static async runConcurrentRequests(
    requestFn: () => Promise<any>,
    concurrency: number
  ): Promise<any[]> {
    const promises = Array(concurrency)
      .fill(null)
      .map(() => requestFn());
    return Promise.all(promises);
  }

  static validateResponseTime(duration: number, maxDuration: number) {
    expect(duration).toBeLessThan(maxDuration);
  }
}
