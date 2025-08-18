import knex from "knex";
import dotenv from "dotenv";

dotenv.config();

// Test database configuration
const testDbConfig = {
  client: "pg",
  connection: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.TEST_DATABASE_NAME || "inventory_dashboard_test",
  },
  migrations: {
    tableName: "knex_migrations",
    directory: "../../migrations",
  },
  seeds: {
    directory: "../../seeds",
  },
  pool: {
    min: 2,
    max: 10,
  },
};

export const testDb = knex(testDbConfig);

// Setup test database with sample data
export async function setupTestDatabase() {
  try {
    // Run migrations
    await testDb.migrate.latest();

    // Run seeds for test data
    await testDb.seed.run();

    console.log("✅ Test database setup complete");
  } catch (error) {
    console.error("❌ Test database setup failed:", error);
    throw error;
  }
}

// Clean up test database
export async function teardownTestDatabase() {
  try {
    await testDb.destroy();
    console.log("✅ Test database cleanup complete");
  } catch (error) {
    console.error("❌ Test database cleanup failed:", error);
    throw error;
  }
}

// Reset test data between tests
export async function resetTestData() {
  try {
    // Truncate all tables in reverse order to handle foreign keys
    await testDb.raw("TRUNCATE TABLE purchase_order_products CASCADE");
    await testDb.raw("TRUNCATE TABLE purchase_orders CASCADE");
    await testDb.raw("TRUNCATE TABLE product_locations CASCADE");
    await testDb.raw("TRUNCATE TABLE product_variants CASCADE");
    await testDb.raw("TRUNCATE TABLE products CASCADE");
    await testDb.raw("TRUNCATE TABLE locations CASCADE");
    await testDb.raw("TRUNCATE TABLE companies CASCADE");

    // Re-run seeds
    await testDb.seed.run();
  } catch (error) {
    console.error("❌ Test data reset failed:", error);
    throw error;
  }
}
