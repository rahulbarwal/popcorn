import knex, { Knex } from "knex";
import dotenv from "dotenv";
import { DatabaseConfig } from "../types";
import { cacheService } from "../utils/cache";

dotenv.config();

// Database configuration with optimized connection pooling
const getDatabaseConfig = (): Knex.Config => {
  const baseConfig: Knex.Config = {
    client: "pg",
    connection: {
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "password",
      database: process.env.DB_NAME || "inventory_dashboard",
      // Connection-level optimizations
      statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || "30000"), // 30 seconds
      query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT || "60000"), // 60 seconds
      connectionTimeoutMillis: parseInt(
        process.env.DB_CONNECTION_TIMEOUT || "5000"
      ), // 5 seconds
    },
    pool: {
      // Optimized pool settings for performance
      min: parseInt(process.env.DB_POOL_MIN || "5"), // Increased minimum connections
      max: parseInt(process.env.DB_POOL_MAX || "20"), // Increased maximum connections
      acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT || "60000"), // 60 seconds
      createTimeoutMillis: parseInt(process.env.DB_CREATE_TIMEOUT || "30000"), // 30 seconds
      destroyTimeoutMillis: parseInt(process.env.DB_DESTROY_TIMEOUT || "5000"), // 5 seconds
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || "300000"), // 5 minutes
      reapIntervalMillis: parseInt(process.env.DB_REAP_INTERVAL || "1000"), // 1 second
      createRetryIntervalMillis: parseInt(
        process.env.DB_CREATE_RETRY_INTERVAL || "200"
      ), // 200ms
      // Validation and propagation settings
      propagateCreateError: false, // Don't propagate pool creation errors immediately
      afterCreate: function (conn: any, done: any) {
        // Set connection-level optimizations
        conn.query('SET statement_timeout = "30s"', function (err: any) {
          if (err) {
            console.warn("Failed to set statement_timeout:", err);
          }
          conn.query('SET lock_timeout = "10s"', function (err: any) {
            if (err) {
              console.warn("Failed to set lock_timeout:", err);
            }
            done(err, conn);
          });
        });
      },
    },
    migrations: {
      tableName: "knex_migrations",
      directory: "../migrations",
    },
    seeds: {
      directory: "../seeds",
    },
    debug:
      process.env.NODE_ENV === "development" && process.env.DB_DEBUG === "true",
    // Query optimization settings
    asyncStackTraces: process.env.NODE_ENV === "development",
    log: {
      warn(message: string) {
        console.warn("DB Warning:", message);
      },
      error(message: string) {
        console.error("DB Error:", message);
      },
      deprecate(message: string) {
        console.warn("DB Deprecation:", message);
      },
      debug(message: string) {
        if (process.env.DB_DEBUG === "true") {
          console.debug("DB Debug:", message);
        }
      },
    },
  };

  // Add SSL configuration for production
  if (process.env.NODE_ENV === "production") {
    if (
      typeof baseConfig.connection === "object" &&
      baseConfig.connection !== null
    ) {
      baseConfig.connection = {
        ...baseConfig.connection,
        ssl: { rejectUnauthorized: false },
      };
    }
  }

  return baseConfig;
};

// Create database connection
const db = knex(getDatabaseConfig());

// Connection health check
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    await db.raw("SELECT 1");
    console.log("✅ Database connection established successfully");

    // Initialize cache service
    try {
      await cacheService.connect();
      console.log("✅ Cache service connected successfully");
    } catch (cacheError) {
      console.warn(
        "⚠️ Cache service connection failed, continuing without cache:",
        cacheError
      );
    }

    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
};

// Graceful shutdown
export const closeDatabaseConnection = async (): Promise<void> => {
  try {
    // Close cache connection first
    await cacheService.disconnect();
    console.log("✅ Cache service disconnected gracefully");

    await db.destroy();
    console.log("✅ Database connection closed gracefully");
  } catch (error) {
    console.error("❌ Error closing database connection:", error);
  }
};

// Transaction helper
export const withTransaction = async <T>(
  callback: (trx: Knex.Transaction) => Promise<T>
): Promise<T> => {
  const trx = await db.transaction();
  try {
    const result = await callback(trx);
    await trx.commit();
    return result;
  } catch (error) {
    await trx.rollback();
    throw error;
  }
};

export default db;
