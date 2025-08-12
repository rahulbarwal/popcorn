/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex("product_variants").del();

  // Inserts seed entries
  await knex("product_variants").insert([
    {
      id: 1,
      product_id: 1, // Business Laptop Pro 15"
      variant_name: "16GB RAM / 512GB SSD",
      variant_sku: "LAPTOP-001-16-512",
      attributes: JSON.stringify({
        ram: "16GB",
        storage: "512GB SSD",
        color: "Space Gray",
      }),
      active: true,
    },
    {
      id: 2,
      product_id: 1, // Business Laptop Pro 15"
      variant_name: "32GB RAM / 1TB SSD",
      variant_sku: "LAPTOP-001-32-1TB",
      attributes: JSON.stringify({
        ram: "32GB",
        storage: "1TB SSD",
        color: "Space Gray",
      }),
      active: true,
    },
    {
      id: 3,
      product_id: 2, // Wireless Optical Mouse
      variant_name: "Black",
      variant_sku: "MOUSE-001-BLK",
      attributes: JSON.stringify({
        color: "Black",
        dpi: "1600",
      }),
      active: true,
    },
    {
      id: 4,
      product_id: 2, // Wireless Optical Mouse
      variant_name: "White",
      variant_sku: "MOUSE-001-WHT",
      attributes: JSON.stringify({
        color: "White",
        dpi: "1600",
      }),
      active: true,
    },
    {
      id: 5,
      product_id: 4, // Ergonomic Office Chair
      variant_name: "Black Leather",
      variant_sku: "CHAIR-001-BLK-LTR",
      attributes: JSON.stringify({
        color: "Black",
        material: "Leather",
        armrests: "Adjustable",
      }),
      active: true,
    },
    {
      id: 6,
      product_id: 4, // Ergonomic Office Chair
      variant_name: "Gray Fabric",
      variant_sku: "CHAIR-001-GRY-FAB",
      attributes: JSON.stringify({
        color: "Gray",
        material: "Fabric",
        armrests: "Adjustable",
      }),
      active: true,
    },
    {
      id: 7,
      product_id: 6, // Mechanical Keyboard RGB
      variant_name: "Blue Switches",
      variant_sku: "KEYBOARD-001-BLUE",
      attributes: JSON.stringify({
        switch_type: "Blue",
        layout: "Full Size",
        backlight: "RGB",
      }),
      active: true,
    },
    {
      id: 8,
      product_id: 6, // Mechanical Keyboard RGB
      variant_name: "Red Switches",
      variant_sku: "KEYBOARD-001-RED",
      attributes: JSON.stringify({
        switch_type: "Red",
        layout: "Full Size",
        backlight: "RGB",
      }),
      active: true,
    },
  ]);
};
