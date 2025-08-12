/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex("locations").del();

  // Inserts seed entries
  await knex("locations").insert([
    {
      id: 1,
      name: "Main Warehouse",
      address: "1000 Distribution Center Drive",
      city: "Los Angeles",
      state: "CA",
      zip_code: "90001",
      warehouse_type: "main",
      active: true,
    },
    {
      id: 2,
      name: "East Coast Distribution",
      address: "2000 Logistics Boulevard",
      city: "Atlanta",
      state: "GA",
      zip_code: "30301",
      warehouse_type: "distribution",
      active: true,
    },
    {
      id: 3,
      name: "Midwest Storage Facility",
      address: "3000 Storage Way",
      city: "Kansas City",
      state: "MO",
      zip_code: "64101",
      warehouse_type: "storage",
      active: true,
    },
    {
      id: 4,
      name: "Secondary Warehouse",
      address: "4000 Secondary Street",
      city: "Denver",
      state: "CO",
      zip_code: "80201",
      warehouse_type: "secondary",
      active: true,
    },
    {
      id: 5,
      name: "Northwest Hub",
      address: "5000 Pacific Avenue",
      city: "Seattle",
      state: "WA",
      zip_code: "98101",
      warehouse_type: "distribution",
      active: true,
    },
  ]);
};
