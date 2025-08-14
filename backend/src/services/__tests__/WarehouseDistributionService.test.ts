import { WarehouseDistributionService } from "../WarehouseDistributionService";
import { LocationRepository } from "../../repositories/LocationRepository";
import { ProductLocationRepository } from "../../repositories/ProductLocationRepository";
import { ProductRepository } from "../../repositories/ProductRepository";

// Mock the repositories
jest.mock("../../repositories/LocationRepository");
jest.mock("../../repositories/ProductLocationRepository");
jest.mock("../../repositories/ProductRepository");

describe("WarehouseDistributionService", () => {
  let service: WarehouseDistributionService;
  let mockLocationRepository: jest.Mocked<LocationRepository>;
  let mockProductLocationRepository: jest.Mocked<ProductLocationRepository>;
  let mockProductRepository: jest.Mocked<ProductRepository>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create service instance
    service = new WarehouseDistributionService();

    // Get mocked repository instances
    mockLocationRepository =
      LocationRepository.prototype as jest.Mocked<LocationRepository>;
    mockProductLocationRepository =
      ProductLocationRepository.prototype as jest.Mocked<ProductLocationRepository>;
    mockProductRepository =
      ProductRepository.prototype as jest.Mocked<ProductRepository>;
  });

  describe("getWarehouseDistribution", () => {
    it("should return warehouse distribution data", async () => {
      // Mock raw query response
      const mockQueryResult = [
        {
          warehouse_id: 1,
          warehouse_name: "Main Warehouse",
          warehouse_address: "123 Main St",
          product_id: 1,
          sku: "ABC-123",
          product_name: "Product A",
          quantity: 100,
          unit_cost: 25.5,
          total_value: 2550.0,
        },
        {
          warehouse_id: 1,
          warehouse_name: "Main Warehouse",
          warehouse_address: "123 Main St",
          product_id: 2,
          sku: "DEF-456",
          product_name: "Product B",
          quantity: 50,
          unit_cost: 15.0,
          total_value: 750.0,
        },
        {
          warehouse_id: 2,
          warehouse_name: "Secondary Warehouse",
          warehouse_address: "456 Oak Ave",
          product_id: 1,
          sku: "ABC-123",
          product_name: "Product A",
          quantity: 75,
          unit_cost: 25.5,
          total_value: 1912.5,
        },
      ];

      mockLocationRepository.raw.mockResolvedValue(mockQueryResult);

      const result = await service.getWarehouseDistribution();

      expect(result).toEqual({
        warehouses: [
          {
            warehouse_id: 1,
            warehouse_name: "Main Warehouse",
            warehouse_address: "123 Main St",
            products: [
              {
                product_id: 1,
                sku: "ABC-123",
                name: "Product A",
                quantity: 100,
                unit_cost: 25.5,
                total_value: 2550.0,
              },
              {
                product_id: 2,
                sku: "DEF-456",
                name: "Product B",
                quantity: 50,
                unit_cost: 15.0,
                total_value: 750.0,
              },
            ],
            total_products: 2,
            total_value: 3300.0,
          },
          {
            warehouse_id: 2,
            warehouse_name: "Secondary Warehouse",
            warehouse_address: "456 Oak Ave",
            products: [
              {
                product_id: 1,
                sku: "ABC-123",
                name: "Product A",
                quantity: 75,
                unit_cost: 25.5,
                total_value: 1912.5,
              },
            ],
            total_products: 1,
            total_value: 1912.5,
          },
        ],
      });

      expect(mockLocationRepository.raw).toHaveBeenCalledWith(
        expect.stringContaining("FROM locations l"),
        []
      );
    });

    it("should filter by warehouse_id when provided", async () => {
      const mockQueryResult = [
        {
          warehouse_id: 1,
          warehouse_name: "Main Warehouse",
          warehouse_address: "123 Main St",
          product_id: 1,
          sku: "ABC-123",
          product_name: "Product A",
          quantity: 100,
          unit_cost: 25.5,
          total_value: 2550.0,
        },
      ];

      mockLocationRepository.raw.mockResolvedValue(mockQueryResult);

      await service.getWarehouseDistribution({ warehouse_id: 1 });

      expect(mockLocationRepository.raw).toHaveBeenCalledWith(
        expect.stringContaining("AND l.id = ?"),
        [1]
      );
    });

    it("should filter by product_id when provided", async () => {
      const mockQueryResult: any[] = [];
      mockLocationRepository.raw.mockResolvedValue(mockQueryResult);

      await service.getWarehouseDistribution({ product_id: 1 });

      expect(mockLocationRepository.raw).toHaveBeenCalledWith(
        expect.stringContaining("AND p.id = ?"),
        [1]
      );
    });

    it("should filter by category when provided", async () => {
      const mockQueryResult: any[] = [];
      mockLocationRepository.raw.mockResolvedValue(mockQueryResult);

      await service.getWarehouseDistribution({ category: "Electronics" });

      expect(mockLocationRepository.raw).toHaveBeenCalledWith(
        expect.stringContaining("AND p.category = ?"),
        ["Electronics"]
      );
    });

    it("should filter by min_value when provided", async () => {
      const mockQueryResult = [
        {
          warehouse_id: 1,
          warehouse_name: "Main Warehouse",
          warehouse_address: "123 Main St",
          product_id: 1,
          sku: "ABC-123",
          product_name: "Product A",
          quantity: 100,
          unit_cost: 25.5,
          total_value: 2550.0,
        },
        {
          warehouse_id: 1,
          warehouse_name: "Main Warehouse",
          warehouse_address: "123 Main St",
          product_id: 2,
          sku: "DEF-456",
          product_name: "Product B",
          quantity: 10,
          unit_cost: 5.0,
          total_value: 50.0,
        },
      ];

      mockLocationRepository.raw.mockResolvedValue(mockQueryResult);

      const result = await service.getWarehouseDistribution({ min_value: 100 });

      // Should only include products with total_value >= 100
      expect(result.warehouses[0].products).toHaveLength(1);
      expect(result.warehouses[0].products[0].total_value).toBe(2550.0);
      expect(result.warehouses[0].total_value).toBe(2550.0);
    });

    it("should return empty warehouses array when no data found", async () => {
      const mockQueryResult: any[] = [];
      mockLocationRepository.raw.mockResolvedValue(mockQueryResult);

      const result = await service.getWarehouseDistribution();

      expect(result).toEqual({
        warehouses: [],
      });
    });
  });

  describe("identifyStockImbalances", () => {
    it("should identify products with stock distribution imbalances", async () => {
      const mockQueryResult = [
        {
          product_id: 1,
          sku: "ABC-123",
          product_name: "Product A",
          warehouse_id: 1,
          warehouse_name: "Main Warehouse",
          quantity: 90,
          total_stock: 100,
        },
        {
          product_id: 1,
          sku: "ABC-123",
          product_name: "Product A",
          warehouse_id: 2,
          warehouse_name: "Secondary Warehouse",
          quantity: 10,
          total_stock: 100,
        },
      ];

      mockProductRepository.raw.mockResolvedValue(mockQueryResult);

      const result = await service.identifyStockImbalances();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        product_id: 1,
        sku: "ABC-123",
        name: "Product A",
        total_stock: 100,
        locations: [
          {
            warehouse_id: 1,
            warehouse_name: "Main Warehouse",
            quantity: 90,
            percentage: 90,
          },
          {
            warehouse_id: 2,
            warehouse_name: "Secondary Warehouse",
            quantity: 10,
            percentage: 10,
          },
        ],
      });

      expect(result[0].imbalance_score).toBeGreaterThan(0.3);
      expect(result[0].suggested_transfers).toBeDefined();
      expect(result[0].suggested_transfers!.length).toBeGreaterThan(0);
    });

    it("should not include products with balanced distribution", async () => {
      const mockQueryResult = [
        {
          product_id: 1,
          sku: "ABC-123",
          product_name: "Product A",
          warehouse_id: 1,
          warehouse_name: "Main Warehouse",
          quantity: 50,
          total_stock: 100,
        },
        {
          product_id: 1,
          sku: "ABC-123",
          product_name: "Product A",
          warehouse_id: 2,
          warehouse_name: "Secondary Warehouse",
          quantity: 50,
          total_stock: 100,
        },
      ];

      mockProductRepository.raw.mockResolvedValue(mockQueryResult);

      const result = await service.identifyStockImbalances();

      // Should not include products with balanced distribution (imbalance_score <= 0.3)
      expect(result).toHaveLength(0);
    });

    it("should not include products in single warehouse", async () => {
      const mockQueryResult: any[] = [
        {
          product_id: 1,
          sku: "ABC-123",
          product_name: "Product A",
          warehouse_id: 1,
          warehouse_name: "Main Warehouse",
          quantity: 100,
          total_stock: 100,
        },
      ];

      mockProductRepository.raw.mockResolvedValue(mockQueryResult);

      const result = await service.identifyStockImbalances();

      // Should not include products in only one warehouse
      expect(result).toHaveLength(0);
    });
  });

  describe("getWarehouseSummaryStats", () => {
    it("should return warehouse summary statistics", async () => {
      const mockQueryResult = [
        {
          total_warehouses: "3",
          total_products: "150",
          total_value: "125000.50",
          warehouses_with_inventory: "2",
        },
      ];

      mockLocationRepository.raw.mockResolvedValue(mockQueryResult);

      const result = await service.getWarehouseSummaryStats();

      expect(result).toEqual({
        total_warehouses: 3,
        total_products: 150,
        total_value: 125000.5,
        average_value_per_warehouse: 41666.833333333336,
        warehouses_with_inventory: 2,
      });
    });

    it("should handle zero warehouses gracefully", async () => {
      const mockQueryResult = [
        {
          total_warehouses: "0",
          total_products: "0",
          total_value: "0",
          warehouses_with_inventory: "0",
        },
      ];

      mockLocationRepository.raw.mockResolvedValue(mockQueryResult);

      const result = await service.getWarehouseSummaryStats();

      expect(result).toEqual({
        total_warehouses: 0,
        total_products: 0,
        total_value: 0,
        average_value_per_warehouse: 0,
        warehouses_with_inventory: 0,
      });
    });

    it("should filter by warehouse_id when provided", async () => {
      const mockQueryResult = [
        {
          total_warehouses: "1",
          total_products: "50",
          total_value: "25000.00",
          warehouses_with_inventory: "1",
        },
      ];

      mockLocationRepository.raw.mockResolvedValue(mockQueryResult);

      await service.getWarehouseSummaryStats(1);

      expect(mockLocationRepository.raw).toHaveBeenCalledWith(
        expect.stringContaining("AND l.id = ?"),
        [1]
      );
    });
  });

  describe("getWarehousesWithLowDiversity", () => {
    it("should return warehouses with low product diversity", async () => {
      const mockQueryResult = [
        {
          warehouse_id: 3,
          warehouse_name: "Small Warehouse",
          product_count: "5",
          total_value: "1000.00",
        },
        {
          warehouse_id: 4,
          warehouse_name: "Specialty Warehouse",
          product_count: "8",
          total_value: "5000.00",
        },
      ];

      mockLocationRepository.raw.mockResolvedValue(mockQueryResult);

      const result = await service.getWarehousesWithLowDiversity(10);

      expect(result).toEqual([
        {
          warehouse_id: 3,
          warehouse_name: "Small Warehouse",
          product_count: 5,
          total_value: 1000.0,
        },
        {
          warehouse_id: 4,
          warehouse_name: "Specialty Warehouse",
          product_count: 8,
          total_value: 5000.0,
        },
      ]);

      expect(mockLocationRepository.raw).toHaveBeenCalledWith(
        expect.stringContaining("HAVING COUNT(DISTINCT p.id) < ?"),
        [10]
      );
    });

    it("should use default threshold of 10 when not provided", async () => {
      const mockQueryResult: any[] = [];
      mockLocationRepository.raw.mockResolvedValue(mockQueryResult);

      await service.getWarehousesWithLowDiversity();

      expect(mockLocationRepository.raw).toHaveBeenCalledWith(
        expect.stringContaining("HAVING COUNT(DISTINCT p.id) < ?"),
        [10]
      );
    });
  });

  describe("getProductWarehouseDistribution", () => {
    it("should return distribution for specific product", async () => {
      const mockQueryResult = [
        {
          warehouse_id: 1,
          warehouse_name: "Main Warehouse",
          warehouse_address: "123 Main St",
          product_id: 1,
          sku: "ABC-123",
          product_name: "Product A",
          quantity: 100,
          unit_cost: 25.5,
          total_value: 2550.0,
        },
      ];

      mockLocationRepository.raw.mockResolvedValue(mockQueryResult);

      const result = await service.getProductWarehouseDistribution(1);

      expect(mockLocationRepository.raw).toHaveBeenCalledWith(
        expect.stringContaining("AND p.id = ?"),
        [1]
      );

      expect(result.warehouses).toHaveLength(1);
      expect(result.warehouses[0].products[0].product_id).toBe(1);
    });
  });

  describe("getProductsByWarehouse", () => {
    it("should return products for specific warehouse", async () => {
      const mockQueryResult = [
        {
          warehouse_id: 1,
          warehouse_name: "Main Warehouse",
          warehouse_address: "123 Main St",
          product_id: 1,
          sku: "ABC-123",
          product_name: "Product A",
          quantity: 100,
          unit_cost: 25.5,
          total_value: 2550.0,
        },
      ];

      mockLocationRepository.raw.mockResolvedValue(mockQueryResult);

      const result = await service.getProductsByWarehouse(1);

      expect(mockLocationRepository.raw).toHaveBeenCalledWith(
        expect.stringContaining("AND l.id = ?"),
        [1]
      );

      expect(result).not.toBeNull();
      expect(result!.warehouse_id).toBe(1);
      expect(result!.products).toHaveLength(1);
    });

    it("should return null when warehouse has no products", async () => {
      const mockQueryResult: any[] = [];
      mockLocationRepository.raw.mockResolvedValue(mockQueryResult);

      const result = await service.getProductsByWarehouse(999);

      expect(result).toBeNull();
    });
  });
});
