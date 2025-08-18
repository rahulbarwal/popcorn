/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .alterTable("products", function (table) {
      // Composite indexes for common query patterns
      table.index(["active", "category"], "idx_products_active_category");
      table.index(["active", "reorder_point"], "idx_products_active_reorder");
      table.index(["category", "active"], "idx_products_category_active");
      table.index(["name", "active"], "idx_products_name_active");
      table.index(["created_at", "active"], "idx_products_created_active");
    })
    .alterTable("product_locations", function (table) {
      // Composite indexes for inventory queries
      table.index(
        ["product_id", "location_id", "quantity_on_hand"],
        "idx_product_locations_product_location_qty"
      );
      table.index(
        ["location_id", "quantity_on_hand"],
        "idx_product_locations_location_qty"
      );
      table.index(
        ["quantity_on_hand", "product_id"],
        "idx_product_locations_qty_product"
      );
      table.index(
        ["last_updated", "product_id"],
        "idx_product_locations_updated_product"
      );
      table.index(
        ["unit_cost", "quantity_on_hand"],
        "idx_product_locations_cost_qty"
      );
    })
    .alterTable("purchase_orders", function (table) {
      // Composite indexes for purchase order queries
      table.index(
        ["supplier_id", "status", "order_date"],
        "idx_purchase_orders_supplier_status_date"
      );
      table.index(["status", "order_date"], "idx_purchase_orders_status_date");
      table.index(["order_date", "status"], "idx_purchase_orders_date_status");
      table.index(
        ["expected_delivery_date", "status"],
        "idx_purchase_orders_delivery_status"
      );
    })
    .alterTable("purchase_order_products", function (table) {
      // Composite indexes for purchase order product queries
      table.index(
        ["purchase_order_id", "product_id"],
        "idx_po_products_po_product"
      );
      table.index(
        ["product_id", "purchase_order_id"],
        "idx_po_products_product_po"
      );
    })
    .alterTable("companies", function (table) {
      // Composite indexes for supplier queries
      table.index(["active", "supplier_type"], "idx_companies_active_type");
      table.index(["supplier_type", "active"], "idx_companies_type_active");
    })
    .alterTable("locations", function (table) {
      // Composite indexes for location queries
      table.index(["active", "warehouse_type"], "idx_locations_active_type");
      table.index(["warehouse_type", "active"], "idx_locations_type_active");
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .alterTable("products", function (table) {
      table.dropIndex([], "idx_products_active_category");
      table.dropIndex([], "idx_products_active_reorder");
      table.dropIndex([], "idx_products_category_active");
      table.dropIndex([], "idx_products_name_active");
      table.dropIndex([], "idx_products_created_active");
    })
    .alterTable("product_locations", function (table) {
      table.dropIndex([], "idx_product_locations_product_location_qty");
      table.dropIndex([], "idx_product_locations_location_qty");
      table.dropIndex([], "idx_product_locations_qty_product");
      table.dropIndex([], "idx_product_locations_updated_product");
      table.dropIndex([], "idx_product_locations_cost_qty");
    })
    .alterTable("purchase_orders", function (table) {
      table.dropIndex([], "idx_purchase_orders_supplier_status_date");
      table.dropIndex([], "idx_purchase_orders_status_date");
      table.dropIndex([], "idx_purchase_orders_date_status");
      table.dropIndex([], "idx_purchase_orders_delivery_status");
    })
    .alterTable("purchase_order_products", function (table) {
      table.dropIndex([], "idx_po_products_po_product");
      table.dropIndex([], "idx_po_products_product_po");
    })
    .alterTable("companies", function (table) {
      table.dropIndex([], "idx_companies_active_type");
      table.dropIndex([], "idx_companies_type_active");
    })
    .alterTable("locations", function (table) {
      table.dropIndex([], "idx_locations_active_type");
      table.dropIndex([], "idx_locations_type_active");
    });
};
