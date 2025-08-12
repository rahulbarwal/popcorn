// Export all repository classes

export { BaseRepository } from "./BaseRepository";
export { CompanyRepository } from "./CompanyRepository";
export { LocationRepository } from "./LocationRepository";
export { ProductRepository } from "./ProductRepository";
export { ProductLocationRepository } from "./ProductLocationRepository";
export { PurchaseOrderRepository } from "./PurchaseOrderRepository";

// Import classes for instance creation
import { CompanyRepository } from "./CompanyRepository";
import { LocationRepository } from "./LocationRepository";
import { ProductRepository } from "./ProductRepository";
import { ProductLocationRepository } from "./ProductLocationRepository";
import { PurchaseOrderRepository } from "./PurchaseOrderRepository";

// Create repository instances for easy import
export const companyRepository = new CompanyRepository();
export const locationRepository = new LocationRepository();
export const productRepository = new ProductRepository();
export const productLocationRepository = new ProductLocationRepository();
export const purchaseOrderRepository = new PurchaseOrderRepository();
