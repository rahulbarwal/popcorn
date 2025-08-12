// Validation schemas using Joi

import Joi from "joi";

// Common validation patterns
const positiveNumber = Joi.number().positive();
const nonNegativeNumber = Joi.number().min(0);
const positiveInteger = Joi.number().integer().positive();
const nonNegativeInteger = Joi.number().integer().min(0);
const requiredString = Joi.string().trim().required();
const optionalString = Joi.string().trim().allow("", null);
const email = Joi.string().email().allow("", null);
const url = Joi.string().uri().allow("", null);
const date = Joi.date().iso();

// Database entity validation schemas
export const companySchema = Joi.object({
  name: requiredString.max(255),
  contact_name: optionalString.max(255),
  email: email.max(255),
  phone: optionalString.max(50),
  address: optionalString,
  city: optionalString.max(100),
  state: optionalString.max(50),
  zip_code: optionalString.max(20),
  supplier_type: Joi.string()
    .valid("primary", "secondary", "backup")
    .default("primary"),
  active: Joi.boolean().default(true),
});

export const locationSchema = Joi.object({
  name: requiredString.max(255),
  address: optionalString,
  city: optionalString.max(100),
  state: optionalString.max(50),
  zip_code: optionalString.max(20),
  warehouse_type: Joi.string()
    .valid("main", "secondary", "distribution", "storage")
    .default("main"),
  active: Joi.boolean().default(true),
});

export const productSchema = Joi.object({
  sku: requiredString.max(100).pattern(/^[A-Za-z0-9\-_]+$/),
  name: requiredString.max(255),
  description: optionalString.max(1000),
  category: requiredString.max(100),
  sale_price: positiveNumber.precision(2).required(),
  cost_price: positiveNumber.precision(2).required(),
  reorder_point: nonNegativeInteger.default(0),
  image_url: url.max(500),
  active: Joi.boolean().default(true),
}).custom((value, helpers) => {
  // Validate that sale_price >= cost_price
  if (value.sale_price < value.cost_price) {
    return helpers.error("any.custom", {
      message: "Sale price must be greater than or equal to cost price",
    });
  }
  return value;
});

export const productVariantSchema = Joi.object({
  product_id: positiveInteger.required(),
  variant_name: requiredString.max(255),
  variant_sku: requiredString.max(100).pattern(/^[A-Za-z0-9\-_]+$/),
  attributes: Joi.object().unknown(true).allow(null),
  active: Joi.boolean().default(true),
});

export const productLocationSchema = Joi.object({
  product_id: positiveInteger.required(),
  product_variant_id: positiveInteger.allow(null),
  location_id: positiveInteger.required(),
  quantity_on_hand: nonNegativeInteger.default(0),
  quantity_reserved: nonNegativeInteger.default(0),
  quantity_available: nonNegativeInteger.default(0),
  unit_cost: positiveNumber.precision(2).required(),
  reorder_point: nonNegativeInteger.default(0),
});

export const purchaseOrderSchema = Joi.object({
  po_number: requiredString.max(100),
  supplier_id: positiveInteger.required(),
  order_date: date.required(),
  expected_delivery_date: date.allow(null),
  status: Joi.string()
    .valid("pending", "confirmed", "shipped", "delivered", "cancelled")
    .default("pending"),
  total_amount: nonNegativeNumber.precision(2).default(0),
  notes: optionalString,
});

export const purchaseOrderProductSchema = Joi.object({
  purchase_order_id: positiveInteger.required(),
  product_id: positiveInteger.required(),
  product_variant_id: positiveInteger.allow(null),
  quantity_ordered: positiveInteger.required(),
  unit_price: positiveNumber.precision(2).required(),
  total_price: positiveNumber.precision(2).required(),
  quantity_received: nonNegativeInteger.default(0),
}).custom((value, helpers) => {
  // Validate that quantity_received <= quantity_ordered
  if (value.quantity_received > value.quantity_ordered) {
    return helpers.error("any.custom", {
      message: "Quantity received cannot exceed quantity ordered",
    });
  }
  // Validate that total_price = quantity_ordered * unit_price
  const expectedTotal = value.quantity_ordered * value.unit_price;
  if (Math.abs(value.total_price - expectedTotal) > 0.01) {
    return helpers.error("any.custom", {
      message: "Total price must equal quantity ordered times unit price",
    });
  }
  return value;
});

