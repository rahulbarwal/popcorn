// API request and response type definitions

import {
  Company,
  Location,
  Product,
  ProductVariant,
  PurchaseOrder,
} from "./database";

// Import pagination types to avoid circular dependency
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// Common API response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
  code?: string;
  stack?: string;
  details?: any;
}

// Note: PaginationParams, PaginationMeta, and PaginatedResponse are defined in index.ts

// Dashboard API types
export interface SummaryMetrics {
  total_products: {
    value: number;
    status: "normal" | "warning" | "critical";
  };
  low_stock: {
    value: number;
    status: "normal" | "warning" | "critical";
    threshold?: number;
  };
  out_of_stock: {
    value: number;
    status: "normal" | "warning" | "critical";
  };
  suppliers: {
    value: number;
    status: "normal" | "warning" | "critical";
  };
  total_stock_value: {
    value: number;
    currency: string;
    status: "normal" | "warning" | "critical";
    excluded_products?: number;
  };
}

export interface SummaryMetricsResponse {
  metrics: SummaryMetrics;
  warehouse_filter?: {
    id: number;
    name: string;
  };
  last_updated: string;
}

export interface StockLevelItem {
  id: number;
  sku: string;
  name: string;
  category: string;
  image_url?: string;
  total_quantity: number;
  unit_cost: number;
  total_value: number;
  reorder_point: number;
  stock_status: "adequate" | "low_stock" | "out_of_stock";
  locations: Array<{
    location_id: number;
    location_name: string;
    quantity: number;
    unit_cost: number;
  }>;
}

export interface StockLevelsResponse {
  products: StockLevelItem[];
  filters: {
    warehouse_id?: number;
    stock_filter?: "all" | "low_stock" | "out_of_stock";
    search?: string;
    category?: string;
  };
  pagination?: PaginationMeta;
}

export interface RecentPurchaseOrder {
  id: number;
  po_number: string;
  supplier: {
    id: number;
    name: string;
    contact_name?: string;
  };
  order_date: string;
  expected_delivery_date?: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  product_count: number;
  total_amount: number;
  is_overdue?: boolean;
}

export interface RecentPurchasesResponse {
  recent_orders: RecentPurchaseOrder[];
  warehouse_filter?: {
    id: number;
    name: string;
  };
}

export interface WarehouseDistributionItem {
  warehouse_id: number;
  warehouse_name: string;
  warehouse_address?: string;
  products: Array<{
    product_id: number;
    sku: string;
    name: string;
    quantity: number;
    unit_cost: number;
    total_value: number;
  }>;
  total_products: number;
  total_value: number;
}

export interface WarehouseDistributionResponse {
  warehouses: WarehouseDistributionItem[];
}

// Stock visualization types
export interface StockVisualizationProduct {
  product_id: number;
  product_name: string;
  sku: string;
  warehouses: Array<{
    warehouse_id: number;
    warehouse_name: string;
    quantity: number;
    color: string;
  }>;
}

export interface StockVisualizationResponse {
  chart_data: {
    products: StockVisualizationProduct[];
    chart_config: {
      title: string;
      x_axis_label: string;
      y_axis_label: string;
      color_palette: string[];
    };
  };
  filters: {
    warehouse_id?: number;
    warehouse_name: string;
  };
  last_updated: string;
}

// Product management types
export interface ProductCreateRequest {
  name: string;
  sku: string;
  description?: string;
  category: string;
  cost_price: number;
  sale_price: number;
  reorder_point: number;
  image_url?: string;
  warehouse_stock?: Array<{
    warehouse_id: number;
    initial_quantity: number;
  }>;
}

export interface ProductUpdateRequest {
  name?: string;
  description?: string;
  category?: string;
  cost_price?: number;
  sale_price?: number;
  reorder_point?: number;
  image_url?: string;
}

