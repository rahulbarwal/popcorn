import knex, { Knex } from "knex";
import dotenv from "dotenv";
import { DatabaseConfig } from "../types";

dotenv.config();

// Database configuration with connection pooling
const getDatabaseConfig = (): Knex.Config => {
  const baseConfig: Knex.Config = {
    client: "pg",
    connection: {
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "password",
      database: process.env.DB_NAME || "inventory_dashboard",
    },
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || "2"),
      max: parseInt(process.env.DB_POOL_MAX || "10"),
      acquireTimeoutMillis: 60000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 100,
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
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
};

// Graceful shutdown
export const closeDatabaseConnection = async (): Promise<void> => {
  try {
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
