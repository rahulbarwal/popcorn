/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("product_locations", function (table) {
    table.increments("id").primary();
    table.integer("product_id").unsigned().notNullable();
    table.integer("product_variant_id").unsigned().nullable();
    table.integer("location_id").unsigned().notNullable();
    table.integer("quantity_on_hand").defaultTo(0);
    table.integer("quantity_reserved").defaultTo(0);
    table.integer("quantity_available").defaultTo(0);
    table.decimal("unit_cost", 10, 2).notNullable();
    table.integer("reorder_point").defaultTo(0);
    table.timestamp("last_updated").defaultTo(knex.fn.now());
    table.timestamps(true, true);

    // Foreign key constraints
    table
      .foreign("product_id")
      .references("id")
      .inTable("products")
      .onDelete("CASCADE");
    table
      .foreign("product_variant_id")
      .references("id")
      .inTable("product_variants")
      .onDelete("CASCADE");
    table
      .foreign("location_id")
      .references("id")
      .inTable("locations")
      .onDelete("CASCADE");

    // Indexes
    table.index(["product_id"]);
    table.index(["product_variant_id"]);
    table.index(["location_id"]);
    table.index(["quantity_on_hand"]);
    table.index(["quantity_available"]);
    table.index(["last_updated"]);

    // Unique constraint for product + variant + location combination
    table.unique(["product_id", "product_variant_id", "location_id"]);

    // Constraints
    table.check("quantity_on_hand >= 0");
    table.check("quantity_reserved >= 0");
    table.check("quantity_available >= 0");
    table.check("unit_cost >= 0");
    table.check("reorder_point >= 0");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("product_locations");
};
