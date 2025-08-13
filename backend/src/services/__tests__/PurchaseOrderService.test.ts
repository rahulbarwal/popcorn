import { PurchaseOrderService } from "../PurchaseOrderService";
import { PurchaseOrderRepository } from "../../repositories/PurchaseOrderRepository";
import { CompanyRepository } from "../../repositories/CompanyRepository";
import { OrderStatus } from "../../types";

// Mock the repositories
jest.mock("../../repositories/PurchaseOrderRepository");
jest.mock("../../repositories/CompanyRepository");

describe("PurchaseOrderService", () => {
  let service: PurchaseOrderService;
  let mockPurchaseOrderRepository: jest.Mocked<PurchaseOrderRepository>;
  let mockCompanyRepository: jest.Mocked<CompanyRepository>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create mocked instances
    mockPurchaseOrderRepository =
      new PurchaseOrderRepository() as jest.Mocked<PurchaseOrderRepository>;
    mockCompanyRepository =
      new CompanyRepository() as jest.Mocked<CompanyRepository>;

    // Create service instance
    service = new PurchaseOrderService();

    // Replace the repository instances with mocks
    (service as any).purchaseOrderRepository = mockPurchaseOrderRepository;
    (service as any).companyRepository = mockCompanyRepository;
  });

  describe("getRecentPurchases", () => {
    const mockOrdersData = [
      {
        id: 1,
        po_number: "PO-2024-001",
        supplier_id: 1,
        supplier_name: "Supplier A",
        supplier_contact_name: "John Doe",
        order_date: new Date("2024-12-01"),
        expected_delivery_date: new Date("2024-12-15"),
        status: "pending" as OrderStatus,
        total_amount: 1500.0,
        notes: "Test order",
        created_at: new Date(),
        updated_at: new Date(),
        product_count: 5,
        is_overdue: false,
      },
      {
        id: 2,
        po_number: "PO-2024-002",
        supplier_id: 2,
        supplier_name: "Supplier B",
        supplier_contact_name: "Jane Smith",
        order_date: new Date("2024-11-28"),
        expected_delivery_date: new Date("2024-12-10"),
        status: "shipped" as OrderStatus,
        total_amount: 2300.0,
        notes: "Test order 2",
        created_at: new Date(),
        updated_at: new Date(),
        product_count: 8,
        is_overdue: true,
      },
    ];

    it("should return recent purchases with default limit", async () => {
      mockPurchaseOrderRepository.getRecentOrdersWithSuppliers.mockResolvedValue(
        mockOrdersData
      );

      const result = await service.getRecentPurchases();

      expect(
        mockPurchaseOrderRepository.getRecentOrdersWithSuppliers
      ).toHaveBeenCalledWith(10, undefined);
      expect(result.recent_orders).toHaveLength(2);
      expect(result.recent_orders[0]).toEqual({
        id: 1,
        po_number: "PO-2024-001",
        supplier: {
          id: 1,
          name: "Supplier A",
          contact_name: "John Doe",
        },
        order_date: "2024-12-01",
        expected_delivery_date: "2024-12-15",
        status: "pending",
        product_count: 5,
        total_amount: 1500.0,
        is_overdue: false,
      });
    });

    it("should filter by warehouse_id", async () => {
      mockPurchaseOrderRepository.getRecentOrdersWithSuppliers.mockResolvedValue(
        mockOrdersData
      );

      const result = await service.getRecentPurchases({ warehouse_id: 1 });

      expect(
        mockPurchaseOrderRepository.getRecentOrdersWithSuppliers
      ).toHaveBeenCalledWith(10, 1);
      expect(result.warehouse_filter).toEqual({
        id: 1,
        name: "Warehouse 1",
      });
    });

    it("should filter by supplier_id", async () => {
      mockPurchaseOrderRepository.getRecentOrdersWithSuppliers.mockResolvedValue(
        mockOrdersData
      );

      const result = await service.getRecentPurchases({ supplier_id: 1 });

      expect(result.recent_orders).toHaveLength(1);
      expect(result.recent_orders[0].supplier.id).toBe(1);
    });

    it("should filter by status", async () => {
      mockPurchaseOrderRepository.getRecentOrdersWithSuppliers.mockResolvedValue(
        mockOrdersData
      );

      const result = await service.getRecentPurchases({ status: "pending" });

      expect(result.recent_orders).toHaveLength(1);
      expect(result.recent_orders[0].status).toBe("pending");
    });

    it("should filter by date range", async () => {
      mockPurchaseOrderRepository.getRecentOrdersWithSuppliers.mockResolvedValue(
        mockOrdersData
      );

      const result = await service.getRecentPurchases({
        date_from: "2024-12-01",
        date_to: "2024-12-31",
      });

      expect(result.recent_orders).toHaveLength(1);
      expect(result.recent_orders[0].order_date).toBe("2024-12-01");
    });

    it("should respect custom limit", async () => {
      mockPurchaseOrderRepository.getRecentOrdersWithSuppliers.mockResolvedValue(
        mockOrdersData
      );

      await service.getRecentPurchases({}, 5);

      expect(
        mockPurchaseOrderRepository.getRecentOrdersWithSuppliers
      ).toHaveBeenCalledWith(5, undefined);
    });

    it("should handle empty results", async () => {
      mockPurchaseOrderRepository.getRecentOrdersWithSuppliers.mockResolvedValue(
        []
      );

      const result = await service.getRecentPurchases();

      expect(result.recent_orders).toHaveLength(0);
    });
  });

  describe("getPurchaseOrdersByStatus", () => {
    const mockOrders = [
      {
        id: 1,
        po_number: "PO-2024-001",
        supplier_id: 1,
        order_date: new Date("2024-12-01"),
        expected_delivery_date: new Date("2024-12-15"),
        status: "pending" as OrderStatus,
        total_amount: 1500.0,
        notes: "Test order",
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    const mockSupplier = {
      id: 1,
      name: "Supplier A",
      contact_name: "John Doe",
      email: "john@supplier.com",
      phone: "+1-555-0123",
      address: "123 Main St",
      city: "City",
      state: "State",
      zip_code: "12345",
      supplier_type: "primary" as const,
      active: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    beforeEach(() => {
      // Mock the raw method for product count queries
      mockPurchaseOrderRepository.raw = jest
        .fn()
        .mockResolvedValue([{ count: "3" }]);
    });

    it("should return purchase orders by status", async () => {
      // Use a future date to ensure it's not overdue
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const mockOrderWithFutureDate = {
        ...mockOrders[0],
        expected_delivery_date: futureDate,
      };

      mockPurchaseOrderRepository.getOrdersByStatus.mockResolvedValue([
        mockOrderWithFutureDate,
      ]);
      mockCompanyRepository.findById.mockResolvedValue(mockSupplier);

      const result = await service.getPurchaseOrdersByStatus("pending");

      expect(
        mockPurchaseOrderRepository.getOrdersByStatus
      ).toHaveBeenCalledWith("pending");
      expect(mockCompanyRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 1,
        po_number: "PO-2024-001",
        supplier: {
          id: 1,
          name: "Supplier A",
          contact_name: "John Doe",
        },
        order_date: "2024-12-01",
        expected_delivery_date: futureDate.toISOString().split("T")[0],
        status: "pending",
        product_count: 3,
        total_amount: 1500.0,
        is_overdue: false,
      });
    });

    it("should handle missing supplier", async () => {
      mockPurchaseOrderRepository.getOrdersByStatus.mockResolvedValue(
        mockOrders
      );
      mockCompanyRepository.findById.mockResolvedValue(null);

      const result = await service.getPurchaseOrdersByStatus("pending");

      expect(result[0].supplier.name).toBe("Unknown Supplier");
    });

    it("should detect overdue orders", async () => {
      const overdueOrder = {
        ...mockOrders[0],
        expected_delivery_date: new Date("2024-11-01"), // Past date
      };

      mockPurchaseOrderRepository.getOrdersByStatus.mockResolvedValue([
        overdueOrder,
      ]);
      mockCompanyRepository.findById.mockResolvedValue(mockSupplier);

      const result = await service.getPurchaseOrdersByStatus("pending");

      expect(result[0].is_overdue).toBe(true);
    });

    it("should not mark delivered orders as overdue", async () => {
      const deliveredOrder = {
        ...mockOrders[0],
        status: "delivered" as OrderStatus,
        expected_delivery_date: new Date("2024-11-01"), // Past date
      };

      mockPurchaseOrderRepository.getOrdersByStatus.mockResolvedValue([
        deliveredOrder,
      ]);
      mockCompanyRepository.findById.mockResolvedValue(mockSupplier);

      const result = await service.getPurchaseOrdersByStatus("delivered");

      expect(result[0].is_overdue).toBe(false);
    });
  });

  describe("getOverduePurchaseOrders", () => {
    const mockOverdueOrders = [
      {
        id: 1,
        po_number: "PO-2024-001",
        supplier_id: 1,
        supplier_name: "Supplier A",
        order_date: new Date("2024-11-01"),
        expected_delivery_date: new Date("2024-11-15"),
        status: "pending" as OrderStatus,
        total_amount: 1500.0,
        notes: "Test order",
        created_at: new Date(),
        updated_at: new Date(),
        days_overdue: 20,
      },
    ];

    it("should return overdue purchase orders", async () => {
      mockPurchaseOrderRepository.getOverdueOrders.mockResolvedValue(
        mockOverdueOrders
      );

      const result = await service.getOverduePurchaseOrders();

      expect(mockPurchaseOrderRepository.getOverdueOrders).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 1,
        po_number: "PO-2024-001",
        supplier: {
          id: 1,
          name: "Supplier A",
          contact_name: undefined,
        },
        order_date: "2024-11-01",
        expected_delivery_date: "2024-11-15",
        status: "pending",
        product_count: 0,
        total_amount: 1500.0,
        is_overdue: true,
      });
    });
  });

  describe("searchPurchaseOrders", () => {
    const mockOrders = [
      {
        id: 1,
        po_number: "PO-2024-001",
        supplier_id: 1,
        order_date: new Date("2024-12-01"),
        expected_delivery_date: new Date("2024-12-15"),
        status: "pending" as OrderStatus,
        total_amount: 1500.0,
        notes: "Test order",
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    const mockSupplier = {
      id: 1,
      name: "Supplier A",
      contact_name: "John Doe",
      email: "john@supplier.com",
      phone: "+1-555-0123",
      address: "123 Main St",
      city: "City",
      state: "State",
      zip_code: "12345",
      supplier_type: "primary" as const,
      active: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    beforeEach(() => {
      mockPurchaseOrderRepository.raw = jest
        .fn()
        .mockResolvedValue([{ count: "2" }]);
    });

    it("should search purchase orders by term", async () => {
      mockPurchaseOrderRepository.findAll.mockResolvedValue(mockOrders);
      mockCompanyRepository.findById.mockResolvedValue(mockSupplier);

      const result = await service.searchPurchaseOrders("PO-2024");

      expect(mockPurchaseOrderRepository.findAll).toHaveBeenCalledWith(
        { search: "PO-2024" },
        { limit: 10 }
      );
      expect(result.recent_orders).toHaveLength(1);
    });

    it("should apply additional filters during search", async () => {
      mockPurchaseOrderRepository.findAll.mockResolvedValue(mockOrders);
      mockCompanyRepository.findById.mockResolvedValue(mockSupplier);

      await service.searchPurchaseOrders("PO-2024", {
        supplier_id: 1,
        status: "pending",
      });

      expect(mockPurchaseOrderRepository.findAll).toHaveBeenCalledWith(
        {
          search: "PO-2024",
          supplier_id: 1,
          status: "pending",
        },
        { limit: 10 }
      );
    });
  });

  describe("helper methods", () => {
    describe("isOrderOverdue", () => {
      it("should return false for orders without delivery date", () => {
        const order = { status: "pending" as OrderStatus };
        const result = (service as any).isOrderOverdue(order);
        expect(result).toBe(false);
      });

      it("should return false for delivered orders", () => {
        const order = {
          expected_delivery_date: new Date("2024-11-01"),
          status: "delivered" as OrderStatus,
        };
        const result = (service as any).isOrderOverdue(order);
        expect(result).toBe(false);
      });

      it("should return false for cancelled orders", () => {
        const order = {
          expected_delivery_date: new Date("2024-11-01"),
          status: "cancelled" as OrderStatus,
        };
        const result = (service as any).isOrderOverdue(order);
        expect(result).toBe(false);
      });

      it("should return true for overdue pending orders", () => {
        const order = {
          expected_delivery_date: new Date("2024-11-01"),
          status: "pending" as OrderStatus,
        };
        const result = (service as any).isOrderOverdue(order);
        expect(result).toBe(true);
      });

      it("should return false for future delivery dates", () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);

        const order = {
          expected_delivery_date: futureDate,
          status: "pending" as OrderStatus,
        };
        const result = (service as any).isOrderOverdue(order);
        expect(result).toBe(false);
      });
    });
  });
});
