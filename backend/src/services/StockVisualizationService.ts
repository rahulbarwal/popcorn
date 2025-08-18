import { ProductRepository } from "../repositories/ProductRepository";
import { ProductLocationRepository } from "../repositories/ProductLocationRepository";
import { LocationRepository } from "../repositories/LocationRepository";
import {
  StockVisualizationResponse,
  StockVisualizationProduct,
} from "../types/api";

export interface StockVisualizationFilters {
  warehouse_id?: number;
}

export class StockVisualizationService {
  private productRepository: ProductRepository;
  private productLocationRepository: ProductLocationRepository;
  private locationRepository: LocationRepository;

  // Predefined color palette for consistent warehouse representation
  private readonly COLOR_PALETTE = [
    "#3B82F6", // Blue
    "#10B981", // Green
    "#F59E0B", // Amber
    "#EF4444", // Red
    "#8B5CF6", // Purple
    "#06B6D4", // Cyan
    "#84CC16", // Lime
    "#F97316", // Orange
    "#EC4899", // Pink
    "#6B7280", // Gray
  ];

  constructor() {
    this.productRepository = new ProductRepository();
    this.productLocationRepository = new ProductLocationRepository();
    this.locationRepository = new LocationRepository();
  }

  /**
   * Get stock visualization data aggregated by product and warehouse
   */
  async getStockVisualizationData(
    filters: StockVisualizationFilters = {}
  ): Promise<StockVisualizationResponse> {
    // Get aggregated stock data by product and warehouse
    const chartData = await this.aggregateStockDataForChart(filters);

    // Get warehouse filter information
    const warehouseFilter = await this.getWarehouseFilterInfo(
      filters.warehouse_id
    );

    return {
      chart_data: {
        products: chartData,
        chart_config: {
          title: "Stock by Product per Warehouse",
          x_axis_label: "Products",
          y_axis_label: "Stock Quantity",
          color_palette: this.COLOR_PALETTE,
        },
      },
      filters: {
        warehouse_id: filters.warehouse_id,
        warehouse_name: warehouseFilter.name,
      },
      last_updated: new Date().toISOString(),
    };
  }

  /**
   * Aggregate stock data by product and warehouse for chart display
   */
  private async aggregateStockDataForChart(
    filters: StockVisualizationFilters
  ): Promise<StockVisualizationProduct[]> {
    const params: any[] = [];
    let whereClause = "WHERE p.active = true AND pl.quantity_on_hand > 0";

    // Apply warehouse filter if specified
    if (filters.warehouse_id) {
      whereClause += " AND pl.location_id = ?";
      params.push(filters.warehouse_id);
    }

    // Query to fetch product names, SKUs, and quantities grouped by warehouse
    const query = `
      SELECT 
        p.id as product_id,
        p.name as product_name,
        p.sku,
        l.id as warehouse_id,
        l.name as warehouse_name,
        SUM(pl.quantity_on_hand) as quantity
      FROM products p
      INNER JOIN product_locations pl ON p.id = pl.product_id
      INNER JOIN locations l ON pl.location_id = l.id
      ${whereClause}
      GROUP BY p.id, p.name, p.sku, l.id, l.name
      HAVING SUM(pl.quantity_on_hand) > 0
      ORDER BY p.name, l.name
    `;

    const result = await this.productRepository.raw(query, params);
    const stockData = result.rows || result;

    // Transform data into chart-ready format with proper grouping
    return this.transformDataForChart(stockData);
  }

