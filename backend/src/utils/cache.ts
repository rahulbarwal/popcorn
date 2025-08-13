/**
 * Simple in-memory cache implementation for API responses
 */
export class MemoryCache {
  private cache: Map<string, { data: any; expiry: number }> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes in milliseconds

  /**
   * Set a value in the cache with optional TTL
   */
  set(key: string, value: any, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { data: value, expiry });
  }

  /**
   * Get a value from the cache
   */
  get(key: string): any | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // Check if item has expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * Delete a value from the cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cached values
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Generate cache key for summary metrics
   */
  static generateSummaryMetricsKey(warehouseId?: number): string {
    return `summary_metrics_${warehouseId || "all"}`;
  }

  /**
   * Generate cache key for stock levels
   */
  static generateStockLevelsKey(
    filters: any,
    pagination?: { page: number; limit: number }
  ): string {
    const filterStr = Object.keys(filters)
      .sort()
      .map((key) => `${key}:${filters[key]}`)
      .join("|");

    const paginationStr = pagination
      ? `page:${pagination.page}|limit:${pagination.limit}`
      : "";

    return `stock_levels_${filterStr}_${paginationStr}`;
  }

  /**
   * Generate cache key for recent purchases
   */
  static generateRecentPurchasesKey(filters: any, limit: number): string {
    const filterStr = Object.keys(filters)
      .sort()
      .map((key) => `${key}:${filters[key]}`)
      .join("|");

    return `recent_purchases_${filterStr}_limit:${limit}`;
  }
}

// Create a singleton instance
export const cache = new MemoryCache();

// Clean up expired entries every 10 minutes
setInterval(() => {
  cache.cleanup();
}, 10 * 60 * 1000);
