import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { ValidationError } from "./errorHandler";
import { logger } from "../utils/logger";

export interface ValidationSchema {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}

export const validate = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    // Validate request body
    if (schema.body) {
      const { error } = schema.body.validate(req.body, { abortEarly: false });
      if (error) {
        errors.push(
          ...error.details.map((detail) => `Body: ${detail.message}`)
        );
      }
    }

    // Validate query parameters
    if (schema.query) {
      const { error } = schema.query.validate(req.query, { abortEarly: false });
      if (error) {
        errors.push(
          ...error.details.map((detail) => `Query: ${detail.message}`)
        );
      }
    }

    // Validate route parameters
    if (schema.params) {
      const { error } = schema.params.validate(req.params, {
        abortEarly: false,
      });
      if (error) {
        errors.push(
          ...error.details.map((detail) => `Params: ${detail.message}`)
        );
      }
    }

    if (errors.length > 0) {
      logger.warn("Validation failed", {
        url: req.url,
        method: req.method,
        errors,
        body: req.body,
        query: req.query,
        params: req.params,
      });

      throw new ValidationError(errors.join("; "));
    }

    next();
  };
};

// Common validation schemas
export const commonSchemas = {
  // Pagination parameters
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(50),
  }),

  // ID parameter
  id: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),

  // Warehouse filter
  warehouseFilter: Joi.object({
    warehouse_id: Joi.number().integer().positive().optional(),
  }),

  // Stock filter
  stockFilter: Joi.object({
    stock_filter: Joi.string()
      .valid("all", "low_stock", "out_of_stock")
      .default("all"),
  }),

  // Date range
  dateRange: Joi.object({
    date_from: Joi.date().iso().optional(),
    date_to: Joi.date().iso().min(Joi.ref("date_from")).optional(),
  }),

  // Search parameters
  search: Joi.object({
    search: Joi.string().trim().min(1).max(100).optional(),
    category: Joi.string().trim().min(1).max(50).optional(),
  }),
};

// Dashboard-specific validation schemas
export const dashboardSchemas = {
  summaryMetrics: {
    query: commonSchemas.warehouseFilter,
  },

  stockLevels: {
    query: Joi.object({
      ...commonSchemas.warehouseFilter.describe().keys,
      ...commonSchemas.stockFilter.describe().keys,
      ...commonSchemas.search.describe().keys,
      ...commonSchemas.pagination.describe().keys,
    }),
  },

  recentPurchases: {
    query: Joi.object({
      ...commonSchemas.warehouseFilter.describe().keys,
      ...commonSchemas.dateRange.describe().keys,
      supplier_id: Joi.number().integer().positive().optional(),
      status: Joi.string()
        .valid("pending", "confirmed", "shipped", "delivered", "cancelled")
        .optional(),
      limit: Joi.number().integer().min(1).max(50).default(10),
    }),
  },

  warehouseDistribution: {
    query: Joi.object({
      ...commonSchemas.warehouseFilter.describe().keys,
      product_id: Joi.number().integer().positive().optional(),
      category: Joi.string().trim().min(1).max(50).optional(),
      min_value: Joi.number().min(0).optional(),
    }),
  },
};

// Product management validation schemas
export const productSchemas = {
  createProduct: {
    body: Joi.object({
      name: Joi.string().trim().min(1).max(255).required(),
      sku: Joi.string()
        .trim()
        .min(3)
        .max(50)
        .pattern(/^[A-Za-z0-9-]+$/)
        .required(),
      description: Joi.string().trim().max(1000).optional().allow(""),
      category: Joi.string().trim().min(1).max(50).required(),
      cost_price: Joi.number().positive().precision(2).required(),
      sale_price: Joi.number()
        .positive()
        .precision(2)
        .min(Joi.ref("cost_price"))
        .required(),
      reorder_point: Joi.number().integer().min(0).required(),
      image_url: Joi.string().uri().optional().allow(""),
      warehouse_stock: Joi.array()
        .items(
          Joi.object({
            warehouse_id: Joi.number().integer().positive().required(),
            initial_quantity: Joi.number().integer().min(0).required(),
          })
        )
        .min(1)
        .required(),
    }),
  },

  updateProduct: {
    params: commonSchemas.id,
    body: Joi.object({
      name: Joi.string().trim().min(1).max(255).optional(),
      description: Joi.string().trim().max(1000).optional().allow(""),
      category: Joi.string().trim().min(1).max(50).optional(),
      cost_price: Joi.number().positive().precision(2).optional(),
      sale_price: Joi.number().positive().precision(2).optional(),
      reorder_point: Joi.number().integer().min(0).optional(),
      image_url: Joi.string().uri().optional().allow(""),
    }).min(1), // At least one field must be provided
  },

  getProduct: {
    params: commonSchemas.id,
  },

  deleteProduct: {
    params: commonSchemas.id,
  },

  validateSku: {
    params: Joi.object({
      sku: Joi.string()
        .trim()
        .min(3)
        .max(50)
        .pattern(/^[A-Za-z0-9-]+$/)
        .required(),
    }),
  },

  inlineUpdate: {
    params: commonSchemas.id,
    body: Joi.object({
      field: Joi.string()
        .valid("sale_price", "cost_price", "category", "reorder_point")
        .required(),
      value: Joi.alternatives()
        .try(
          Joi.number().positive().precision(2), // For prices
          Joi.number().integer().min(0), // For reorder_point
          Joi.string().trim().min(1).max(50) // For category
        )
        .required(),
    }),
  },
};

// Purchase order validation schemas
export const purchaseOrderSchemas = {
  createPurchaseOrder: {
    body: Joi.object({
      supplier_id: Joi.number().integer().positive().required(),
      expected_delivery_date: Joi.date().iso().min("now").required(),
      notes: Joi.string().trim().max(500).optional().allow(""),
      warehouse_id: Joi.number().integer().positive().required(),
      products: Joi.array()
        .items(
          Joi.object({
            product_id: Joi.number().integer().positive().required(),
            quantity: Joi.number().integer().positive().required(),
            unit_price: Joi.number().positive().precision(2).required(),
          })
        )
        .min(1)
        .required(),
    }),
  },

  updatePurchaseOrder: {
    params: commonSchemas.id,
    body: Joi.object({
      status: Joi.string()
        .valid("pending", "confirmed", "shipped", "delivered", "cancelled")
        .optional(),
      expected_delivery_date: Joi.date().iso().min("now").optional(),
      notes: Joi.string().trim().max(500).optional().allow(""),
    }).min(1),
  },

  receiveProducts: {
    params: commonSchemas.id,
    body: Joi.object({
      products: Joi.array()
        .items(
          Joi.object({
            product_id: Joi.number().integer().positive().required(),
            quantity_received: Joi.number().integer().min(0).required(),
          })
        )
        .min(1)
        .required(),
    }),
  },
};

// Sanitization helpers
export const sanitizeInput = (input: any): any => {
  if (typeof input === "string") {
    return input.trim();
  }
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  if (typeof input === "object" && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  return input;
};

// Middleware to sanitize all inputs
export const sanitizeInputs = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  req.body = sanitizeInput(req.body);
  req.query = sanitizeInput(req.query);
  req.params = sanitizeInput(req.params);
  next();
};
