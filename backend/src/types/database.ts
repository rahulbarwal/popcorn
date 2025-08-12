// Database entity interfaces based on the migration schema

export interface Company {
  id: number;
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  supplier_type: "primary" | "secondary" | "backup";
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Location {
  id: number;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  warehouse_type: "main" | "secondary" | "distribution" | "storage";
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

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
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  variant_name: string;
  variant_sku: string;
  attributes?: Record<string, any>;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ProductLocation {
  id: number;
  product_id: number;
  product_variant_id?: number;
  location_id: number;
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
  unit_cost: number;
  reorder_point: number;
  last_updated: Date;
  created_at: Date;
  updated_at: Date;
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  order_date: Date;
  expected_delivery_date?: Date;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  total_amount: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface PurchaseOrderProduct {
  id: number;
  purchase_order_id: number;
  product_id: number;
  product_variant_id?: number;
  quantity_ordered: number;
  unit_price: number;
  total_price: number;
  quantity_received: number;
  created_at: Date;
  updated_at: Date;
}

// Input types for creating new records (without auto-generated fields)
export type CompanyInput = Omit<Company, "id" | "created_at" | "updated_at">;
export type LocationInput = Omit<Location, "id" | "created_at" | "updated_at">;
export type ProductInput = Omit<Product, "id" | "created_at" | "updated_at">;
export type ProductVariantInput = Omit<
  ProductVariant,
  "id" | "created_at" | "updated_at"
>;
export type ProductLocationInput = Omit<
  ProductLocation,
  "id" | "created_at" | "updated_at" | "last_updated"
>;
export type PurchaseOrderInput = Omit<
  PurchaseOrder,
  "id" | "created_at" | "updated_at"
>;
export type PurchaseOrderProductInput = Omit<
  PurchaseOrderProduct,
  "id" | "created_at" | "updated_at"
>;

// Update types for partial updates
export type CompanyUpdate = Partial<CompanyInput>;
export type LocationUpdate = Partial<LocationInput>;
export type ProductUpdate = Partial<ProductInput>;
export type ProductVariantUpdate = Partial<ProductVariantInput>;
export type ProductLocationUpdate = Partial<ProductLocationInput>;
export type PurchaseOrderUpdate = Partial<PurchaseOrderInput>;
export type PurchaseOrderProductUpdate = Partial<PurchaseOrderProductInput>;
