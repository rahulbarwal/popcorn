import { LocationRepository } from "../repositories/LocationRepository";
import { ProductLocationRepository } from "../repositories/ProductLocationRepository";
import { ProductRepository } from "../repositories/ProductRepository";
import {
  WarehouseDistributionItem,
  WarehouseDistributionResponse,
} from "../types";

export interface WarehouseDistributionFilters {
  warehouse_id?: number;
  product_id?: number;
  category?: string;
  min_value?: number;
}

export interface StockDistributionImbalance {
  product_id: number;
  sku: string;
  name: string;
  total_stock: number;
  locations: Array<{
    warehouse_id: number;
    warehouse_name: string;
    quantity: number;
    percentage: number;
  }>;
  imbalance_score: number; // 0-1, higher means more imbalanced
  suggested_transfers?: Array<{
    from_warehouse_id: number;
    to_warehouse_id: number;
    suggested_quantity: number;
  }>;
}

export class WarehouseDistributionService {
  private locationRepository: LocationRepository;
  private productLocationRepository: ProductLocationRepository;
  private productRepository: ProductRepository;

  constructor() {
    this.locationRepository = new LocationRepository();
    this.productLocationRepository = new ProductLocationRepository();
    this.productRepository = new ProductRepository();
  }

  /**
   * Get warehouse distribution data with inventory breakdown
   */
  async getWarehouseDistribution(
    filters: WarehouseDistributionFilters = {}
  ): Promise<WarehouseDistributionResponse> {
    const warehouses = await this.getWarehouseInventoryBreakdown(filters);

    return {
      warehouses,
    };
  }

  /**
   * Get inventory breakdown by warehouse locations
   */
  private async getWarehouseInventoryBreakdown(
    filters: WarehouseDistributionFilters
  ): Promise<WarehouseDistributionItem[]> {
    // Build the base query parameters
    const params: any[] = [];
    let whereClause =
      "WHERE l.active = true AND p.active = true AND pl.quantity_on_hand > 0";

    if (filters.warehouse_id) {
      whereClause += " AND l.id = ?";
      params.push(filters.warehouse_id);
    }

    if (filters.product_id) {
      whereClause += " AND p.id = ?";
      params.push(filters.product_id);
    }

    if (filters.category) {
      whereClause += " AND p.category = ?";
      params.push(filters.category);
    }

    const query = `
      SELECT 
        l.id as warehouse_id,
        l.name as warehouse_name,
        l.address as warehouse_address,
        p.id as product_id,
        p.sku,
        p.name as product_name,
        pl.quantity_on_hand as quantity,
        pl.unit_cost,
        (pl.quantity_on_hand * pl.unit_cost) as total_value
      FROM locations l
      JOIN product_locations pl ON l.id = pl.location_id
      JOIN products p ON pl.product_id = p.id
      ${whereClause}
      ORDER BY l.name, p.name
    `;

    const result = await this.locationRepository.raw(query, params);
    const rows = result.rows || result;

    // Group by warehouse and aggregate data
    const warehouseMap = new Map<number, WarehouseDistributionItem>();

    for (const row of rows) {
      const warehouseId = row.warehouse_id;

      if (!warehouseMap.has(warehouseId)) {
        warehouseMap.set(warehouseId, {
          warehouse_id: warehouseId,
          warehouse_name: row.warehouse_name,
          warehouse_address: row.warehouse_address,
          products: [],
          total_products: 0,
          total_value: 0,
        });
      }

      const warehouse = warehouseMap.get(warehouseId)!;

      // Check if we should include this product based on value filter
      const productValue = parseFloat(row.total_value);
      if (filters.min_value && productValue < filters.min_value) {
        continue;
      }

      warehouse.products.push({
        product_id: row.product_id,
        sku: row.sku,
        name: row.product_name,
        quantity: parseInt(row.quantity),
        unit_cost: parseFloat(row.unit_cost),
        total_value: productValue,
      });

      warehouse.total_value += productValue;
    }

    // Update total_products count for each warehouse
    const warehouses = Array.from(warehouseMap.values());
    warehouses.forEach((warehouse) => {
      warehouse.total_products = warehouse.products.length;
    });

    return warehouses;
  }

