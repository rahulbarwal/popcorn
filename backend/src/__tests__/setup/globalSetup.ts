import { logger } from "../../utils/logger";

export default async function globalSetup() {
  logger.info("🧪 Starting global test setup...");

  // Set test environment variables
  process.env.NODE_ENV = "test";
  process.env.LOG_LEVEL = "ERROR"; // Reduce log noise during tests

  // Set test database configuration
  if (!process.env.TEST_DATABASE_NAME) {
    process.env.TEST_DATABASE_NAME = "inventory_dashboard_test";
  }

  // Disable rate limiting for tests
  process.env.DISABLE_RATE_LIMITING = "true";

  // Set shorter timeouts for tests
  process.env.DATABASE_TIMEOUT = "5000";
  process.env.CACHE_TTL = "60";

  logger.info("✅ Global test setup completed");
}
