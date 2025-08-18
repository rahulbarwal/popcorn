import { Request, Response } from "express";
import { ProductManagementService } from "../services/ProductManagementService";
import { LocationRepository } from "../repositories/LocationRepository";
import {
  ProductCreateRequest,
  ProductUpdateRequest,
  PaginationParams,
  ApiResponse,
  InlineEditRequest,
  BulkFieldUpdateRequest,
} from "../types";

export class ProductManagementController {
  private productManagementService: ProductManagementService;
  private locationRepository: LocationRepository;

  constructor() {
    this.productManagementService = new ProductManagementService();
    this.locationRepository = new LocationRepository();
  }

  /**
   * GET /api/products - Get products with filtering, sorting, and pagination
   */
  async getProducts(req: Request, res: Response): Promise<void> {
    try {
      const {
        search,
        category,
        stock_filter,
        price_min,
        price_max,
        warehouse_id,
        page = 1,
        limit = 50,
        sort_by = "name",
        sort_order = "asc",
      } = req.query;

      const filters = {
        search: search as string,
        category: category as string,
        stock_filter: stock_filter as
          | "all"
          | "in_stock"
          | "low_stock"
          | "out_of_stock",
        price_min: price_min ? parseFloat(price_min as string) : undefined,
        price_max: price_max ? parseFloat(price_max as string) : undefined,
        warehouse_id: warehouse_id
          ? parseInt(warehouse_id as string)
          : undefined,
      };

      const pagination: PaginationParams = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      };

      const result = await this.productManagementService.getProducts(
        filters,
        pagination,
        sort_by as string,
        sort_order as "asc" | "desc"
      );

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
      res.status(500).json(response);
    }
  }

  /**
   * GET /api/products/:id - Get detailed product information
   */
  async getProductById(req: Request, res: Response): Promise<void> {
    try {
      const productId = parseInt(req.params.id);

      if (isNaN(productId)) {
        const response: ApiResponse = {
          success: false,
          error: "Invalid product ID",
        };
        res.status(400).json(response);
        return;
      }

      const result = await this.productManagementService.getProductById(
        productId
      );

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      const statusCode =
        error instanceof Error && error.message.includes("not found")
          ? 404
          : 500;
      const response: ApiResponse = {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
      res.status(statusCode).json(response);
    }
  }

  /**
   * POST /api/products - Create new product with per-warehouse stock levels
   */
  async createProduct(req: Request, res: Response): Promise<void> {
    try {
      const productData: ProductCreateRequest = req.body;

      // Validate required fields
      const validationErrors = this.validateProductCreateRequest(productData);
      if (validationErrors.length > 0) {
        const response: ApiResponse = {
          success: false,
          error: "Validation failed",
          errors: validationErrors.reduce((acc, error) => {
            acc[error.field] = [error.message];
            return acc;
          }, {} as Record<string, string[]>),
        };
        res.status(400).json(response);
        return;
      }

      const result = await this.productManagementService.createProduct(
        productData
      );

      const response: ApiResponse = {
        success: true,
        data: result,
        message: "Product created successfully",
      };

      res.status(201).json(response);
    } catch (error) {
      const statusCode =
        error instanceof Error && error.message.includes("already exists")
          ? 409
          : 500;
      const response: ApiResponse = {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
      res.status(statusCode).json(response);
    }
  }

  /**
   * PUT /api/products/:id - Update existing product
   */
  async updateProduct(req: Request, res: Response): Promise<void> {
    try {
      const productId = parseInt(req.params.id);
      const updateData: ProductUpdateRequest = req.body;

      if (isNaN(productId)) {
        const response: ApiResponse = {
          success: false,
          error: "Invalid product ID",
        };
        res.status(400).json(response);
        return;
      }

      // Validate update data
      const validationErrors = this.validateProductUpdateRequest(updateData);
      if (validationErrors.length > 0) {
        const response: ApiResponse = {
          success: false,
          error: "Validation failed",
          errors: validationErrors.reduce((acc, error) => {
            acc[error.field] = [error.message];
            return acc;
          }, {} as Record<string, string[]>),
        };
        res.status(400).json(response);
        return;
      }

      const result = await this.productManagementService.updateProduct(
        productId,
        updateData
      );

      const response: ApiResponse = {
        success: true,
        data: result,
        message: "Product updated successfully",
      };

      res.json(response);
    } catch (error) {
      const statusCode =
        error instanceof Error && error.message.includes("not found")
          ? 404
          : 500;
      const response: ApiResponse = {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
      res.status(statusCode).json(response);
    }
  }

  /**
   * DELETE /api/products/:id - Delete product with safety checks
   */
  async deleteProduct(req: Request, res: Response): Promise<void> {
    try {
      const productId = parseInt(req.params.id);

      if (isNaN(productId)) {
        const response: ApiResponse = {
          success: false,
          error: "Invalid product ID",
        };
        res.status(400).json(response);
        return;
      }

      await this.productManagementService.deleteProduct(productId);

      const response: ApiResponse = {
        success: true,
        message: "Product deleted successfully",
      };

      res.json(response);
    } catch (error) {
      let statusCode = 500;
      if (error instanceof Error) {
        if (error.message.includes("not found")) {
          statusCode = 404;
        } else if (error.message.includes("active purchase orders")) {
          statusCode = 409;
        }
      }

      const response: ApiResponse = {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
      res.status(statusCode).json(response);
    }
  }

  /**
   * GET /api/products/categories - Get all available categories
   */
  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await this.productManagementService.getCategories();

      const response: ApiResponse = {
        success: true,
        data: { categories },
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
      res.status(500).json(response);
    }
  }

  /**
   * GET /api/products/validate-sku/:sku - Validate SKU uniqueness
   */
  async validateSku(req: Request, res: Response): Promise<void> {
    try {
      const { sku } = req.params;
      const { exclude_product_id } = req.query;

      const excludeId = exclude_product_id
        ? parseInt(exclude_product_id as string)
        : undefined;
      const isValid = await this.productManagementService.validateSku(
        sku,
        excludeId
      );

      const response: ApiResponse = {
        success: true,
        data: {
          sku,
          is_valid: isValid,
          message: isValid ? "SKU is available" : "SKU already exists",
        },
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
      res.status(500).json(response);
    }
  }

  /**
   * GET /api/warehouses - Get warehouse list for product form
   */
  async getWarehouses(req: Request, res: Response): Promise<void> {
    try {
      const warehouses = await this.locationRepository.findAll({
        active: true,
      });

      const response: ApiResponse = {
        success: true,
        data: {
          warehouses: warehouses.map((warehouse) => ({
            id: warehouse.id,
            name: warehouse.name,
            address: warehouse.address
              ? `${warehouse.address}${
                  warehouse.city ? `, ${warehouse.city}` : ""
                }${warehouse.state ? `, ${warehouse.state}` : ""}${
                  warehouse.zip_code ? ` ${warehouse.zip_code}` : ""
                }`
              : undefined,
            active: warehouse.active,
          })),
        },
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
      res.status(500).json(response);
    }
  }

  /**
   * PATCH /api/products/:id/inline - Update specific product fields inline
   */
  async updateInlineField(req: Request, res: Response): Promise<void> {
    try {
      const productId = parseInt(req.params.id);
      const { field, value }: InlineEditRequest = req.body;

      if (isNaN(productId)) {
        const response: ApiResponse = {
          success: false,
          error: "Invalid product ID",
        };
        res.status(400).json(response);
        return;
      }

      // Validate field and value
      if (
        !["sale_price", "cost_price", "category", "reorder_point"].includes(
          field
        )
      ) {
        const response: ApiResponse = {
          success: false,
          error: "Invalid field for inline editing",
        };
        res.status(400).json(response);
        return;
      }

      const oldProduct = await this.productManagementService.getProductById(
        productId
      );
      const updatedProduct =
        await this.productManagementService.updateInlineField(
          productId,
          field,
          value
        );

      const response: ApiResponse = {
        success: true,
        data: {
          product: {
            id: productId,
            field,
            old_value: (oldProduct.product as any)[field],
            new_value: value,
            updated_at: updatedProduct.updated_at,
          },
          message: `${field.replace("_", " ")} updated successfully`,
        },
      };

      res.json(response);
    } catch (error) {
      const statusCode =
        error instanceof Error && error.message.includes("not found")
          ? 404
          : 400;
      const response: ApiResponse = {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
      res.status(statusCode).json(response);
    }
  }

  /**
   * PUT /api/products/:id/fields - Bulk update multiple fields atomically
   */
  async bulkUpdateFields(req: Request, res: Response): Promise<void> {
    try {
      const productId = parseInt(req.params.id);
      const { fields }: BulkFieldUpdateRequest = req.body;

      if (isNaN(productId)) {
        const response: ApiResponse = {
          success: false,
          error: "Invalid product ID",
        };
        res.status(400).json(response);
        return;
      }

      const oldProduct = await this.productManagementService.getProductById(
        productId
      );
      const updatedProduct = await this.productManagementService.updateProduct(
        productId,
        fields
      );

      // Build updated fields response
      const updatedFields: Record<string, { old_value: any; new_value: any }> =
        {};
      Object.keys(fields).forEach((field) => {
        updatedFields[field] = {
          old_value: (oldProduct.product as any)[field],
          new_value: (fields as any)[field],
        };
      });

      const response: ApiResponse = {
        success: true,
        data: {
          product: {
            id: productId,
            updated_fields: updatedFields,
            updated_at: updatedProduct.product.updated_at,
          },
          message: "Product updated successfully",
        },
      };

      res.json(response);
    } catch (error) {
      const statusCode =
        error instanceof Error && error.message.includes("not found")
          ? 404
          : 400;
      const response: ApiResponse = {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
      res.status(statusCode).json(response);
    }
  }

  /**
   * Validate product create request
   */
  private validateProductCreateRequest(
    data: ProductCreateRequest
  ): Array<{ field: string; message: string }> {
    const errors: Array<{ field: string; message: string }> = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push({ field: "name", message: "Product name is required" });
    } else if (data.name.length > 255) {
      errors.push({
        field: "name",
        message: "Product name must be 255 characters or less",
      });
    }

    if (!data.sku || data.sku.trim().length === 0) {
      errors.push({ field: "sku", message: "SKU is required" });
    } else if (data.sku.length < 3 || data.sku.length > 50) {
      errors.push({
        field: "sku",
        message: "SKU must be between 3 and 50 characters",
      });
    } else if (!/^[a-zA-Z0-9-]+$/.test(data.sku)) {
      errors.push({
        field: "sku",
        message: "SKU can only contain letters, numbers, and hyphens",
      });
    }

    if (!data.category || data.category.trim().length === 0) {
      errors.push({ field: "category", message: "Category is required" });
    }

    if (typeof data.cost_price !== "number" || data.cost_price < 0) {
      errors.push({
        field: "cost_price",
        message: "Cost price must be a positive number",
      });
    }

    if (typeof data.sale_price !== "number" || data.sale_price < 0) {
      errors.push({
        field: "sale_price",
        message: "Sale price must be a positive number",
      });
    }

    if (
      data.cost_price &&
      data.sale_price &&
      data.sale_price < data.cost_price
    ) {
      errors.push({
        field: "sale_price",
        message: "Sale price must be greater than or equal to cost price",
      });
    }

    if (typeof data.reorder_point !== "number" || data.reorder_point < 0) {
      errors.push({
        field: "reorder_point",
        message: "Reorder point must be a non-negative number",
      });
    }

    if (data.description && data.description.length > 1000) {
      errors.push({
        field: "description",
        message: "Description must be 1000 characters or less",
      });
    }

    if (data.image_url && !this.isValidUrl(data.image_url)) {
      errors.push({
        field: "image_url",
        message: "Image URL must be a valid URL",
      });
    }

    if (data.warehouse_stock) {
      data.warehouse_stock.forEach((stock, index) => {
        if (typeof stock.warehouse_id !== "number" || stock.warehouse_id <= 0) {
          errors.push({
            field: `warehouse_stock[${index}].warehouse_id`,
            message: "Valid warehouse ID is required",
          });
        }
        if (
          typeof stock.initial_quantity !== "number" ||
          stock.initial_quantity < 0
        ) {
          errors.push({
            field: `warehouse_stock[${index}].initial_quantity`,
            message: "Initial quantity must be non-negative",
          });
        }
      });
    }

    return errors;
  }

  /**
   * Validate product update request
   */
  private validateProductUpdateRequest(
    data: ProductUpdateRequest
  ): Array<{ field: string; message: string }> {
    const errors: Array<{ field: string; message: string }> = [];

    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        errors.push({ field: "name", message: "Product name cannot be empty" });
      } else if (data.name.length > 255) {
        errors.push({
          field: "name",
          message: "Product name must be 255 characters or less",
        });
      }
    }

    if (data.category !== undefined) {
      if (!data.category || data.category.trim().length === 0) {
        errors.push({ field: "category", message: "Category cannot be empty" });
      }
    }

    if (data.cost_price !== undefined) {
      if (typeof data.cost_price !== "number" || data.cost_price < 0) {
        errors.push({
          field: "cost_price",
          message: "Cost price must be a positive number",
        });
      }
    }

    if (data.sale_price !== undefined) {
      if (typeof data.sale_price !== "number" || data.sale_price < 0) {
        errors.push({
          field: "sale_price",
          message: "Sale price must be a positive number",
        });
      }
    }

    if (data.reorder_point !== undefined) {
      if (typeof data.reorder_point !== "number" || data.reorder_point < 0) {
        errors.push({
          field: "reorder_point",
          message: "Reorder point must be a non-negative number",
        });
      }
    }

    if (
      data.description !== undefined &&
      data.description &&
      data.description.length > 1000
    ) {
      errors.push({
        field: "description",
        message: "Description must be 1000 characters or less",
      });
    }

    if (
      data.image_url !== undefined &&
      data.image_url &&
      !this.isValidUrl(data.image_url)
    ) {
      errors.push({
        field: "image_url",
        message: "Image URL must be a valid URL",
      });
    }

    return errors;
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