// API request validation schemas
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
  offset: Joi.number().integer().min(0),
});

export const dashboardFiltersSchema = Joi.object({
  warehouse_id: positiveInteger.allow(null),
  stock_filter: Joi.string()
    .valid("all", "low_stock", "out_of_stock")
    .default("all"),
  date_from: date.allow(null),
  date_to: date.allow(null),
});

export const productFiltersSchema = Joi.object({
  search: optionalString.max(255),
  category: optionalString.max(100),
  stock_filter: Joi.string()
    .valid("all", "in_stock", "low_stock", "out_of_stock")
    .default("all"),
  price_min: nonNegativeNumber.allow(null),
  price_max: nonNegativeNumber.allow(null),
  warehouse_id: positiveInteger.allow(null),
}).custom((value, helpers) => {
  // Validate that price_max >= price_min if both are provided
  if (value.price_min && value.price_max && value.price_max < value.price_min) {
    return helpers.error("any.custom", {
      message: "Maximum price must be greater than or equal to minimum price",
    });
  }
  return value;
});

export const purchaseOrderFiltersSchema = Joi.object({
  supplier_id: positiveInteger.allow(null),
  status: Joi.string()
    .valid("pending", "confirmed", "shipped", "delivered", "cancelled")
    .allow(null),
  date_from: date.allow(null),
  date_to: date.allow(null),
  warehouse_id: positiveInteger.allow(null),
});

// Product management validation schemas
export const productCreateSchema = Joi.object({
  name: requiredString.max(255),
  sku: requiredString.max(100).pattern(/^[A-Za-z0-9\-_]+$/),
  description: optionalString.max(1000),
  category: requiredString.max(100),
  cost_price: positiveNumber.precision(2).required(),
  sale_price: positiveNumber.precision(2).required(),
  reorder_point: nonNegativeInteger.default(0),
  image_url: url.max(500),
  warehouse_stock: Joi.array()
    .items(
      Joi.object({
        warehouse_id: positiveInteger.required(),
        initial_quantity: nonNegativeInteger.required(),
      })
    )
    .min(0),
}).custom((value, helpers) => {
  // Validate that sale_price >= cost_price
  if (value.sale_price < value.cost_price) {
    return helpers.error("any.custom", {
      message: "Sale price must be greater than or equal to cost price",
    });
  }
  return value;
});

export const productUpdateSchema = Joi.object({
  name: optionalString.max(255),
  description: optionalString.max(1000),
  category: optionalString.max(100),
  cost_price: positiveNumber.precision(2),
  sale_price: positiveNumber.precision(2),
  reorder_point: nonNegativeInteger,
  image_url: url.max(500),
}).custom((value, helpers) => {
  // Validate that sale_price >= cost_price if both are provided
  if (
    value.sale_price &&
    value.cost_price &&
    value.sale_price < value.cost_price
  ) {
    return helpers.error("any.custom", {
      message: "Sale price must be greater than or equal to cost price",
    });
  }
  return value;
});

// Purchase order creation validation
export const purchaseOrderCreateSchema = Joi.object({
  supplier_id: positiveInteger.required(),
  expected_delivery_date: date.allow(null),
  notes: optionalString.max(1000),
  products: Joi.array()
    .items(
      Joi.object({
        product_id: positiveInteger.required(),
        quantity: positiveInteger.required(),
        unit_price: positiveNumber.precision(2).required(),
      })
    )
    .min(1)
    .required(),
  warehouse_id: positiveInteger.allow(null),
});

