// Base API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

// Dashboard API Types
export interface SummaryMetrics {
  total_products: MetricValue;
  low_stock: MetricValue;
  out_of_stock: MetricValue;
  suppliers: MetricValue;
  total_stock_value: StockValueMetric;
}

export interface MetricValue {
  value: number;
  status: "normal" | "warning" | "critical";
  threshold?: number;
}

export interface StockValueMetric extends MetricValue {
  currency: string;
  excluded_products?: number;
}

export interface SummaryMetricsResponse {
  metrics: SummaryMetrics;
  warehouse_filter?: {
    id: number;
    name: string;
  };
  last_updated: string;
}

// Product Types
export interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string;
  category: string;
  sale_price: number;
  cost_price: number;
  reorder_point: number;
  image_url?: string;
  total_quantity: number;
  total_value: number;
  stock_status: "adequate" | "low_stock" | "out_of_stock";
  warehouse_count: number;
  locations: ProductLocation[];
  created_at: string;
  updated_at: string;
}

export interface ProductLocation {
  location_id: number;
  location_name: string;
  location_address?: string;
  quantity: number;
  unit_cost: number;
  value: number;
}

export interface StockLevelsResponse {
  products: Product[];
  filters: {
    warehouse_id?: number;
    stock_filter?: string;
    search?: string;
    category?: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

// Purchase Order Types
export interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier: Supplier;
  order_date: string;
  expected_delivery_date?: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  total_amount: number;
  product_count: number;
  products?: PurchaseOrderProduct[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderProduct {
  product_id: number;
  sku: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  quantity_received?: number;
}

export interface RecentPurchasesResponse {
  recent_orders: PurchaseOrder[];
  warehouse_filter?: {
    id: number;
    name: string;
  };
}

// Supplier Types
export interface Supplier {
  id: number;
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  supplier_type?: string;
  last_order_date?: string;
  average_delivery_days?: number;
  reliability_score?: number;
  created_at: string;
  updated_at: string;
}

export interface SuppliersResponse {
  suppliers: Supplier[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

// Warehouse Types
export interface Warehouse {
  id: number;
  name: string;
  address: string;
  city?: string;
  state?: string;
  zip_code?: string;
  warehouse_type?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WarehouseDistribution {
  warehouse: Warehouse;
  products: ProductLocation[];
  total_products: number;
  total_value: number;
  low_stock_count: number;
  out_of_stock_count: number;
}

export interface WarehouseDistributionResponse {
  distributions: WarehouseDistribution[];
  filters: {
    warehouse_id?: number;
  };
}

// Stock Visualization Types
export interface StockVisualizationData {
  product_id: number;
  product_name: string;
  sku: string;
  warehouses: WarehouseStockData[];
}

export interface WarehouseStockData {
  warehouse_id: number;
  warehouse_name: string;
  quantity: number;
  color: string;
}

export interface StockVisualizationResponse {
  chart_data: {
    products: StockVisualizationData[];
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

// Reorder Suggestions Types
export interface ReorderSuggestion {
  product_id: number;
  sku: string;
  name: string;
  category: string;
  current_stock: number;
  reorder_point: number;
  suggested_quantity: number;
  urgency_score: number;
  days_until_reorder: number;
  primary_supplier?: Supplier;
  stock_trend: "declining" | "stable" | "increasing";
  average_daily_usage: number;
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

// Product Management Types
export interface CreateProductRequest {
  name: string;
  sku: string;
  description?: string;
  category: string;
  cost_price: number;
  sale_price: number;
  reorder_point: number;
  image_url?: string;
  warehouse_stock: WarehouseStockInput[];
}

export interface WarehouseStockInput {
  warehouse_id: number;
  initial_quantity: number;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  category?: string;
  cost_price?: number;
  sale_price?: number;
  reorder_point?: number;
  image_url?: string;
}

export interface ProductValidationResponse {
  valid: boolean;
  errors?: Record<string, string[]>;
  suggestions?: {
    sku?: string;
    category?: string;
  };
}

// Purchase Order Creation Types
export interface CreatePurchaseOrderRequest {
  supplier_id: number;
  expected_delivery_date?: string;
  notes?: string;
  products: PurchaseOrderProductInput[];
  warehouse_id?: number;
}

export interface PurchaseOrderProductInput {
  product_id: number;
  quantity: number;
  unit_price: number;
}

// Filter and Search Types
export interface FilterOptions {
  categories: string[];
  suppliers: { id: number; name: string }[];
  warehouses: { id: number; name: string }[];
  stock_statuses: { value: string; label: string; count: number }[];
}

export interface SearchFilters {
  search?: string;
  category?: string;
  stock_filter?: "all" | "low_stock" | "out_of_stock";
  warehouse_id?: number;
  supplier_id?: number;
  price_min?: number;
  price_max?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// Inline Edit Types
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
  affected_metrics: {
    total_stock_value?: number;
    stock_status_changed?: boolean;
    new_stock_status?: string;
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

// Real-time Update Types
export interface RealTimeUpdate {
  type: "product_updated" | "stock_changed" | "order_status_changed";
  product_id?: number;
  changes: Record<string, { old_value: any; new_value: any }>;
  affected_components: string[];
  updated_metrics?: Record<string, any>;
  timestamp: string;
  user_id?: number;
}
