/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex("purchase_order_products").del();

  // Inserts seed entries
  await knex("purchase_order_products").insert([
    // PO-2024-001 - TechSupply Corp (delivered)
    {
      purchase_order_id: 1,
      product_id: 1, // Business Laptop Pro 15"
      product_variant_id: 1, // 16GB/512GB variant
      quantity_ordered: 5,
      unit_price: 899.99,
      total_price: 4499.95,
      quantity_received: 5,
    },
    {
      purchase_order_id: 1,
      product_id: 10, // USB-C Cable 6ft
      product_variant_id: null,
      quantity_ordered: 10,
      unit_price: 10.0,
      total_price: 100.0,
      quantity_received: 10,
    },

    // PO-2024-002 - Global Electronics Ltd (shipped)
    {
      purchase_order_id: 2,
      product_id: 5, // 27" 4K Monitor
      product_variant_id: null,
      quantity_ordered: 6,
      unit_price: 299.99,
      total_price: 1799.94,
      quantity_received: 0,
    },
    {
      purchase_order_id: 2,
      product_id: 2, // Wireless Optical Mouse
      product_variant_id: 3, // Black variant
      quantity_ordered: 10,
      unit_price: 9.99,
      total_price: 99.9,
      quantity_received: 0,
    },

    // PO-2024-003 - Industrial Parts Inc (confirmed)
    {
      purchase_order_id: 3,
      product_id: 3, // Standing Desk Adjustable
      product_variant_id: null,
      quantity_ordered: 5,
      unit_price: 399.99,
      total_price: 1999.95,
      quantity_received: 0,
    },
    {
      purchase_order_id: 3,
      product_id: 4, // Ergonomic Office Chair
      product_variant_id: 5, // Black Leather variant
      quantity_ordered: 5,
      unit_price: 199.98,
      total_price: 999.9,
      quantity_received: 0,
    },

    // PO-2024-004 - TechSupply Corp (pending)
    {
      purchase_order_id: 4,
      product_id: 6, // Mechanical Keyboard RGB
      product_variant_id: 7, // Blue Switches variant
      quantity_ordered: 8,
      unit_price: 79.99,
      total_price: 639.92,
      quantity_received: 0,
    },
    {
      purchase_order_id: 4,
      product_id: 2, // Wireless Optical Mouse
      product_variant_id: 4, // White variant
      quantity_ordered: 20,
      unit_price: 8.0,
      total_price: 160.0,
      quantity_received: 0,
    },

    // PO-2024-005 - Office Solutions Pro (pending)
    {
      purchase_order_id: 5,
      product_id: 8, // Laser Printer Multifunction
      product_variant_id: null,
      quantity_ordered: 6,
      unit_price: 199.99,
      total_price: 1199.94,
      quantity_received: 0,
    },

    // PO-2024-006 - Global Electronics Ltd (confirmed)
    {
      purchase_order_id: 6,
      product_id: 9, // Wireless Noise-Canceling Headset
      product_variant_id: null,
      quantity_ordered: 20,
      unit_price: 119.99,
      total_price: 2399.8,
      quantity_received: 0,
    },

    // PO-2024-007 - TechSupply Corp (pending)
    {
      purchase_order_id: 7,
      product_id: 7, // Business Tablet 10"
      product_variant_id: null,
      quantity_ordered: 4,
      unit_price: 249.99,
      total_price: 999.96,
      quantity_received: 0,
    },

    // PO-2024-008 - Industrial Parts Inc (pending)
    {
      purchase_order_id: 8,
      product_id: 3, // Standing Desk Adjustable
      product_variant_id: null,
      quantity_ordered: 3,
      unit_price: 399.99,
      total_price: 1199.97,
      quantity_received: 0,
    },
    {
      purchase_order_id: 8,
      product_id: 4, // Ergonomic Office Chair
      product_variant_id: 6, // Gray Fabric variant
      quantity_ordered: 3,
      unit_price: 199.99,
      total_price: 599.97,
      quantity_received: 0,
    },

    // PO-2024-009 - Backup Supplies Co (pending)
    {
      purchase_order_id: 9,
      product_id: 10, // USB-C Cable 6ft
      product_variant_id: null,
      quantity_ordered: 50,
      unit_price: 8.99,
      total_price: 449.5,
      quantity_received: 0,
    },

    // PO-2024-010 - Global Electronics Ltd (pending)
    {
      purchase_order_id: 10,
      product_id: 1, // Business Laptop Pro 15"
      product_variant_id: 2, // 32GB/1TB variant
      quantity_ordered: 3,
      unit_price: 1099.99,
      total_price: 3299.97,
      quantity_received: 0,
    },
  ]);
};
