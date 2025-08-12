/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex("product_locations").del();

  // Inserts seed entries for product inventory across locations
  await knex("product_locations").insert([
    // Business Laptop Pro 15" - Base product
    {
      product_id: 1,
      product_variant_id: null,
      location_id: 1, // Main Warehouse
      quantity_on_hand: 45,
      quantity_reserved: 5,
      quantity_available: 40,
      unit_cost: 899.99,
      reorder_point: 25,
    },
    {
      product_id: 1,
      product_variant_id: null,
      location_id: 2, // East Coast Distribution
      quantity_on_hand: 20,
      quantity_reserved: 2,
      quantity_available: 18,
      unit_cost: 899.99,
      reorder_point: 15,
    },

    // Business Laptop Pro 15" - 16GB/512GB variant
    {
      product_id: 1,
      product_variant_id: 1,
      location_id: 1, // Main Warehouse
      quantity_on_hand: 30,
      quantity_reserved: 3,
      quantity_available: 27,
      unit_cost: 899.99,
      reorder_point: 20,
    },
    {
      product_id: 1,
      product_variant_id: 1,
      location_id: 2, // East Coast Distribution
      quantity_on_hand: 15,
      quantity_reserved: 1,
      quantity_available: 14,
      unit_cost: 899.99,
      reorder_point: 10,
    },

    // Business Laptop Pro 15" - 32GB/1TB variant
    {
      product_id: 1,
      product_variant_id: 2,
      location_id: 1, // Main Warehouse
      quantity_on_hand: 12,
      quantity_reserved: 2,
      quantity_available: 10,
      unit_cost: 1099.99,
      reorder_point: 8,
    },

    // Wireless Optical Mouse - Base product
    {
      product_id: 2,
      product_variant_id: null,
      location_id: 1, // Main Warehouse
      quantity_on_hand: 150,
      quantity_reserved: 10,
      quantity_available: 140,
      unit_cost: 15.99,
      reorder_point: 100,
    },
    {
      product_id: 2,
      product_variant_id: null,
      location_id: 2, // East Coast Distribution
      quantity_on_hand: 75,
      quantity_reserved: 5,
      quantity_available: 70,
      unit_cost: 15.99,
      reorder_point: 50,
    },
    {
      product_id: 2,
      product_variant_id: null,
      location_id: 3, // Midwest Storage
      quantity_on_hand: 25,
      quantity_reserved: 0,
      quantity_available: 25,
      unit_cost: 15.99,
      reorder_point: 25,
    },

    // Standing Desk Adjustable
    {
      product_id: 3,
      product_variant_id: null,
      location_id: 1, // Main Warehouse
      quantity_on_hand: 8,
      quantity_reserved: 1,
      quantity_available: 7,
      unit_cost: 399.99,
      reorder_point: 10,
    },
    {
      product_id: 3,
      product_variant_id: null,
      location_id: 4, // Secondary Warehouse
      quantity_on_hand: 5,
      quantity_reserved: 0,
      quantity_available: 5,
      unit_cost: 399.99,
      reorder_point: 5,
    },

    // Ergonomic Office Chair - Base product
    {
      product_id: 4,
      product_variant_id: null,
      location_id: 1, // Main Warehouse
      quantity_on_hand: 22,
      quantity_reserved: 2,
      quantity_available: 20,
      unit_cost: 199.99,
      reorder_point: 15,
    },
    {
      product_id: 4,
      product_variant_id: null,
      location_id: 2, // East Coast Distribution
      quantity_on_hand: 18,
      quantity_reserved: 1,
      quantity_available: 17,
      unit_cost: 199.99,
      reorder_point: 12,
    },

    // 27" 4K Monitor
    {
      product_id: 5,
      product_variant_id: null,
      location_id: 1, // Main Warehouse
      quantity_on_hand: 35,
      quantity_reserved: 3,
      quantity_available: 32,
      unit_cost: 299.99,
      reorder_point: 20,
    },
    {
      product_id: 5,
      product_variant_id: null,
      location_id: 2, // East Coast Distribution
      quantity_on_hand: 15,
      quantity_reserved: 1,
      quantity_available: 14,
      unit_cost: 299.99,
      reorder_point: 15,
    },

    // Mechanical Keyboard RGB - Base product
    {
      product_id: 6,
      product_variant_id: null,
      location_id: 1, // Main Warehouse
      quantity_on_hand: 60,
      quantity_reserved: 5,
      quantity_available: 55,
      unit_cost: 79.99,
      reorder_point: 50,
    },
    {
      product_id: 6,
      product_variant_id: null,
      location_id: 3, // Midwest Storage
      quantity_on_hand: 30,
      quantity_reserved: 2,
      quantity_available: 28,
      unit_cost: 79.99,
      reorder_point: 25,
    },

    // Business Tablet 10"
    {
      product_id: 7,
      product_variant_id: null,
      location_id: 1, // Main Warehouse
      quantity_on_hand: 25,
      quantity_reserved: 2,
      quantity_available: 23,
      unit_cost: 249.99,
      reorder_point: 30,
    },
    {
      product_id: 7,
      product_variant_id: null,
      location_id: 5, // Northwest Hub
      quantity_on_hand: 12,
      quantity_reserved: 1,
      quantity_available: 11,
      unit_cost: 249.99,
      reorder_point: 15,
    },

    // Laser Printer Multifunction
    {
      product_id: 8,
      product_variant_id: null,
      location_id: 1, // Main Warehouse
      quantity_on_hand: 6,
      quantity_reserved: 1,
      quantity_available: 5,
      unit_cost: 199.99,
      reorder_point: 8,
    },
    {
      product_id: 8,
      product_variant_id: null,
      location_id: 2, // East Coast Distribution
      quantity_on_hand: 4,
      quantity_reserved: 0,
      quantity_available: 4,
      unit_cost: 199.99,
      reorder_point: 5,
    },

    // Wireless Noise-Canceling Headset
    {
      product_id: 9,
      product_variant_id: null,
      location_id: 1, // Main Warehouse
      quantity_on_hand: 45,
      quantity_reserved: 3,
      quantity_available: 42,
      unit_cost: 119.99,
      reorder_point: 40,
    },
    {
      product_id: 9,
      product_variant_id: null,
      location_id: 2, // East Coast Distribution
      quantity_on_hand: 25,
      quantity_reserved: 2,
      quantity_available: 23,
      unit_cost: 119.99,
      reorder_point: 25,
    },

    // USB-C Cable 6ft
    {
      product_id: 10,
      product_variant_id: null,
      location_id: 1, // Main Warehouse
      quantity_on_hand: 300,
      quantity_reserved: 20,
      quantity_available: 280,
      unit_cost: 8.99,
      reorder_point: 200,
    },
    {
      product_id: 10,
      product_variant_id: null,
      location_id: 2, // East Coast Distribution
      quantity_on_hand: 150,
      quantity_reserved: 10,
      quantity_available: 140,
      unit_cost: 8.99,
      reorder_point: 100,
    },
    {
      product_id: 10,
      product_variant_id: null,
      location_id: 3, // Midwest Storage
      quantity_on_hand: 100,
      quantity_reserved: 5,
      quantity_available: 95,
      unit_cost: 8.99,
      reorder_point: 75,
    },
  ]);
};
