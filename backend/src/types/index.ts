// Export all types and interfaces

// Common utility types
export type ID = number;
export type Timestamp = Date;
export type Currency = number;
export type Percentage = number;

// Status types
export type StockStatus = "adequate" | "low_stock" | "out_of_stock";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";
export type SupplierType = "primary" | "secondary" | "backup";
export type WarehouseType = "main" | "secondary" | "distribution" | "storage";
export type MetricStatus = "normal" | "warning" | "critical";
export type StockTrend = "declining" | "stable" | "increasing";

// Filter types
export type StockFilter = "all" | "low_stock" | "out_of_stock";
export type ProductStockFilter =
  | "all"
  | "in_stock"
  | "low_stock"
  | "out_of_stock";
export type SortOrder = "asc" | "desc";

// Editable field types for inline editing
export type EditableProductField =
  | "sale_price"
  | "cost_price"
  | "category"
  | "reorder_point";

// Error types
export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}

export interface DatabaseError extends Error {
  code?: string;
  constraint?: string;
  table?: string;
  column?: string;
}

// Configuration types
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  pool?: {
    min: number;
    max: number;
    acquireTimeoutMillis?: number;
    createTimeoutMillis?: number;
    destroyTimeoutMillis?: number;
    idleTimeoutMillis?: number;
    reapIntervalMillis?: number;
    createRetryIntervalMillis?: number;
  };
}

export interface ServerConfig {
  port: number;
  env: "development" | "production" | "test";
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  rateLimit?: {
    windowMs: number;
    max: number;
  };
}

// Pagination types (defined here to avoid circular dependencies)
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

// Repository interface for common CRUD operations
export interface Repository<T, TInput, TUpdate> {
  findAll(filters?: any, pagination?: PaginationParams): Promise<T[]>;
  findById(id: ID): Promise<T | null>;
  create(data: TInput): Promise<T>;
  update(id: ID, data: TUpdate): Promise<T | null>;
  delete(id: ID): Promise<boolean>;
  count(filters?: any): Promise<number>;
}

// Service interface for business logic
export interface Service<T, TInput, TUpdate> {
  getAll(
    filters?: any,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<T>>;
  getById(id: ID): Promise<T>;
  create(data: TInput): Promise<T>;
  update(id: ID, data: TUpdate): Promise<T>;
  delete(id: ID): Promise<void>;
}

// Cache interface
export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

// Event types for real-time updates
export interface RealTimeEvent {
  type: string;
  data: any;
  timestamp: Date;
  userId?: number;
}

export interface ProductUpdatedEvent extends RealTimeEvent {
  type: "product_updated";
  data: {
    product_id: number;
    changes: Record<string, { old_value: any; new_value: any }>;
    affected_components: string[];
    updated_metrics?: Record<string, any>;
  };
}

export interface StockLevelChangedEvent extends RealTimeEvent {
  type: "stock_level_changed";
  data: {
    product_id: number;
    warehouse_id: number;
    old_quantity: number;
    new_quantity: number;
    stock_status_changed: boolean;
    new_stock_status?: StockStatus;
  };
}

export interface PurchaseOrderStatusChangedEvent extends RealTimeEvent {
  type: "purchase_order_status_changed";
  data: {
    purchase_order_id: number;
    old_status: OrderStatus;
    new_status: OrderStatus;
    affected_products: number[];
  };
}

// Database types
export * from "./database";

// API types
export * from "./api";

// Validation types and schemas
export * from "./validation";