export interface ProductDetailResponse {
  product: Product & {
    stock_levels: Array<{
      warehouse_id: number;
      warehouse_name: string;
      warehouse_address?: string;
      quantity: number;
      unit_cost: number;
      reorder_point: number;
    }>;
    total_stock: number;
    stock_status: "adequate" | "low_stock" | "out_of_stock";
    suppliers?: Array<{
      id: number;
      name: string;
      contact_name?: string;
      email?: string;
      phone?: string;
    }>;
    variants?: ProductVariant[];
  };
}

export interface ProductListResponse {
  products: Array<{
    id: number;
    sku: string;
    name: string;
    category: string;
    sale_price: number;
    cost_price: number;
    reorder_point: number;
    image_url?: string;
    total_stock: number;
    warehouse_count: number;
    stock_status: "adequate" | "low_stock" | "out_of_stock";
  }>;
  filters: {
    search?: string;
    category?: string;
    stock_filter?: "all" | "in_stock" | "low_stock" | "out_of_stock";
  };
  pagination?: PaginationMeta;
}

// Reorder suggestions types
export interface ReorderSuggestion {
  product_id: number;
  sku: string;
  name: string;
  category: string;
  current_stock: number;
  reorder_point: number;
  suggested_quantity: number;
  urgency_score: number;
  days_until_reorder?: number;
  primary_supplier?: {
    id: number;
    name: string;
    last_order_date?: string;
  };
  stock_trend?: "declining" | "stable" | "increasing";
  average_daily_usage?: number;
}

export interface ReorderSuggestionsResponse {
  suggestions: ReorderSuggestion[];
  total_suggestions: number;
  warehouse_filter?: {
    id: number;
    name: string;
  };
  last_updated: string;
}

// Purchase order creation types
export interface PurchaseOrderCreateRequest {
  supplier_id: number;
  expected_delivery_date?: string;
  notes?: string;
  products: Array<{
    product_id: number;
    quantity: number;
    unit_price: number;
  }>;
  warehouse_id?: number;
}

export interface PurchaseOrderCreateResponse {
  purchase_order: PurchaseOrder & {
    supplier: {
      id: number;
      name: string;
      contact_name?: string;
      email?: string;
    };
    products: Array<{
      product_id: number;
      sku: string;
      name: string;
      quantity: number;
      unit_price: number;
      total_price: number;
    }>;
  };
  message: string;
}

// Validation error types
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationErrorResponse {
  success: false;
  message: string;
  errors: ValidationError[];
}

// Filter and query parameter types
export interface DashboardFilters {
  warehouse_id?: number;
  stock_filter?: "all" | "low_stock" | "out_of_stock";
  date_from?: string;
  date_to?: string;
}

export interface ProductFilters {
  search?: string;
  category?: string;
  stock_filter?: "all" | "in_stock" | "low_stock" | "out_of_stock";
  price_min?: number;
  price_max?: number;
  warehouse_id?: number;
}

export interface PurchaseOrderFilters {
  supplier_id?: number;
  status?: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  date_from?: string;
  date_to?: string;
  warehouse_id?: number;
}

// Inline edit types
export interface InlineEditRequest {
  field: "sale_price" | "cost_price" | "category" | "reorder_point";
  value: string | number;
  product_id: number;
}

export interface InlineEditResponse {
  success: boolean;
  product: {
    id: number;
    field: string;
    old_value: any;
    new_value: any;
    updated_at: string;
  };
  affected_metrics?: {
    total_stock_value?: number;
    stock_status_changed?: boolean;
    new_stock_status?: "adequate" | "low_stock" | "out_of_stock";
  };
  message: string;
}

export interface BulkFieldUpdateRequest {
  product_id: number;
  fields: {
    sale_price?: number;
    cost_price?: number;
    category?: string;
    reorder_point?: number;
  };
}

export interface BulkFieldUpdateResponse {
  success: boolean;
  product: {
    id: number;
    updated_fields: Record<
      string,
      {
        old_value: any;
        new_value: any;
      }
    >;
    updated_at: string;
  };
  affected_metrics?: {
    total_stock_value?: number;
    stock_status_changed?: boolean;
    new_stock_status?: "adequate" | "low_stock" | "out_of_stock";
  };
  message: string;
}