  /**
   * Identify stock distribution imbalances across warehouses
   */
  async identifyStockImbalances(
    filters: Omit<WarehouseDistributionFilters, "warehouse_id"> = {}
  ): Promise<StockDistributionImbalance[]> {
    // Get products that exist in multiple warehouses
    const params: any[] = [];
    let whereClause =
      "WHERE p.active = true AND l.active = true AND pl.quantity_on_hand > 0";

    if (filters.product_id) {
      whereClause += " AND p.id = ?";
      params.push(filters.product_id);
    }

    if (filters.category) {
      whereClause += " AND p.category = ?";
      params.push(filters.category);
    }

    const query = `
      SELECT 
        p.id as product_id,
        p.sku,
        p.name as product_name,
        l.id as warehouse_id,
        l.name as warehouse_name,
        pl.quantity_on_hand as quantity,
        SUM(pl.quantity_on_hand) OVER (PARTITION BY p.id) as total_stock
      FROM products p
      JOIN product_locations pl ON p.id = pl.product_id
      JOIN locations l ON pl.location_id = l.id
      ${whereClause}
      ORDER BY p.name, l.name
    `;

    const result = await this.productRepository.raw(query, params);
    const rows = result.rows || result;

    // Group by product and calculate imbalances
    const productMap = new Map<number, StockDistributionImbalance>();

    for (const row of rows) {
      const productId = row.product_id;
      const totalStock = parseInt(row.total_stock);
      const quantity = parseInt(row.quantity);
      const percentage = totalStock > 0 ? (quantity / totalStock) * 100 : 0;

      if (!productMap.has(productId)) {
        productMap.set(productId, {
          product_id: productId,
          sku: row.sku,
          name: row.product_name,
          total_stock: totalStock,
          locations: [],
          imbalance_score: 0,
        });
      }

      const product = productMap.get(productId)!;
      product.locations.push({
        warehouse_id: row.warehouse_id,
        warehouse_name: row.warehouse_name,
        quantity,
        percentage,
      });
    }

    // Calculate imbalance scores and filter for products in multiple locations
    const imbalances: StockDistributionImbalance[] = [];

    for (const product of productMap.values()) {
      // Only consider products in multiple warehouses
      if (product.locations.length < 2) {
        continue;
      }

      // Calculate imbalance score using coefficient of variation
      const percentages = product.locations.map((loc) => loc.percentage);
      const mean =
        percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
      const variance =
        percentages.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) /
        percentages.length;
      const standardDeviation = Math.sqrt(variance);
      const coefficientOfVariation = mean > 0 ? standardDeviation / mean : 0;

      // Normalize to 0-1 scale (higher = more imbalanced)
      product.imbalance_score = Math.min(coefficientOfVariation / 2, 1);

      // Only include products with significant imbalance (score > 0.3)
      if (product.imbalance_score > 0.3) {
        // Generate transfer suggestions
        product.suggested_transfers = this.generateTransferSuggestions(product);
        imbalances.push(product);
      }
    }

