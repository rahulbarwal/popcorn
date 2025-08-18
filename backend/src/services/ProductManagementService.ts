import { Knex } from "knex";
import db from "../config/database";
import {
  ProductRepository,
  ProductLocationRepository,
  LocationRepository,
  CompanyRepository,
} from "../repositories";
import {
  Product,
  ProductInput,
  ProductUpdate,
  ProductLocation,
  ProductLocationInput,
  StockStatus,
  ID,
  PaginationParams,
  PaginationMeta,
  ProductCreateRequest,
  ProductUpdateRequest,
  ProductDetailResponse,
  ProductListResponse,
} from "../types";

export interface ProductManagementFilters {
  search?: string;
  category?: string;
  stock_filter?: "all" | "in_stock" | "low_stock" | "out_of_stock";
  price_min?: number;
  price_max?: number;
  warehouse_id?: number;
}

export interface ProductWithStock extends Product {
  total_stock: number;
  warehouse_count: number;
  stock_status: StockStatus;
  total_value: number;
}

export interface WarehouseStockLevel {
  warehouse_id: number;
  initial_quantity: number;
}

export class ProductManagementService {
  private productRepository: ProductRepository;
  private productLocationRepository: ProductLocationRepository;
  private locationRepository: LocationRepository;
  private companyRepository: CompanyRepository;

  constructor() {
    this.productRepository = new ProductRepository();
    this.productLocationRepository = new ProductLocationRepository();
    this.locationRepository = new LocationRepository();
    this.companyRepository = new CompanyRepository();
  }

  /**
   * Create a new product with per-warehouse stock level initialization
   */
  async createProduct(
    productData: ProductCreateRequest
  ): Promise<ProductDetailResponse> {
    return db.transaction(async (trx: Knex.Transaction) => {
      try {
        // Validate SKU uniqueness
        const existingSku = await this.productRepository.skuExists(
          productData.sku
        );
        if (existingSku) {
          throw new Error(`SKU '${productData.sku}' already exists`);
        }

        // Validate reorder point
        if (productData.reorder_point < 0) {
          throw new Error("Reorder point must be a non-negative number");
        }

        // Validate pricing
        if (productData.sale_price < productData.cost_price) {
          throw new Error(
            "Sale price must be greater than or equal to cost price"
          );
        }

        // Create the product
        const productInput: ProductInput = {
          name: productData.name,
          sku: productData.sku,
          description: productData.description,
          category: productData.category,
          cost_price: productData.cost_price,
          sale_price: productData.sale_price,
          reorder_point: productData.reorder_point,
          image_url: productData.image_url,
          active: true,
        };

        const [product] = await trx("products")
          .insert(productInput)
          .returning("*");

        // Create warehouse stock levels if provided
        const stockLevels: Array<{
          warehouse_id: number;
          warehouse_name: string;
          quantity: number;
          unit_cost: number;
        }> = [];

        if (
          productData.warehouse_stock &&
          productData.warehouse_stock.length > 0
        ) {
          for (const warehouseStock of productData.warehouse_stock) {
            // Validate warehouse exists
            const warehouse = await this.locationRepository.findById(
              warehouseStock.warehouse_id
            );
            if (!warehouse) {
              throw new Error(
                `Warehouse with ID ${warehouseStock.warehouse_id} not found`
              );
            }

            // Validate quantity
            if (warehouseStock.initial_quantity < 0) {
              throw new Error("Initial quantity must be non-negative");
            }

            // Create product location record
            const productLocationInput: ProductLocationInput = {
              product_id: product.id,
              location_id: warehouseStock.warehouse_id,
              quantity_on_hand: warehouseStock.initial_quantity,
              quantity_reserved: 0,
              quantity_available: warehouseStock.initial_quantity,
              unit_cost: productData.cost_price,
              reorder_point: productData.reorder_point,
            };

            await trx("product_locations").insert(productLocationInput);

            stockLevels.push({
              warehouse_id: warehouseStock.warehouse_id,
              warehouse_name: warehouse.name,
              quantity: warehouseStock.initial_quantity,
              unit_cost: productData.cost_price,
            });
          }
        }

        // Calculate total stock and stock status
        const totalStock = stockLevels.reduce(
          (sum, level) => sum + level.quantity,
          0
        );
        const stockStatus = this.calculateStockStatus(
          totalStock,
          product.reorder_point
        );

        return {
          product: {
            ...product,
            stock_levels: stockLevels,
            total_stock: totalStock,
            stock_status: stockStatus,
          },
        };
      } catch (error) {
        throw error;
      }
    });
  }

