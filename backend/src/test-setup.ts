// Test setup to verify database connection and repository functionality

import { checkDatabaseConnection } from "./config/database";
import {
  productRepository,
  locationRepository,
  companyRepository,
} from "./repositories";

async function testSetup() {
  console.log("🧪 Testing database setup and repositories...\n");

  try {
    // Test database connection
    console.log("1. Testing database connection...");
    const isConnected = await checkDatabaseConnection();

    if (!isConnected) {
      console.error("❌ Database connection failed");
      return;
    }

    // Test repository functionality
    console.log("\n2. Testing repository functionality...");

    // Test product repository
    console.log("   - Testing ProductRepository...");
    const productCount = await productRepository.count();
    console.log(`     ✅ Product count: ${productCount}`);

    // Test location repository
    console.log("   - Testing LocationRepository...");
    const locationCount = await locationRepository.count();
    console.log(`     ✅ Location count: ${locationCount}`);

    // Test company repository
    console.log("   - Testing CompanyRepository...");
    const companyCount = await companyRepository.count();
    console.log(`     ✅ Company count: ${companyCount}`);

    // Test categories
    console.log("   - Testing product categories...");
    const categories = await productRepository.getCategories();
    console.log(`     ✅ Categories found: ${categories.length}`);

    // Test active warehouses
    console.log("   - Testing active warehouses...");
    const warehouses = await locationRepository.findActiveWarehouses();
    console.log(`     ✅ Active warehouses: ${warehouses.length}`);

    console.log(
      "\n✅ All tests passed! Database and repositories are working correctly."
    );
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testSetup()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("Test execution failed:", error);
      process.exit(1);
    });
}

export { testSetup };
