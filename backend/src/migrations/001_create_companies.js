/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("companies", function (table) {
    table.increments("id").primary();
    table.string("name", 255).notNullable();
    table.string("contact_name", 255);
    table.string("email", 255);
    table.string("phone", 50);
    table.text("address");
    table.string("city", 100);
    table.string("state", 50);
    table.string("zip_code", 20);
    table
      .enum("supplier_type", ["primary", "secondary", "backup"])
      .defaultTo("primary");
    table.boolean("active").defaultTo(true);
    table.timestamps(true, true);

    // Indexes
    table.index(["name"]);
    table.index(["active"]);
    table.index(["supplier_type"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("companies");
};
