import { SupplierService } from "../SupplierService";
import { CompanyRepository } from "../../repositories/CompanyRepository";
import { PurchaseOrderRepository } from "../../repositories/PurchaseOrderRepository";
import { Company } from "../../types/database";

// Mock the repositories
jest.mock("../../repositories/CompanyRepository");
jest.mock("../../repositories/PurchaseOrderRepository");

describe("SupplierService", () => {
  let service: SupplierService;
  let mockCompanyRepository: jest.Mocked<CompanyRepository>;
  let mockPurchaseOrderRepository: jest.Mocked<PurchaseOrderRepository>;

  const mockSupplier: Company = {
    id: 1,
    name: "Test Supplier",
    contact_name: "John Doe",
    email: "john@testsupplier.com",
    phone: "+1-555-0123",
    address: "123 Main St",
    city: "Test City",
    state: "TS",
    zip_code: "12345",
    supplier_type: "primary",
    active: true,
    created_at: new Date("2024-01-01"),
    updated_at: new Date("2024-01-01"),
  };

  const mockOrdersData = [
    {
      id: 1,
      order_date: "2024-12-01",
      expected_delivery_date: "2024-12-15",
      status: "delivered",
      total_amount: "1500.00",
      product_count: "3",
      delivery_variance_days: "-1", // Delivered 1 day early
    },
    {
      id: 2,
      order_date: "2024-11-15",
      expected_delivery_date: "2024-11-30",
      status: "delivered",
      total_amount: "2000.00",
      product_count: "5",
      delivery_variance_days: "2", // Delivered 2 days late
    },
    {
      id: 3,
      order_date: "2024-10-01",
      expected_delivery_date: null,
      status: "pending",
      total_amount: "800.00",
      product_count: "2",
      delivery_variance_days: null,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockCompanyRepository =
      new CompanyRepository() as jest.Mocked<CompanyRepository>;
    mockPurchaseOrderRepository =
      new PurchaseOrderRepository() as jest.Mocked<PurchaseOrderRepository>;

    service = new SupplierService();

    // Replace the repository instances with mocks
    (service as any).companyRepository = mockCompanyRepository;
    (service as any).purchaseOrderRepository = mockPurchaseOrderRepository;
  });

  describe("getAllSuppliers", () => {
    it("should return all active suppliers by default", async () => {
      const mockSuppliers = [mockSupplier];
      mockCompanyRepository.findActiveSuppliers.mockResolvedValue(
        mockSuppliers
      );

      const result = await service.getAllSuppliers();

      expect(mockCompanyRepository.findActiveSuppliers).toHaveBeenCalled();
      expect(result).toEqual(mockSuppliers);
    });

    it("should include inactive suppliers when requested", async () => {
      const mockSuppliers = [mockSupplier];
      mockCompanyRepository.findAllSuppliersOrdered.mockResolvedValue(
        mockSuppliers
      );

      const result = await service.getAllSuppliers(true);

      expect(mockCompanyRepository.findAllSuppliersOrdered).toHaveBeenCalled();
      expect(result).toEqual(mockSuppliers);
    });
  });

  describe("getSupplierById", () => {
    it("should return supplier contact info when supplier exists", async () => {
      mockCompanyRepository.findById.mockResolvedValue(mockSupplier);

      const result = await service.getSupplierById(1);

      expect(mockCompanyRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        id: mockSupplier.id,
        name: mockSupplier.name,
        contact_name: mockSupplier.contact_name,
        email: mockSupplier.email,
        phone: mockSupplier.phone,
        address: mockSupplier.address,
        city: mockSupplier.city,
        state: mockSupplier.state,
        zip_code: mockSupplier.zip_code,
        supplier_type: mockSupplier.supplier_type,
        active: mockSupplier.active,
      });
    });

    it("should return null when supplier does not exist", async () => {
      mockCompanyRepository.findById.mockResolvedValue(null);

      const result = await service.getSupplierById(999);

      expect(mockCompanyRepository.findById).toHaveBeenCalledWith(999);
      expect(result).toBeNull();
    });
  });

  describe("calculateSupplierPerformance", () => {
    it("should calculate performance metrics correctly", async () => {
      // Mock the raw query response
      mockPurchaseOrderRepository.raw.mockResolvedValue({
        rows: mockOrdersData,
      });

      const result = await service.calculateSupplierPerformance(1);

      expect(result.total_orders).toBe(3);
      expect(result.total_value).toBe(4300); // 1500 + 2000 + 800
      expect(result.average_order_value).toBe(4300 / 3);
      expect(result.on_time_delivery_rate).toBe(50); // 1 out of 2 delivered orders was on time
      expect(result.average_delivery_days).toBe(0.5); // (-1 + 2) / 2
      expect(result.last_order_date).toBe("2024-12-01");
    });

    it("should return zero metrics when supplier has no orders", async () => {
      mockPurchaseOrderRepository.raw.mockResolvedValue({
        rows: [],
      });

      const result = await service.calculateSupplierPerformance(1);

      expect(result.total_orders).toBe(0);
      expect(result.total_value).toBe(0);
      expect(result.average_order_value).toBe(0);
      expect(result.on_time_delivery_rate).toBe(0);
      expect(result.average_delivery_days).toBe(0);
      expect(result.orders_last_30_days).toBe(0);
      expect(result.orders_last_90_days).toBe(0);
      expect(result.reliability_score).toBe(0);
    });

    it("should handle orders without delivery data", async () => {
      const ordersWithoutDeliveryData = [
        {
          id: 1,
          order_date: "2024-12-01",
          expected_delivery_date: null,
          status: "pending",
          total_amount: "1000.00",
          product_count: "2",
          delivery_variance_days: null,
        },
      ];

      mockPurchaseOrderRepository.raw.mockResolvedValue({
        rows: ordersWithoutDeliveryData,
      });

      const result = await service.calculateSupplierPerformance(1);

      expect(result.total_orders).toBe(1);
      expect(result.on_time_delivery_rate).toBe(0);
      expect(result.average_delivery_days).toBe(0);
    });
  });

  describe("getSupplierRecentOrders", () => {
    it("should return recent orders with correct formatting", async () => {
      const mockRecentOrders = [
        {
          id: 1,
          po_number: "PO-2024-001",
          order_date: "2024-12-01",
          expected_delivery_date: "2024-12-15",
          status: "pending",
          total_amount: "1500.00",
          product_count: "3",
          is_overdue: false,
        },
      ];

      mockPurchaseOrderRepository.raw.mockResolvedValue({
        rows: mockRecentOrders,
      });

      const result = await service.getSupplierRecentOrders(1, 10);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 1,
        po_number: "PO-2024-001",
        order_date: "2024-12-01",
        expected_delivery_date: "2024-12-15",
        status: "pending",
        total_amount: 1500,
        product_count: 3,
        is_overdue: false,
      });
    });

    it("should handle orders without expected delivery date", async () => {
      const mockRecentOrders = [
        {
          id: 1,
          po_number: "PO-2024-001",
          order_date: "2024-12-01",
          expected_delivery_date: null,
          status: "pending",
          total_amount: "1500.00",
          product_count: "3",
          is_overdue: false,
        },
      ];

      mockPurchaseOrderRepository.raw.mockResolvedValue({
        rows: mockRecentOrders,
      });

      const result = await service.getSupplierRecentOrders(1, 10);

      expect(result[0].expected_delivery_date).toBeUndefined();
    });
  });

  describe("getSupplierOrderHistory", () => {
    it("should return order history with product details", async () => {
      const mockOrders = [
        {
          id: 1,
          po_number: "PO-2024-001",
          order_date: "2024-12-01",
          expected_delivery_date: "2024-12-15",
          status: "pending",
          total_amount: "1500.00",
          product_count: "3",
        },
      ];

      const mockTotals = [
        {
          total_orders: "5",
          total_value: "7500.00",
        },
      ];

      const mockProducts = [
        {
          product_id: 1,
          sku: "ABC-123",
          name: "Test Product",
          quantity_ordered: "10",
          quantity_received: "8",
          unit_price: "50.00",
          total_price: "500.00",
        },
      ];

      mockPurchaseOrderRepository.raw
        .mockResolvedValueOnce({ rows: mockOrders }) // First call for orders
        .mockResolvedValueOnce({ rows: mockTotals }) // Second call for totals
        .mockResolvedValueOnce({ rows: mockProducts }); // Third call for products

      const result = await service.getSupplierOrderHistory(1, 50, 0);

      expect(result.supplier_id).toBe(1);
      expect(result.total_orders).toBe(5);
      expect(result.total_value).toBe(7500);
      expect(result.orders).toHaveLength(1);
      expect(result.orders[0].products).toHaveLength(1);
      expect(result.orders[0].products[0]).toEqual({
        product_id: 1,
        sku: "ABC-123",
        name: "Test Product",
        quantity_ordered: 10,
        quantity_received: 8,
        unit_price: 50,
        total_price: 500,
      });
    });
  });

  describe("getSuppliersForProducts", () => {
    it("should return suppliers associated with products", async () => {
      const mockSuppliers = [mockSupplier];
      mockCompanyRepository.raw.mockResolvedValue({
        rows: mockSuppliers,
      });

      const result = await service.getSuppliersForProducts([1, 2, 3]);

      expect(mockCompanyRepository.raw).toHaveBeenCalledWith(
        expect.stringContaining("SELECT DISTINCT c.*"),
        [[1, 2, 3]]
      );
      expect(result).toEqual(mockSuppliers);
    });

    it("should return empty array when no product IDs provided", async () => {
      const result = await service.getSuppliersForProducts([]);

      expect(mockCompanyRepository.raw).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe("searchSuppliers", () => {
    it("should search suppliers using repository search", async () => {
      const mockSuppliers = [mockSupplier];
      mockCompanyRepository.searchSuppliersOrdered.mockResolvedValue(
        mockSuppliers
      );

      const result = await service.searchSuppliers("test", 20);

      expect(mockCompanyRepository.searchSuppliersOrdered).toHaveBeenCalledWith(
        "test",
        20
      );
      expect(result).toEqual(mockSuppliers);
    });
  });

  describe("getSupplierWithPerformance", () => {
    it("should return supplier with performance metrics and recent orders", async () => {
      mockCompanyRepository.findById.mockResolvedValue(mockSupplier);

      // Mock performance calculation
      mockPurchaseOrderRepository.raw
        .mockResolvedValueOnce({ rows: mockOrdersData }) // For performance calculation
        .mockResolvedValueOnce({ rows: [] }); // For recent orders

      const result = await service.getSupplierWithPerformance(1);

      expect(result).toBeDefined();
      expect(result!.id).toBe(mockSupplier.id);
      expect(result!.performance).toBeDefined();
      expect(result!.recent_orders).toBeDefined();
    });

    it("should return null when supplier does not exist", async () => {
      mockCompanyRepository.findById.mockResolvedValue(null);

      const result = await service.getSupplierWithPerformance(999);

      expect(result).toBeNull();
    });
  });

  describe("getSupplierPerformanceRankings", () => {
    it("should return ranked suppliers by reliability score", async () => {
      const mockSuppliers = [mockSupplier];
      mockCompanyRepository.findActiveSuppliers.mockResolvedValue(
        mockSuppliers
      );

      // Mock performance calculation
      mockPurchaseOrderRepository.raw.mockResolvedValue({
        rows: mockOrdersData,
      });

      const result = await service.getSupplierPerformanceRankings(10);

      expect(result).toHaveLength(1);
      expect(result[0].rank).toBe(1);
      expect(result[0].supplier.id).toBe(mockSupplier.id);
      expect(result[0].performance).toBeDefined();
    });

    it("should filter out suppliers with no orders", async () => {
      const mockSuppliers = [mockSupplier];
      mockCompanyRepository.findActiveSuppliers.mockResolvedValue(
        mockSuppliers
      );

      // Mock no orders for supplier
      mockPurchaseOrderRepository.raw.mockResolvedValue({
        rows: [],
      });

      const result = await service.getSupplierPerformanceRankings(10);

      expect(result).toHaveLength(0);
    });
  });

  describe("getSuppliersWithRecentActivity", () => {
    it("should return suppliers with recent orders", async () => {
      const mockSuppliers = [mockSupplier];
      mockCompanyRepository.getSuppliersWithRecentOrders.mockResolvedValue(
        mockSuppliers
      );

      const result = await service.getSuppliersWithRecentActivity(30);

      expect(
        mockCompanyRepository.getSuppliersWithRecentOrders
      ).toHaveBeenCalledWith(30);
      expect(result).toEqual(mockSuppliers);
    });
  });
});
