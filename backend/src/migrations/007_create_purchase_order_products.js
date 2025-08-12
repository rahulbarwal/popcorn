/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("purchase_order_products", function (table) {
    table.increments("id").primary();
    table.integer("purchase_order_id").unsigned().notNullable();
    table.integer("product_id").unsigned().notNullable();
    table.integer("product_variant_id").unsigned().nullable();
    table.integer("quantity_ordered").notNullable();
    table.decimal("unit_price", 10, 2).notNullable();
    table.decimal("total_price", 12, 2).notNullable();
    table.integer("quantity_received").defaultTo(0);
    table.timestamps(true, true);

    // Foreign key constraints
    table
      .foreign("purchase_order_id")
      .references("id")
      .inTable("purchase_orders")
      .onDelete("CASCADE");
    table
      .foreign("product_id")
      .references("id")
      .inTable("products")
      .onDelete("RESTRICT");
    table
      .foreign("product_variant_id")
      .references("id")
      .inTable("product_variants")
      .onDelete("RESTRICT");

    // Indexes
    table.index(["purchase_order_id"]);
    table.index(["product_id"]);
    table.index(["product_variant_id"]);
    table.index(["quantity_ordered"]);
    table.index(["quantity_received"]);

    // Constraints
    table.check("quantity_ordered > 0");
    table.check("unit_price >= 0");
    table.check("total_price >= 0");
    table.check("quantity_received >= 0");
    table.check("quantity_received <= quantity_ordered");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("purchase_order_products");
};