  /**
   * Get product list with filtering, sorting, and pagination
   */
  async getProducts(
    filters: ProductManagementFilters = {},
    pagination?: PaginationParams,
    sortBy: string = "name",
    sortOrder: "asc" | "desc" = "asc"
  ): Promise<ProductListResponse> {
    // Build the query with filters
    const products = await this.getProductsWithStockLevels(
      filters,
      pagination,
      sortBy,
      sortOrder
    );

    // Get total count for pagination
    let paginationMeta: PaginationMeta | undefined;
    if (pagination) {
      const total = await this.countFilteredProducts(filters);
      paginationMeta = this.calculatePaginationMeta(pagination, total);
    }

    return {
      products: products.map((product) => ({
        id: product.id,
        sku: product.sku,
        name: product.name,
        category: product.category,
        sale_price: product.sale_price,
        cost_price: product.cost_price,
        reorder_point: product.reorder_point,
        image_url: product.image_url,
        total_stock: product.total_stock,
        warehouse_count: product.warehouse_count,
        stock_status: product.stock_status,
      })),
      filters: {
        search: filters.search,
        category: filters.category,
        stock_filter: filters.stock_filter || "all",
      },
      pagination: paginationMeta,
    };
  }

  /**
   * Get detailed product information with stock breakdown
   */
  async getProductById(productId: number): Promise<ProductDetailResponse> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    // Get stock levels breakdown
    const stockLevels = await this.getProductStockBreakdown(productId);

    // Get suppliers (if any)
    const suppliers = await this.getProductSuppliers(productId);

    // Calculate total stock and status
    const totalStock = stockLevels.reduce(
      (sum, level) => sum + level.quantity,
      0
    );
    const stockStatus = this.calculateStockStatus(
      totalStock,
      product.reorder_point
    );

