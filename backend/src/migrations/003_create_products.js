/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("products", function (table) {
    table.increments("id").primary();
    table.string("sku", 100).notNullable().unique();
    table.string("name", 255).notNullable();
    table.text("description");
    table.string("category", 100).notNullable();
    table.decimal("sale_price", 10, 2).notNullable();
    table.decimal("cost_price", 10, 2).notNullable();
    table.integer("reorder_point").defaultTo(0);
    table.string("image_url", 500);
    table.boolean("active").defaultTo(true);
    table.timestamps(true, true);

    // Indexes
    table.index(["sku"]);
    table.index(["name"]);
    table.index(["category"]);
    table.index(["active"]);
    table.index(["reorder_point"]);

    // Constraints
    table.check("sale_price >= 0");
    table.check("cost_price >= 0");
    table.check("reorder_point >= 0");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("products");
};
