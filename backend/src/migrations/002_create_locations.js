/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("locations", function (table) {
    table.increments("id").primary();
    table.string("name", 255).notNullable();
    table.text("address");
    table.string("city", 100);
    table.string("state", 50);
    table.string("zip_code", 20);
    table
      .enum("warehouse_type", ["main", "secondary", "distribution", "storage"])
      .defaultTo("main");
    table.boolean("active").defaultTo(true);
    table.timestamps(true, true);

    // Indexes
    table.index(["name"]);
    table.index(["active"]);
    table.index(["warehouse_type"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("locations");
};