  /**
   * Transform raw stock data into chart-ready format with warehouse grouping
   */
  private transformDataForChart(stockData: any[]): StockVisualizationProduct[] {
    // Group data by product
    const productMap = new Map<number, StockVisualizationProduct>();

    // Create a warehouse color mapping for consistent representation
    const warehouseColorMap = new Map<number, string>();
    let colorIndex = 0;

    for (const row of stockData) {
      const productId = row.product_id;
      const warehouseId = row.warehouse_id;

      // Assign color to warehouse if not already assigned
      if (!warehouseColorMap.has(warehouseId)) {
        warehouseColorMap.set(
          warehouseId,
          this.COLOR_PALETTE[colorIndex % this.COLOR_PALETTE.length]
        );
        colorIndex++;
      }

      // Get or create product entry
      if (!productMap.has(productId)) {
        productMap.set(productId, {
          product_id: productId,
          product_name: row.product_name,
          sku: row.sku,
          warehouses: [],
        });
      }

      const product = productMap.get(productId)!;

      // Add warehouse data to product
      product.warehouses.push({
        warehouse_id: warehouseId,
        warehouse_name: row.warehouse_name,
        quantity: parseInt(row.quantity),
        color: warehouseColorMap.get(warehouseId)!,
      });
    }

    // Convert map to array and sort by product name
    return Array.from(productMap.values()).sort((a, b) =>
      a.product_name.localeCompare(b.product_name)
    );
  }

  /**
   * Get warehouse filter information for response
   */
  private async getWarehouseFilterInfo(
    warehouseId?: number
  ): Promise<{ id?: number; name: string }> {
    if (!warehouseId) {
      return { name: "All Warehouses" };
    }

    try {
      const warehouse = await this.locationRepository.findById(warehouseId);
      return {
        id: warehouseId,
        name: warehouse?.name || "Unknown Warehouse",
      };
    } catch (error) {
      return {
        id: warehouseId,
        name: "Unknown Warehouse",
      };
    }
  }

  /**
   * Get available warehouses with stock data for color assignment
   */
  async getWarehousesWithStock(): Promise<
    Array<{ id: number; name: string; color: string }>
  > {
    const query = `
      SELECT DISTINCT 
        l.id,
        l.name
      FROM locations l
      INNER JOIN product_locations pl ON l.id = pl.location_id
      WHERE pl.quantity_on_hand > 0
      ORDER BY l.name
    `;

    const result = await this.locationRepository.raw(query);
    const warehouses = result.rows || result;

    // Assign colors to warehouses
    return warehouses.map((warehouse: any, index: number) => ({
      id: warehouse.id,
      name: warehouse.name,
      color: this.COLOR_PALETTE[index % this.COLOR_PALETTE.length],
    }));
  }

  /**
   * Get stock data for a specific product across warehouses
   */
  async getProductStockVisualization(
    productId: number
  ): Promise<StockVisualizationProduct | null> {
    const query = `
      SELECT 
        p.id as product_id,
        p.name as product_name,
        p.sku,
        l.id as warehouse_id,
        l.name as warehouse_name,
        pl.quantity_on_hand as quantity
      FROM products p
      INNER JOIN product_locations pl ON p.id = pl.product_id
      INNER JOIN locations l ON pl.location_id = l.id
      WHERE p.id = ? AND pl.quantity_on_hand > 0
      ORDER BY l.name
    `;

    const result = await this.productRepository.raw(query, [productId]);
    const stockData = result.rows || result;

    if (stockData.length === 0) {
      return null;
    }

    const transformedData = this.transformDataForChart(stockData);
    return transformedData[0] || null;
  }

  /**
   * Get top products by stock quantity for chart display
   */
  async getTopProductsByStock(
    limit: number = 10,
    warehouseId?: number
  ): Promise<StockVisualizationProduct[]> {
    const params: any[] = [];
    let whereClause = "WHERE p.active = true AND pl.quantity_on_hand > 0";

    if (warehouseId) {
      whereClause += " AND pl.location_id = ?";
      params.push(warehouseId);
    }

    const query = `
      SELECT 
        p.id as product_id,
        p.name as product_name,
        p.sku,
        l.id as warehouse_id,
        l.name as warehouse_name,
        SUM(pl.quantity_on_hand) as quantity,
        SUM(pl.quantity_on_hand) as total_quantity
      FROM products p
      INNER JOIN product_locations pl ON p.id = pl.product_id
      INNER JOIN locations l ON pl.location_id = l.id
      ${whereClause}
      GROUP BY p.id, p.name, p.sku, l.id, l.name
      ORDER BY total_quantity DESC, p.name
      LIMIT ?
    `;

    params.push(limit);

    const result = await this.productRepository.raw(query, params);
    const stockData = result.rows || result;

    return this.transformDataForChart(stockData);
  }
}