    return {
      product: {
        ...product,
        stock_levels: stockLevels,
        total_stock: totalStock,
        stock_status: stockStatus,
        suppliers,
      },
    };
  }

  /**
   * Update existing product
   */
  async updateProduct(
    productId: number,
    updateData: ProductUpdateRequest
  ): Promise<ProductDetailResponse> {
    const existingProduct = await this.productRepository.findById(productId);
    if (!existingProduct) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    // Validate pricing if both are provided
    if (updateData.sale_price && updateData.cost_price) {
      if (updateData.sale_price < updateData.cost_price) {
        throw new Error(
          "Sale price must be greater than or equal to cost price"
        );
      }
    } else if (
      updateData.sale_price &&
      updateData.sale_price < existingProduct.cost_price
    ) {
      throw new Error("Sale price must be greater than or equal to cost price");
    } else if (
      updateData.cost_price &&
      updateData.cost_price > existingProduct.sale_price
    ) {
      throw new Error("Cost price must be less than or equal to sale price");
    }

    // Validate reorder point
    if (
      updateData.reorder_point !== undefined &&
      updateData.reorder_point < 0
    ) {
      throw new Error("Reorder point must be a non-negative number");
    }

    const updatedProduct = await this.productRepository.update(
      productId,
      updateData as ProductUpdate
    );

    if (!updatedProduct) {
      throw new Error("Failed to update product");
    }

    return this.getProductById(productId);
  }

  /**
   * Delete product with safety checks
   */
  async deleteProduct(productId: number): Promise<void> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    // Check for active purchase orders
    const activePurchaseOrders = await this.checkActivePurchaseOrders(
      productId
    );
    if (activePurchaseOrders > 0) {
      throw new Error(
        "Cannot delete product with active purchase orders. Please complete or cancel existing orders first."
      );
    }

    // Check current stock levels
    const stockLevels = await this.getProductStockBreakdown(productId);
    const totalStock = stockLevels.reduce(
      (sum, level) => sum + level.quantity,
      0
    );

    if (totalStock > 0) {
      // This is a warning, not a blocking error - allow deletion with confirmation
      console.warn(
        `Deleting product ${product.sku} with ${totalStock} units in stock`
      );
    }

    // Delete in transaction
    await db.transaction(async (trx: Knex.Transaction) => {
      // Delete product locations first (foreign key constraint)
      await trx("product_locations").where("product_id", productId).del();

      // Delete the product
      await trx("products").where("id", productId).del();
    });
  }

  /**
   * Get all available categories
   */
  async getCategories(): Promise<string[]> {
    return this.productRepository.getCategories();
  }

  /**
   * Validate SKU uniqueness
   */
  async validateSku(sku: string, excludeProductId?: number): Promise<boolean> {
    return !(await this.productRepository.skuExists(sku, excludeProductId));
  }

  /**
   * Update product inline field
   */
  async updateInlineField(
    productId: number,
    field: "sale_price" | "cost_price" | "category" | "reorder_point",
    value: any
  ): Promise<Product> {
    const existingProduct = await this.productRepository.findById(productId);
    if (!existingProduct) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    // Validate field-specific rules
    await this.validateInlineFieldUpdate(existingProduct, field, value);

    const updatedProduct = await this.productRepository.updateInlineField(
      productId,
      field,
      value
    );

    if (!updatedProduct) {
      throw new Error("Failed to update product field");
    }

    return updatedProduct;
  }

  /**
   * Get products with stock levels using optimized query
   */
  private async getProductsWithStockLevels(
    filters: ProductManagementFilters,
    pagination?: PaginationParams,
    sortBy: string = "name",
    sortOrder: "asc" | "desc" = "asc"
  ): Promise<ProductWithStock[]> {
    const params: any[] = [];
    let whereClause = "WHERE p.active = true";

    // Apply filters
    if (filters.search) {
      whereClause +=
        " AND (p.name ILIKE ? OR p.sku ILIKE ? OR p.description ILIKE ?)";
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters.category) {
      whereClause += " AND p.category = ?";
      params.push(filters.category);
    }

    if (filters.price_min !== undefined) {
      whereClause += " AND p.sale_price >= ?";
      params.push(filters.price_min);
    }

    if (filters.price_max !== undefined) {
      whereClause += " AND p.sale_price <= ?";
      params.push(filters.price_max);
    }

    if (filters.warehouse_id) {
      whereClause += " AND pl.location_id = ?";
      params.push(filters.warehouse_id);
    }

    // Apply stock filter
    let havingClause = "";
    if (filters.stock_filter === "out_of_stock") {
      havingClause = "HAVING COALESCE(SUM(pl.quantity_on_hand), 0) = 0";
    } else if (filters.stock_filter === "low_stock") {
      havingClause =
        "HAVING COALESCE(SUM(pl.quantity_on_hand), 0) < p.reorder_point AND COALESCE(SUM(pl.quantity_on_hand), 0) > 0";
    } else if (filters.stock_filter === "in_stock") {
      havingClause = "HAVING COALESCE(SUM(pl.quantity_on_hand), 0) > 0";
    }

    // Apply sorting
    const validSortFields = [
      "name",
      "sku",
      "category",
      "sale_price",
      "cost_price",
      "total_stock",
    ];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "name";
    const orderClause = `ORDER BY ${
      sortField === "total_stock" ? "total_stock" : `p.${sortField}`
    } ${sortOrder.toUpperCase()}`;

    // Apply pagination
    let limitClause = "";
    if (pagination) {
      const offset = ((pagination.page || 1) - 1) * (pagination.limit || 50);
      limitClause = `LIMIT ${pagination.limit || 50} OFFSET ${offset}`;
    }

    const query = `
      SELECT 
        p.id,
        p.sku,
        p.name,
        p.category,
        p.sale_price,
        p.cost_price,
        p.reorder_point,
        p.image_url,
        p.created_at,
        p.updated_at,
        p.active,
        p.description,
        COALESCE(SUM(pl.quantity_on_hand), 0) as total_stock,
        COUNT(DISTINCT CASE WHEN pl.quantity_on_hand > 0 THEN pl.location_id END) as warehouse_count,
        COALESCE(SUM(pl.quantity_on_hand * pl.unit_cost), 0) as total_value
      FROM products p
      LEFT JOIN product_locations pl ON p.id = pl.product_id
      ${whereClause}
      GROUP BY p.id, p.sku, p.name, p.category, p.sale_price, p.cost_price, p.reorder_point, p.image_url, p.created_at, p.updated_at, p.active, p.description
      ${havingClause}
      ${orderClause}
      ${limitClause}
    `;

    const result = await this.productRepository.raw(query, params);
    const products = result.rows || result;

    return products.map((product: any) => ({
      ...product,
      total_stock: parseInt(product.total_stock),
      warehouse_count: parseInt(product.warehouse_count),
      total_value: parseFloat(product.total_value),
      stock_status: this.calculateStockStatus(
        parseInt(product.total_stock),
        product.reorder_point
      ),
    }));
  }

  /**
   * Get product stock breakdown by warehouse
   */
  private async getProductStockBreakdown(productId: number): Promise<
    Array<{
      warehouse_id: number;
      warehouse_name: string;
      warehouse_address?: string;
      quantity: number;
      unit_cost: number;
      reorder_point: number;
    }>
  > {
    const query = `
      SELECT 
        l.id as warehouse_id,
        l.name as warehouse_name,
        l.address as warehouse_address,
        pl.quantity_on_hand as quantity,
        pl.unit_cost,
        pl.reorder_point
      FROM product_locations pl
      JOIN locations l ON pl.location_id = l.id
      WHERE pl.product_id = ?
      ORDER BY l.name
    `;

    const result = await this.productRepository.raw(query, [productId]);
    const stockLevels = result.rows || result;

    return stockLevels.map((level: any) => ({
      warehouse_id: level.warehouse_id,
      warehouse_name: level.warehouse_name,
      warehouse_address: level.warehouse_address,
      quantity: parseInt(level.quantity),
      unit_cost: parseFloat(level.unit_cost),
      reorder_point: level.reorder_point,
    }));
  }

  /**
   * Get product suppliers
   */
  private async getProductSuppliers(productId: number): Promise<
    Array<{
      id: number;
      name: string;
      contact_name?: string;
      email?: string;
      phone?: string;
    }>
  > {
    // This would require a product_suppliers junction table
    // For now, return empty array as the table doesn't exist in current schema
    return [];
  }

  /**
   * Check for active purchase orders
   */
  private async checkActivePurchaseOrders(productId: number): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM purchase_order_products pop
      JOIN purchase_orders po ON pop.purchase_order_id = po.id
      WHERE pop.product_id = ? 
      AND po.status IN ('pending', 'confirmed', 'shipped')
    `;

    const result = await this.productRepository.raw(query, [productId]);
    const countResult = result.rows ? result.rows[0] : result[0];

    return parseInt(countResult?.count || "0");
  }

  /**
   * Count filtered products for pagination
   */
  private async countFilteredProducts(
    filters: ProductManagementFilters
  ): Promise<number> {
    const params: any[] = [];
    let whereClause = "WHERE p.active = true";

    if (filters.search) {
      whereClause +=
        " AND (p.name ILIKE ? OR p.sku ILIKE ? OR p.description ILIKE ?)";
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters.category) {
      whereClause += " AND p.category = ?";
      params.push(filters.category);
    }

    if (filters.price_min !== undefined) {
      whereClause += " AND p.sale_price >= ?";
      params.push(filters.price_min);
    }

    if (filters.price_max !== undefined) {
      whereClause += " AND p.sale_price <= ?";
      params.push(filters.price_max);
    }

    if (filters.warehouse_id) {
      whereClause += " AND pl.location_id = ?";
      params.push(filters.warehouse_id);
    }

    let havingClause = "";
    if (filters.stock_filter === "out_of_stock") {
      havingClause = "HAVING COALESCE(SUM(pl.quantity_on_hand), 0) = 0";
    } else if (filters.stock_filter === "low_stock") {
      havingClause =
        "HAVING COALESCE(SUM(pl.quantity_on_hand), 0) < p.reorder_point AND COALESCE(SUM(pl.quantity_on_hand), 0) > 0";
    } else if (filters.stock_filter === "in_stock") {
      havingClause = "HAVING COALESCE(SUM(pl.quantity_on_hand), 0) > 0";
    }

    const query = `
      SELECT COUNT(*) as total
      FROM (
        SELECT p.id
        FROM products p
        LEFT JOIN product_locations pl ON p.id = pl.product_id
        ${whereClause}
        GROUP BY p.id, p.reorder_point
        ${havingClause}
      ) as filtered_products
    `;

    const result = await this.productRepository.raw(query, params);
    const countResult = result.rows ? result.rows[0] : result[0];

    return parseInt(countResult?.total || "0");
  }

  /**
   * Calculate pagination metadata
   */
  private calculatePaginationMeta(
    pagination: PaginationParams,
    total: number
  ): PaginationMeta {
    const page = pagination.page || 1;
    const limit = pagination.limit || 50;
    const totalPages = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  /**
   * Calculate stock status based on quantity and reorder point
   */
  private calculateStockStatus(
    quantity: number,
    reorderPoint: number
  ): StockStatus {
    if (quantity === 0) return "out_of_stock";
    if (quantity < reorderPoint) return "low_stock";
    return "adequate";
  }

  /**
   * Validate inline field update
   */
  private async validateInlineFieldUpdate(
    product: Product,
    field: string,
    value: any
  ): Promise<void> {
    switch (field) {
      case "sale_price":
        if (typeof value !== "number" || value < 0) {
          throw new Error("Sale price must be a positive number");
        }
        if (value < product.cost_price) {
          throw new Error(
            "Sale price must be greater than or equal to cost price"
          );
        }
        break;

      case "cost_price":
        if (typeof value !== "number" || value < 0) {
          throw new Error("Cost price must be a positive number");
        }
        if (value > product.sale_price) {
          throw new Error(
            "Cost price must be less than or equal to sale price"
          );
        }
        break;

      case "reorder_point":
        if (typeof value !== "number" || value < 0) {
          throw new Error("Reorder point must be a non-negative number");
        }
        break;

      case "category":
        if (typeof value !== "string" || value.trim().length === 0) {
          throw new Error("Category must be a non-empty string");
        }
        break;

      default:
        throw new Error(`Invalid field: ${field}`);
    }
  }
}
