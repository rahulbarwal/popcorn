import { createClient, RedisClientType } from "redis";
import dotenv from "dotenv";

dotenv.config();

export interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  ttl: number; // Default TTL in seconds
}

export class CacheService {
  private client: RedisClientType;
  private defaultTTL: number;
  private isConnected: boolean = false;

  constructor(config?: Partial<CacheConfig>) {
    const defaultConfig: CacheConfig = {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || "0"),
      ttl: parseInt(process.env.CACHE_TTL || "300"), // 5 minutes default
    };

    const finalConfig = { ...defaultConfig, ...config };
    this.defaultTTL = finalConfig.ttl;

    // Create Redis client
    this.client = createClient({
      socket: {
        host: finalConfig.host,
        port: finalConfig.port,
      },
      password: finalConfig.password,
      database: finalConfig.db,
    });

    // Handle connection events
    this.client.on("connect", () => {
      console.log("✅ Redis client connected");
      this.isConnected = true;
    });

    this.client.on("error", (err) => {
      console.error("❌ Redis client error:", err);
      this.isConnected = false;
    });

    this.client.on("end", () => {
      console.log("🔌 Redis client disconnected");
      this.isConnected = false;
    });
  }

  /**
   * Connect to Redis
   */
  async connect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (error) {
      console.error("Failed to connect to Redis:", error);
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    try {
      await this.client.disconnect();
    } catch (error) {
      console.error("Failed to disconnect from Redis:", error);
    }
  }

  /**
   * Check if Redis is available
   */
  isAvailable(): boolean {
    return this.isConnected;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      const serializedValue = JSON.stringify(value);
      const expiration = ttl || this.defaultTTL;

      await this.client.setEx(key, expiration, serializedValue);
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.del(key);
      return result > 0;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple keys from cache
   */
  async delMany(keys: string[]): Promise<number> {
    if (!this.isConnected || keys.length === 0) {
      return 0;
    }

    try {
      return await this.client.del(keys);
    } catch (error) {
      console.error(
        `Cache delete many error for keys ${keys.join(", ")}:`,
        error
      );
      return 0;
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result > 0;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Set TTL for existing key
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.expire(key, ttl);
      return result === 1;
    } catch (error) {
      console.error(`Cache expire error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get TTL for key
   */
  async ttl(key: string): Promise<number> {
    if (!this.isConnected) {
      return -1;
    }

    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.error(`Cache TTL error for key ${key}:`, error);
      return -1;
    }
  }

  /**
   * Clear all cache (use with caution)
   */
  async flushAll(): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      await this.client.flushAll();
      return true;
    } catch (error) {
      console.error("Cache flush all error:", error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    connected: boolean;
    memory_usage?: string;
    total_commands_processed?: string;
    keyspace_hits?: string;
    keyspace_misses?: string;
  }> {
    const stats = {
      connected: this.isConnected,
    };

    if (!this.isConnected) {
      return stats;
    }

    try {
      const info = await this.client.info("memory");
      const statsInfo = await this.client.info("stats");

      // Parse memory info
      const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
      if (memoryMatch) {
        Object.assign(stats, { memory_usage: memoryMatch[1] });
      }

      // Parse stats info
      const commandsMatch = statsInfo.match(
        /total_commands_processed:([^\r\n]+)/
      );
      const hitsMatch = statsInfo.match(/keyspace_hits:([^\r\n]+)/);
      const missesMatch = statsInfo.match(/keyspace_misses:([^\r\n]+)/);

      if (commandsMatch) {
        Object.assign(stats, { total_commands_processed: commandsMatch[1] });
      }
      if (hitsMatch) {
        Object.assign(stats, { keyspace_hits: hitsMatch[1] });
      }
      if (missesMatch) {
        Object.assign(stats, { keyspace_misses: missesMatch[1] });
      }

      return stats;
    } catch (error) {
      console.error("Cache stats error:", error);
      return stats;
    }
  }

  /**
   * Generate cache key with namespace
   */
  static generateKey(namespace: string, ...parts: (string | number)[]): string {
    return `inventory_dashboard:${namespace}:${parts.join(":")}`;
  }

  /**
   * Invalidate cache keys by pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    if (!this.isConnected) {
      return 0;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }
      return await this.client.del(keys);
    } catch (error) {
      console.error(`Cache invalidate pattern error for ${pattern}:`, error);
      return 0;
    }
  }
}

// Memory cache fallback for when Redis is not available
class MemoryCacheImpl {
  private cache = new Map<string, { value: any; expiry: number }>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiry <= now) {
        this.cache.delete(key);
      }
    }
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    if (entry.expiry <= Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  set(key: string, value: any, ttlMs: number = 300000): boolean {
    const expiry = Date.now() + ttlMs;
    this.cache.set(key, { value, expiry });
    return true;
  }

  del(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Generate cache keys for different data types
  static generateSummaryMetricsKey(warehouseId?: number): string {
    return `summary_metrics:${warehouseId || "all"}`;
  }

  static generateStockLevelsKey(filters: any, pagination?: any): string {
    const cacheData = { filters, pagination };
    const filterStr = JSON.stringify(cacheData);
    return `stock_levels:${Buffer.from(filterStr).toString("base64")}`;
  }

  static generateWarehouseDistributionKey(filters: any): string {
    const filterStr = JSON.stringify(filters);
    return `warehouse_distribution:${Buffer.from(filterStr).toString(
      "base64"
    )}`;
  }

  static generateRecentPurchasesKey(filters: any, limit?: number): string {
    const cacheData = { filters, limit };
    const filterStr = JSON.stringify(cacheData);
    return `recent_purchases:${Buffer.from(filterStr).toString("base64")}`;
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

// Create singleton instances
export const cacheService = new CacheService();
export const memoryCache = new MemoryCacheImpl();

// Export MemoryCache class for backward compatibility
export const MemoryCache = MemoryCacheImpl;

// Unified cache interface that falls back to memory cache
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    if (cacheService.isAvailable()) {
      return await cacheService.get<T>(key);
    }
    return memoryCache.get<T>(key);
  },

  async set(key: string, value: any, ttlMs: number = 300000): Promise<boolean> {
    if (cacheService.isAvailable()) {
      return await cacheService.set(key, value, Math.floor(ttlMs / 1000));
    }
    return memoryCache.set(key, value, ttlMs);
  },

  async del(key: string): Promise<boolean> {
    if (cacheService.isAvailable()) {
      return await cacheService.del(key);
    }
    return memoryCache.del(key);
  },

  // Synchronous versions for backward compatibility
  getSync: <T>(key: string): T | null => {
    return memoryCache.get<T>(key);
  },

  setSync: (key: string, value: any, ttlMs: number = 300000): boolean => {
    return memoryCache.set(key, value, ttlMs);
  },

  deleteSync: (key: string): boolean => {
    return memoryCache.del(key);
  },
};

// Cache key constants
export const CACHE_KEYS = {
  SUMMARY_METRICS: "summary_metrics",
  STOCK_LEVELS: "stock_levels",
  WAREHOUSE_DISTRIBUTION: "warehouse_distribution",
  RECENT_PURCHASES: "recent_purchases",
  STOCK_VISUALIZATION: "stock_visualization",
  PRODUCT_DETAILS: "product_details",
  SUPPLIER_INFO: "supplier_info",
  REORDER_SUGGESTIONS: "reorder_suggestions",
} as const;

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 900, // 15 minutes
  VERY_LONG: 3600, // 1 hour
} as const;