// Inline edit validation schemas
export const inlineEditSchema = Joi.object({
  field: Joi.string()
    .valid("sale_price", "cost_price", "category", "reorder_point")
    .required(),
  value: Joi.alternatives()
    .try(
      Joi.number().when("field", {
        is: Joi.string().valid("sale_price", "cost_price"),
        then: positiveNumber.precision(2),
      }),
      Joi.number().when("field", {
        is: "reorder_point",
        then: nonNegativeInteger,
      }),
      Joi.string().when("field", {
        is: "category",
        then: requiredString.max(100),
      })
    )
    .required(),
  product_id: positiveInteger.required(),
});

export const bulkFieldUpdateSchema = Joi.object({
  product_id: positiveInteger.required(),
  fields: Joi.object({
    sale_price: positiveNumber.precision(2),
    cost_price: positiveNumber.precision(2),
    category: optionalString.max(100),
    reorder_point: nonNegativeInteger,
  })
    .min(1)
    .required(),
}).custom((value, helpers) => {
  // Validate that sale_price >= cost_price if both are provided
  const fields = value.fields;
  if (
    fields.sale_price &&
    fields.cost_price &&
    fields.sale_price < fields.cost_price
  ) {
    return helpers.error("any.custom", {
      message: "Sale price must be greater than or equal to cost price",
    });
  }
  return value;
});

// SKU validation schema
export const skuValidationSchema = Joi.object({
  sku: requiredString.max(100).pattern(/^[A-Za-z0-9\-_]+$/),
});

// ID parameter validation
export const idParamSchema = Joi.object({
  id: positiveInteger.required(),
});

// Query parameter validation for lists
export const stockLevelsQuerySchema = paginationSchema.keys({
  warehouse_id: positiveInteger.allow(null),
  stock_filter: Joi.string()
    .valid("all", "low_stock", "out_of_stock")
    .default("all"),
  search: optionalString.max(255),
  category: optionalString.max(100),
  sort_by: Joi.string()
    .valid("sku", "name", "category", "quantity", "created_at")
    .default("name"),
  sort_order: Joi.string().valid("asc", "desc").default("asc"),
});

export const productsQuerySchema = paginationSchema.keys({
  search: optionalString.max(255),
  category: optionalString.max(100),
  stock_filter: Joi.string()
    .valid("all", "in_stock", "low_stock", "out_of_stock")
    .default("all"),
  price_min: nonNegativeNumber.allow(null),
  price_max: nonNegativeNumber.allow(null),
  warehouse_id: positiveInteger.allow(null),
  sort_by: Joi.string()
    .valid("sku", "name", "category", "sale_price", "cost_price", "created_at")
    .default("name"),
  sort_order: Joi.string().valid("asc", "desc").default("asc"),
});

export const purchaseOrdersQuerySchema = paginationSchema.keys({
  supplier_id: positiveInteger.allow(null),
  status: Joi.string()
    .valid("pending", "confirmed", "shipped", "delivered", "cancelled")
    .allow(null),
  date_from: date.allow(null),
  date_to: date.allow(null),
  warehouse_id: positiveInteger.allow(null),
  sort_by: Joi.string()
    .valid(
      "po_number",
      "order_date",
      "expected_delivery_date",
      "total_amount",
      "created_at"
    )
    .default("created_at"),
  sort_order: Joi.string().valid("asc", "desc").default("desc"),
});

// Validation helper functions
export const validateSchema = (schema: Joi.ObjectSchema, data: any) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    const validationErrors = error.details.map((detail) => ({
      field: detail.path.join("."),
      message: detail.message,
      value: detail.context?.value,
    }));

    return {
      isValid: false,
      errors: validationErrors,
      value: null,
    };
  }

  return {
    isValid: true,
    errors: [],
    value,
  };
};

export const createValidationMiddleware = (
  schema: Joi.ObjectSchema,
  source: "body" | "query" | "params" = "body"
) => {
  return (req: any, res: any, next: any) => {
    const data = req[source];
    const validation = validateSchema(schema, data);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    req[source] = validation.value;
    next();
  };
};