    // Sort by imbalance score (most imbalanced first)
    return imbalances.sort((a, b) => b.imbalance_score - a.imbalance_score);
  }

  /**
   * Generate transfer suggestions to balance stock distribution
   */
  private generateTransferSuggestions(
    product: StockDistributionImbalance
  ): StockDistributionImbalance["suggested_transfers"] {
    const suggestions: NonNullable<
      StockDistributionImbalance["suggested_transfers"]
    > = [];

    // Sort locations by quantity (descending)
    const sortedLocations = [...product.locations].sort(
      (a, b) => b.quantity - a.quantity
    );

    // Calculate ideal quantity per location (equal distribution)
    const idealQuantityPerLocation = Math.floor(
      product.total_stock / product.locations.length
    );

    // Find locations with excess and deficit
    const excessLocations = sortedLocations.filter(
      (loc) => loc.quantity > idealQuantityPerLocation
    );
    const deficitLocations = sortedLocations.filter(
      (loc) => loc.quantity < idealQuantityPerLocation
    );

    // Generate transfer suggestions from excess to deficit locations
    for (const excessLoc of excessLocations) {
      const excess = excessLoc.quantity - idealQuantityPerLocation;

      for (const deficitLoc of deficitLocations) {
        const deficit = idealQuantityPerLocation - deficitLoc.quantity;

        if (excess > 0 && deficit > 0) {
          const transferQuantity = Math.min(excess, deficit);

          if (transferQuantity > 0) {
            suggestions.push({
              from_warehouse_id: excessLoc.warehouse_id,
              to_warehouse_id: deficitLoc.warehouse_id,
              suggested_quantity: transferQuantity,
            });
          }
        }
      }
    }

    return suggestions;
  }

  /**
   * Get warehouse distribution for a specific product
   */
  async getProductWarehouseDistribution(
    productId: number
  ): Promise<WarehouseDistributionResponse> {
    return this.getWarehouseDistribution({ product_id: productId });
  }

  /**
   * Get products by warehouse location with filtering
   */
  async getProductsByWarehouse(
    warehouseId: number,
    filters: Omit<WarehouseDistributionFilters, "warehouse_id"> = {}
  ): Promise<WarehouseDistributionItem | null> {
    const result = await this.getWarehouseDistribution({
      ...filters,
      warehouse_id: warehouseId,
    });

    return result.warehouses.length > 0 ? result.warehouses[0] : null;
  }

  /**
   * Get warehouse summary statistics
   */
  async getWarehouseSummaryStats(warehouseId?: number): Promise<{
    total_warehouses: number;
    total_products: number;
    total_value: number;
    average_value_per_warehouse: number;
    warehouses_with_inventory: number;
  }> {
    const params: any[] = [];
    let whereClause = "WHERE l.active = true AND p.active = true";

    if (warehouseId) {
      whereClause += " AND l.id = ?";
      params.push(warehouseId);
    }

    const query = `
      SELECT 
        COUNT(DISTINCT l.id) as total_warehouses,
        COUNT(DISTINCT p.id) as total_products,
        COALESCE(SUM(pl.quantity_on_hand * pl.unit_cost), 0) as total_value,
        COUNT(DISTINCT CASE WHEN pl.quantity_on_hand > 0 THEN l.id END) as warehouses_with_inventory
      FROM locations l
      LEFT JOIN product_locations pl ON l.id = pl.location_id
      LEFT JOIN products p ON pl.product_id = p.id
      ${whereClause}
    `;

    const result = await this.locationRepository.raw(query, params);
    const row = result.rows ? result.rows[0] : result[0];

    const totalWarehouses = parseInt(row.total_warehouses || "0");
    const totalValue = parseFloat(row.total_value || "0");

    return {
      total_warehouses: totalWarehouses,
      total_products: parseInt(row.total_products || "0"),
      total_value: totalValue,
      average_value_per_warehouse:
        totalWarehouses > 0 ? totalValue / totalWarehouses : 0,
      warehouses_with_inventory: parseInt(row.warehouses_with_inventory || "0"),
    };
  }

  /**
   * Get locations with low inventory diversity (few products)
   */
  async getWarehousesWithLowDiversity(threshold: number = 10): Promise<
    Array<{
      warehouse_id: number;
      warehouse_name: string;
      product_count: number;
      total_value: number;
    }>
  > {
    const query = `
      SELECT 
        l.id as warehouse_id,
        l.name as warehouse_name,
        COUNT(DISTINCT p.id) as product_count,
        COALESCE(SUM(pl.quantity_on_hand * pl.unit_cost), 0) as total_value
      FROM locations l
      LEFT JOIN product_locations pl ON l.id = pl.location_id AND pl.quantity_on_hand > 0
      LEFT JOIN products p ON pl.product_id = p.id AND p.active = true
      WHERE l.active = true
      GROUP BY l.id, l.name
      HAVING COUNT(DISTINCT p.id) < ?
      ORDER BY product_count ASC, l.name
    `;

    const result = await this.locationRepository.raw(query, [threshold]);
    const rows = result.rows || result;

    return rows.map((row: any) => ({
      warehouse_id: row.warehouse_id,
      warehouse_name: row.warehouse_name,
      product_count: parseInt(row.product_count || "0"),
      total_value: parseFloat(row.total_value || "0"),
    }));
  }
}
