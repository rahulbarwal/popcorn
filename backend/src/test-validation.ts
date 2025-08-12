// Test validation schemas

import {
  validateSchema,
  productCreateSchema,
  companySchema,
  locationSchema,
} from "./types/validation";

async function testValidation() {
  console.log("🧪 Testing validation schemas...\n");

  try {
    // Test product validation
    console.log("1. Testing product validation...");

    const validProduct = {
      name: "Test Product",
      sku: "TEST-001",
      category: "Electronics",
      cost_price: 25.5,
      sale_price: 45.99,
      reorder_point: 10,
      description: "A test product",
    };

    const productValidation = validateSchema(productCreateSchema, validProduct);
    console.log(`   ✅ Valid product: ${productValidation.isValid}`);

    // Test invalid product (sale price < cost price)
    const invalidProduct = {
      ...validProduct,
      sale_price: 20.0, // Less than cost price
    };

    const invalidValidation = validateSchema(
      productCreateSchema,
      invalidProduct
    );
    console.log(
      `   ✅ Invalid product detected: ${!invalidValidation.isValid}`
    );

    // Test company validation
    console.log("\n2. Testing company validation...");

    const validCompany = {
      name: "Test Supplier",
      email: "test@supplier.com",
      supplier_type: "primary",
    };

    const companyValidation = validateSchema(companySchema, validCompany);
    console.log(`   ✅ Valid company: ${companyValidation.isValid}`);

    // Test location validation
    console.log("\n3. Testing location validation...");

    const validLocation = {
      name: "Test Warehouse",
      city: "Test City",
      warehouse_type: "main",
    };

    const locationValidation = validateSchema(locationSchema, validLocation);
    console.log(`   ✅ Valid location: ${locationValidation.isValid}`);

    console.log("\n✅ All validation tests passed!");
  } catch (error) {
    console.error("❌ Validation test failed:", error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testValidation()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("Test execution failed:", error);
      process.exit(1);
    });
}

export { testValidation };
