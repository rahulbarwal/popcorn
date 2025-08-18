import { logger } from "../../utils/logger";

export default async function globalTeardown() {
  logger.info("🧪 Starting global test teardown...");

  // Clean up any global resources
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }

  // Reset environment variables
  delete process.env.DISABLE_RATE_LIMITING;
  delete process.env.DATABASE_TIMEOUT;
  delete process.env.CACHE_TTL;

  logger.info("✅ Global test teardown completed");
}
