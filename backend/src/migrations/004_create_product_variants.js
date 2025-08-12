/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("product_variants", function (table) {
    table.increments("id").primary();
    table.integer("product_id").unsigned().notNullable();
    table.string("variant_name", 255).notNullable();
    table.string("variant_sku", 100).notNullable().unique();
    table.json("attributes"); // Store variant attributes as JSON
    table.boolean("active").defaultTo(true);
    table.timestamps(true, true);

    // Foreign key constraints
    table
      .foreign("product_id")
      .references("id")
      .inTable("products")
      .onDelete("CASCADE");

    // Indexes
    table.index(["product_id"]);
    table.index(["variant_sku"]);
    table.index(["variant_name"]);
    table.index(["active"]);

    // Unique constraint for product_id + variant_name
    table.unique(["product_id", "variant_name"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("product_variants");
};
