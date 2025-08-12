/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex("purchase_orders").del();

  // Inserts seed entries
  await knex("purchase_orders").insert([
    {
      id: 1,
      po_number: "PO-2024-001",
      supplier_id: 1, // TechSupply Corp
      order_date: "2024-11-15",
      expected_delivery_date: "2024-11-25",
      status: "delivered",
      total_amount: 4599.95,
      notes: "Regular monthly laptop restock",
    },
    {
      id: 2,
      po_number: "PO-2024-002",
      supplier_id: 2, // Global Electronics Ltd
      order_date: "2024-11-20",
      expected_delivery_date: "2024-11-30",
      status: "shipped",
      total_amount: 1899.75,
      notes: "Monitor and accessories order",
    },
    {
      id: 3,
      po_number: "PO-2024-003",
      supplier_id: 3, // Industrial Parts Inc
      order_date: "2024-11-25",
      expected_delivery_date: "2024-12-05",
      status: "confirmed",
      total_amount: 2999.85,
      notes: "Office furniture restocking",
    },
    {
      id: 4,
      po_number: "PO-2024-004",
      supplier_id: 1, // TechSupply Corp
      order_date: "2024-12-01",
      expected_delivery_date: "2024-12-10",
      status: "pending",
      total_amount: 799.92,
      notes: "Keyboard and mouse accessories",
    },
    {
      id: 5,
      po_number: "PO-2024-005",
      supplier_id: 4, // Office Solutions Pro
      order_date: "2024-12-03",
      expected_delivery_date: "2024-12-12",
      status: "pending",
      total_amount: 1199.96,
      notes: "Printer and office equipment",
    },
    {
      id: 6,
      po_number: "PO-2024-006",
      supplier_id: 2, // Global Electronics Ltd
      order_date: "2024-12-05",
      expected_delivery_date: "2024-12-15",
      status: "confirmed",
      total_amount: 2399.88,
      notes: "Headsets and audio equipment",
    },
    {
      id: 7,
      po_number: "PO-2024-007",
      supplier_id: 1, // TechSupply Corp
      order_date: "2024-12-06",
      expected_delivery_date: "2024-12-16",
      status: "pending",
      total_amount: 999.75,
      notes: "Tablet and mobile accessories",
    },
    {
      id: 8,
      po_number: "PO-2024-008",
      supplier_id: 3, // Industrial Parts Inc
      order_date: "2024-12-07",
      expected_delivery_date: "2024-12-17",
      status: "pending",
      total_amount: 1799.94,
      notes: "Standing desk reorder",
    },
    {
      id: 9,
      po_number: "PO-2024-009",
      supplier_id: 5, // Backup Supplies Co
      order_date: "2024-12-08",
      expected_delivery_date: "2024-12-18",
      status: "pending",
      total_amount: 449.85,
      notes: "Emergency cable and accessory order",
    },
    {
      id: 10,
      po_number: "PO-2024-010",
      supplier_id: 2, // Global Electronics Ltd
      order_date: "2024-12-08",
      expected_delivery_date: "2024-12-20",
      status: "pending",
      total_amount: 3299.9,
      notes: "Year-end electronics restock",
    },
  ]);
};
