/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex("companies").del();

  // Inserts seed entries
  await knex("companies").insert([
    {
      id: 1,
      name: "TechSupply Corp",
      contact_name: "John Smith",
      email: "john.smith@techsupply.com",
      phone: "+1-555-0123",
      address: "123 Technology Drive",
      city: "San Francisco",
      state: "CA",
      zip_code: "94105",
      supplier_type: "primary",
      active: true,
    },
    {
      id: 2,
      name: "Global Electronics Ltd",
      contact_name: "Sarah Johnson",
      email: "sarah.johnson@globalelectronics.com",
      phone: "+1-555-0456",
      address: "456 Commerce Street",
      city: "New York",
      state: "NY",
      zip_code: "10001",
      supplier_type: "primary",
      active: true,
    },
    {
      id: 3,
      name: "Industrial Parts Inc",
      contact_name: "Mike Wilson",
      email: "mike.wilson@industrialparts.com",
      phone: "+1-555-0789",
      address: "789 Industrial Blvd",
      city: "Chicago",
      state: "IL",
      zip_code: "60601",
      supplier_type: "secondary",
      active: true,
    },
    {
      id: 4,
      name: "Office Solutions Pro",
      contact_name: "Lisa Chen",
      email: "lisa.chen@officesolutions.com",
      phone: "+1-555-0321",
      address: "321 Business Park Way",
      city: "Austin",
      state: "TX",
      zip_code: "73301",
      supplier_type: "primary",
      active: true,
    },
    {
      id: 5,
      name: "Backup Supplies Co",
      contact_name: "David Brown",
      email: "david.brown@backupsupplies.com",
      phone: "+1-555-0654",
      address: "654 Warehouse Lane",
      city: "Phoenix",
      state: "AZ",
      zip_code: "85001",
      supplier_type: "backup",
      active: true,
    },
  ]);
};
