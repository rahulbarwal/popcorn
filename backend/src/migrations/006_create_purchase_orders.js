/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("purchase_orders", function (table) {
    table.increments("id").primary();
    table.string("po_number", 100).notNullable().unique();
    table.integer("supplier_id").unsigned().notNullable();
    table.date("order_date").notNullable();
    table.date("expected_delivery_date");
    table
      .enum("status", [
        "pending",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled",
      ])
      .defaultTo("pending");
    table.decimal("total_amount", 12, 2).defaultTo(0);
    table.text("notes");
    table.timestamps(true, true);

    // Foreign key constraints
    table
      .foreign("supplier_id")
      .references("id")
      .inTable("companies")
      .onDelete("RESTRICT");

    // Indexes
    table.index(["po_number"]);
    table.index(["supplier_id"]);
    table.index(["order_date"]);
    table.index(["expected_delivery_date"]);
    table.index(["status"]);
    table.index(["created_at"]);

    // Constraints
    table.check("total_amount >= 0");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("purchase_orders");
};
