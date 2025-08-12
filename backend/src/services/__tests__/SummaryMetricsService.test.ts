import { SummaryMetricsService } from "../SummaryMetricsService";
import { ProductRepository } from "../../repositories/ProductRepository";
import { ProductLocationRepository } from "../../repositories/ProductLocationRepository";
import { CompanyRepository } from "../../repositories/CompanyRepository";

// Mock the repositories
jest.mock("../../repositories/ProductRepository");
jest.mock("../../repositories/ProductLocationRepository");
jest.mock("../../repositories/CompanyRepository");

describe("SummaryMetricsService", () => {
  let service: SummaryMetricsService;
  let mockProductRepository: jest.Mocked<ProductRepository>;
  let mockProductLocationRepository: jest.Mocked<ProductLocationRepository>;
  let mockCompanyRepository: jest.Mocked<CompanyRepository>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create service instance
    service = new SummaryMetricsService();

    // Get mocked instances
    mockProductRepository = (service as any).productRepository;
    mockProductLocationRepository = (service as any).productLocationRepository;
    mockCompanyRepository = (service as any).companyRepository;
  });

  const createMockQuery = () => ({
    leftJoin: jest.fn().mockReturnThis(),
    join: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    whereNotNull: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    having: jest.fn().mockReturnThis(),
    havingRaw: jest.fn().mockReturnThis(),
    count: jest.fn().mockReturnThis(),
    countDistinct: jest.fn().mockReturnThis(),
    sum: jest.fn().mockReturnThis(),
    first: jest.fn(),
  });

  describe("calculateSummaryMetrics", () => {
    it("should calculate summary metrics without warehouse filter", async () => {
      // Mock repository responses
      mockProductRepository.count.mockResolvedValue(100);
      mockCompanyRepository.count.mockResolvedValue(15);

      // Mock query builder for low stock and out of stock counts
      const mockLowStockQuery = createMockQuery();
      mockLowStockQuery.first.mockResolvedValue({ count: "25" });

      const mockOutOfStockQuery = createMockQuery();
      mockOutOfStockQuery.first.mockResolvedValue({ count: "5" });

      mockProductRepository.query
        .mockReturnValueOnce(mockLowStockQuery as any)
        .mockReturnValueOnce(mockOutOfStockQuery as any);

      // Mock total stock value query
      const mockStockValueQuery = createMockQuery();
      mockStockValueQuery.first.mockResolvedValue({ total_value: "125000.50" });

      const mockExcludedQuery = createMockQuery();
      mockExcludedQuery.first.mockResolvedValue({ count: "3" });

      mockProductLocationRepository.query
        .mockReturnValueOnce(mockStockValueQuery as any)
        .mockReturnValueOnce(mockExcludedQuery as any);

      const result = await service.calculateSummaryMetrics();

      expect(result).toEqual({
        total_products: {
          value: 100,
          status: "normal",
        },
        low_stock: {
          value: 25,
          status: "warning",
          threshold: 50,
        },
        out_of_stock: {
          value: 5,
          status: "warning",
        },
        suppliers: {
          value: 15,
          status: "normal",
        },
        total_stock_value: {
          value: 125000.5,
          currency: "USD",
          status: "normal",
          excluded_products: 3,
        },
      });
    });

    it("should calculate summary metrics with warehouse filter", async () => {
      const warehouseId = 1;

      // Mock join query for warehouse-filtered product count
      const mockWarehouseQuery = createMockQuery();
      mockWarehouseQuery.first.mockResolvedValue({ count: "50" });

      const mockLowStockQuery = createMockQuery();
      mockLowStockQuery.first.mockResolvedValue({ count: "10" });

      const mockOutOfStockQuery = createMockQuery();
      mockOutOfStockQuery.first.mockResolvedValue({ count: "2" });

      mockProductRepository.query
        .mockReturnValueOnce(mockWarehouseQuery as any)
        .mockReturnValueOnce(mockLowStockQuery as any)
        .mockReturnValueOnce(mockOutOfStockQuery as any);

      mockCompanyRepository.count.mockResolvedValue(15);

      const mockStockValueQuery = createMockQuery();
      mockStockValueQuery.first.mockResolvedValue({ total_value: "75000.25" });

      const mockExcludedQuery = createMockQuery();
      mockExcludedQuery.first.mockResolvedValue({ count: "1" });

      mockProductLocationRepository.query
        .mockReturnValueOnce(mockStockValueQuery as any)
        .mockReturnValueOnce(mockExcludedQuery as any);

      const result = await service.calculateSummaryMetrics(warehouseId);

      expect(result.total_products.value).toBe(50);
      expect(result.low_stock.value).toBe(10);
      expect(result.out_of_stock.value).toBe(2);
      expect(result.suppliers.value).toBe(15);
      expect(result.total_stock_value.value).toBe(75000.25);
      expect(result.total_stock_value.excluded_products).toBe(1);
    });

    it("should handle zero values correctly", async () => {
      // Mock all counts as zero
      mockProductRepository.count.mockResolvedValue(0);
      mockCompanyRepository.count.mockResolvedValue(0);

      const mockQuery = createMockQuery();
      mockQuery.first.mockResolvedValue({ count: "0" });

      mockProductRepository.query.mockReturnValue(mockQuery as any);

      const mockStockValueQuery = createMockQuery();
      mockStockValueQuery.first.mockResolvedValue({ total_value: null });

      const mockExcludedQuery = createMockQuery();
      mockExcludedQuery.first.mockResolvedValue({ count: "0" });

      mockProductLocationRepository.query
        .mockReturnValueOnce(mockStockValueQuery as any)
        .mockReturnValueOnce(mockExcludedQuery as any);

      const result = await service.calculateSummaryMetrics();

      expect(result.total_products.status).toBe("critical");
      expect(result.low_stock.status).toBe("normal");
      expect(result.out_of_stock.status).toBe("normal");
      expect(result.suppliers.status).toBe("critical");
      expect(result.total_stock_value.status).toBe("critical");
      expect(result.total_stock_value.value).toBe(0);
    });

    it("should set correct status indicators based on thresholds", async () => {
      // Test warning thresholds
      mockProductRepository.count.mockResolvedValue(5); // warning threshold
      mockCompanyRepository.count.mockResolvedValue(3); // warning threshold

      const mockLowStockQuery = createMockQuery();
      mockLowStockQuery.first.mockResolvedValue({ count: "25" }); // warning

      const mockOutOfStockQuery = createMockQuery();
      mockOutOfStockQuery.first.mockResolvedValue({ count: "7" }); // warning

      mockProductRepository.query
        .mockReturnValueOnce(mockLowStockQuery as any)
        .mockReturnValueOnce(mockOutOfStockQuery as any);

      const mockStockValueQuery = createMockQuery();
      mockStockValueQuery.first.mockResolvedValue({ total_value: "5000" }); // warning threshold

      const mockExcludedQuery = createMockQuery();
      mockExcludedQuery.first.mockResolvedValue({ count: "0" });

      mockProductLocationRepository.query
        .mockReturnValueOnce(mockStockValueQuery as any)
        .mockReturnValueOnce(mockExcludedQuery as any);

      const result = await service.calculateSummaryMetrics();

      expect(result.total_products.status).toBe("warning");
      expect(result.low_stock.status).toBe("warning");
      expect(result.out_of_stock.status).toBe("warning");
      expect(result.suppliers.status).toBe("warning");
      expect(result.total_stock_value.status).toBe("warning");
    });
  });
});
