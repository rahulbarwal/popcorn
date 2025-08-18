import { StockVisualizationService } from "../StockVisualizationService";
import { ProductRepository } from "../../repositories/ProductRepository";
import { LocationRepository } from "../../repositories/LocationRepository";
import { StockVisualizationResponse } from "../../types/api";

// Mock the repositories
jest.mock("../../repositories/ProductRepository");
jest.mock("../../repositories/ProductLocationRepository");
jest.mock("../../repositories/LocationRepository");

describe("StockVisualizationService", () => {
  let service: StockVisualizationService;
  let mockProductRepository: jest.Mocked<ProductRepository>;
  let mockLocationRepository: jest.Mocked<LocationRepository>;

  beforeEach(() => {
    service = new StockVisualizationService();
    mockProductRepository =
      ProductRepository.prototype as jest.Mocked<ProductRepository>;
    mockLocationRepository =
      LocationRepository.prototype as jest.Mocked<LocationRepository>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getStockVisualizationData", () => {
    it("should return stock visualization data for all warehouses", async () => {
      // Mock data
      const mockStockData = [
        {
          product_id: 1,
          product_name: "Product A",
          sku: "SKU-001",
          warehouse_id: 1,
          warehouse_name: "Main Warehouse",
          quantity: "150",
        },
        {
          product_id: 1,
          product_name: "Product A",
          sku: "SKU-001",
          warehouse_id: 2,
          warehouse_name: "Secondary Warehouse",
          quantity: "75",
        },
        {
          product_id: 2,
          product_name: "Product B",
          sku: "SKU-002",
          warehouse_id: 1,
          warehouse_name: "Main Warehouse",
          quantity: "200",
        },
      ];

      mockProductRepository.raw.mockResolvedValue({ rows: mockStockData });

      const result = await service.getStockVisualizationData();

      expect(result).toMatchObject({
        chart_data: {
          products: expect.arrayContaining([
            {
              product_id: 1,
              product_name: "Product A",
              sku: "SKU-001",
              warehouses: expect.arrayContaining([
                {
                  warehouse_id: 1,
                  warehouse_name: "Main Warehouse",
                  quantity: 150,
                  color: expect.any(String),
                },
                {
                  warehouse_id: 2,
                  warehouse_name: "Secondary Warehouse",
                  quantity: 75,
                  color: expect.any(String),
                },
              ]),
            },
            {
              product_id: 2,
              product_name: "Product B",
              sku: "SKU-002",
              warehouses: expect.arrayContaining([
                {
                  warehouse_id: 1,
                  warehouse_name: "Main Warehouse",
                  quantity: 200,
                  color: expect.any(String),
                },
              ]),
            },
          ]),
          chart_config: {
            title: "Stock by Product per Warehouse",
            x_axis_label: "Products",
            y_axis_label: "Stock Quantity",
            color_palette: expect.any(Array),
          },
        },
        filters: {
          warehouse_id: undefined,
          warehouse_name: "All Warehouses",
        },
        last_updated: expect.any(String),
      });

      expect(mockProductRepository.raw).toHaveBeenCalledWith(
        expect.stringContaining("SELECT"),
        []
      );
    });

    it("should return stock visualization data filtered by warehouse", async () => {
      const warehouseId = 1;
      const mockStockData = [
        {
          product_id: 1,
          product_name: "Product A",
          sku: "SKU-001",
          warehouse_id: 1,
          warehouse_name: "Main Warehouse",
          quantity: "150",
        },
        {
          product_id: 2,
          product_name: "Product B",
          sku: "SKU-002",
          warehouse_id: 1,
          warehouse_name: "Main Warehouse",
          quantity: "200",
        },
      ];

      const mockWarehouse = {
        id: 1,
        name: "Main Warehouse",
        warehouse_type: "main" as const,
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockProductRepository.raw.mockResolvedValue({ rows: mockStockData });
      mockLocationRepository.findById.mockResolvedValue(mockWarehouse);

      const result = await service.getStockVisualizationData({
        warehouse_id: warehouseId,
      });

      expect(result.filters).toEqual({
        warehouse_id: warehouseId,
        warehouse_name: "Main Warehouse",
      });

      expect(mockProductRepository.raw).toHaveBeenCalledWith(
        expect.stringContaining("AND pl.location_id = ?"),
        [warehouseId]
      );

      expect(mockLocationRepository.findById).toHaveBeenCalledWith(warehouseId);
    });

    it("should handle empty stock data", async () => {
      mockProductRepository.raw.mockResolvedValue({ rows: [] });

      const result = await service.getStockVisualizationData();

      expect(result.chart_data.products).toEqual([]);
      expect(result.filters.warehouse_name).toBe("All Warehouses");
    });

    it("should assign consistent colors to warehouses", async () => {
      const mockStockData = [
        {
          product_id: 1,
          product_name: "Product A",
          sku: "SKU-001",
          warehouse_id: 1,
          warehouse_name: "Warehouse 1",
          quantity: "100",
        },
        {
          product_id: 2,
          product_name: "Product B",
          sku: "SKU-002",
          warehouse_id: 1,
          warehouse_name: "Warehouse 1",
          quantity: "150",
        },
        {
          product_id: 1,
          product_name: "Product A",
          sku: "SKU-001",
          warehouse_id: 2,
          warehouse_name: "Warehouse 2",
          quantity: "75",
        },
      ];

      mockProductRepository.raw.mockResolvedValue({ rows: mockStockData });

      const result = await service.getStockVisualizationData();

      // Check that the same warehouse gets the same color across different products
      const warehouse1ColorInProduct1 = result.chart_data.products
        .find((p) => p.product_id === 1)
        ?.warehouses.find((w) => w.warehouse_id === 1)?.color;

      const warehouse1ColorInProduct2 = result.chart_data.products
        .find((p) => p.product_id === 2)
        ?.warehouses.find((w) => w.warehouse_id === 1)?.color;

      expect(warehouse1ColorInProduct1).toBe(warehouse1ColorInProduct2);
    });

    it("should handle warehouse not found gracefully", async () => {
      const warehouseId = 999;
      const mockStockData: any[] = [];

      mockProductRepository.raw.mockResolvedValue({ rows: mockStockData });
      mockLocationRepository.findById.mockResolvedValue(null);

      const result = await service.getStockVisualizationData({
        warehouse_id: warehouseId,
      });

      expect(result.filters).toEqual({
        warehouse_id: warehouseId,
        warehouse_name: "Unknown Warehouse",
      });
    });
  });

  describe("getWarehousesWithStock", () => {
    it("should return warehouses with stock and assigned colors", async () => {
      const mockWarehouses = [
        { id: 1, name: "Main Warehouse" },
        { id: 2, name: "Secondary Warehouse" },
        { id: 3, name: "Distribution Center" },
      ];

      mockLocationRepository.raw.mockResolvedValue({ rows: mockWarehouses });

      const result = await service.getWarehousesWithStock();

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        id: 1,
        name: "Main Warehouse",
        color: expect.any(String),
      });
      expect(result[1]).toMatchObject({
        id: 2,
        name: "Secondary Warehouse",
        color: expect.any(String),
      });
      expect(result[2]).toMatchObject({
        id: 3,
        name: "Distribution Center",
        color: expect.any(String),
      });

      // Verify colors are different
      const colors = result.map((w) => w.color);
      expect(new Set(colors).size).toBe(colors.length);
    });
  });

  describe("getProductStockVisualization", () => {
    it("should return stock visualization for a specific product", async () => {
      const productId = 1;
      const mockStockData = [
        {
          product_id: 1,
          product_name: "Product A",
          sku: "SKU-001",
          warehouse_id: 1,
          warehouse_name: "Main Warehouse",
          quantity: 150,
        },
        {
          product_id: 1,
          product_name: "Product A",
          sku: "SKU-001",
          warehouse_id: 2,
          warehouse_name: "Secondary Warehouse",
          quantity: 75,
        },
      ];

      mockProductRepository.raw.mockResolvedValue({ rows: mockStockData });

      const result = await service.getProductStockVisualization(productId);

      expect(result).toMatchObject({
        product_id: 1,
        product_name: "Product A",
        sku: "SKU-001",
        warehouses: expect.arrayContaining([
          {
            warehouse_id: 1,
            warehouse_name: "Main Warehouse",
            quantity: 150,
            color: expect.any(String),
          },
          {
            warehouse_id: 2,
            warehouse_name: "Secondary Warehouse",
            quantity: 75,
            color: expect.any(String),
          },
        ]),
      });

      expect(mockProductRepository.raw).toHaveBeenCalledWith(
        expect.stringContaining("WHERE p.id = ?"),
        [productId]
      );
    });

    it("should return null for product with no stock", async () => {
      const productId = 999;
      mockProductRepository.raw.mockResolvedValue({ rows: [] });

      const result = await service.getProductStockVisualization(productId);

      expect(result).toBeNull();
    });
  });

  describe("getTopProductsByStock", () => {
    it("should return top products by stock quantity", async () => {
      const limit = 5;
      const mockStockData = [
        {
          product_id: 1,
          product_name: "Product A",
          sku: "SKU-001",
          warehouse_id: 1,
          warehouse_name: "Main Warehouse",
          quantity: "500",
          total_quantity: "500",
        },
        {
          product_id: 2,
          product_name: "Product B",
          sku: "SKU-002",
          warehouse_id: 1,
          warehouse_name: "Main Warehouse",
          quantity: "300",
          total_quantity: "300",
        },
      ];

      mockProductRepository.raw.mockResolvedValue({ rows: mockStockData });

      const result = await service.getTopProductsByStock(limit);

      expect(result).toHaveLength(2);
      expect(result[0].product_name).toBe("Product A");
      expect(result[1].product_name).toBe("Product B");

      expect(mockProductRepository.raw).toHaveBeenCalledWith(
        expect.stringContaining("LIMIT ?"),
        [limit]
      );
    });

    it("should filter by warehouse when specified", async () => {
      const limit = 10;
      const warehouseId = 1;

      mockProductRepository.raw.mockResolvedValue({ rows: [] });

      await service.getTopProductsByStock(limit, warehouseId);

      expect(mockProductRepository.raw).toHaveBeenCalledWith(
        expect.stringContaining("AND pl.location_id = ?"),
        [warehouseId, limit]
      );
    });
  });

  describe("color assignment", () => {
    it("should cycle through color palette when there are more warehouses than colors", async () => {
      // Create mock data with more warehouses than available colors (10 colors in palette)
      const mockStockData = Array.from({ length: 15 }, (_, i) => ({
        product_id: 1,
        product_name: "Product A",
        sku: "SKU-001",
        warehouse_id: i + 1,
        warehouse_name: `Warehouse ${i + 1}`,
        quantity: "100",
      }));

      mockProductRepository.raw.mockResolvedValue({ rows: mockStockData });

      const result = await service.getStockVisualizationData();

      const product = result.chart_data.products[0];
      expect(product.warehouses).toHaveLength(15);

      // Check that colors cycle (warehouse 1 and 11 should have the same color)
      const warehouse1Color = product.warehouses.find(
        (w) => w.warehouse_id === 1
      )?.color;
      const warehouse11Color = product.warehouses.find(
        (w) => w.warehouse_id === 11
      )?.color;
      expect(warehouse1Color).toBe(warehouse11Color);
    });
  });
});
