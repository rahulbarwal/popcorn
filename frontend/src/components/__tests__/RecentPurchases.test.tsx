import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import RecentPurchases from "../RecentPurchases";
import { AppProvider } from "../../contexts/AppContext";
import { WarehouseFilterProvider } from "../../contexts/WarehouseFilterContext";
import * as apiHooks from "../../hooks/useApi";
import { PurchaseOrder } from "../../types/api";

// Mock the API hooks
vi.mock("../../hooks/useApi");

// Mock Lucide React icons
vi.mock("lucide-react", () => ({
  Package: () => <div data-testid="package-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  User: () => <div data-testid="user-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />,
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
  ChevronUp: () => <div data-testid="chevron-up-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Truck: () => <div data-testid="truck-icon" />,
  XCircle: () => <div data-testid="x-circle-icon" />,
  Loader2: () => <div data-testid="loader2-icon" />,
}));

const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: 1,
    po_number: "PO-2024-001",
    supplier: {
      id: 1,
      name: "Supplier Corp",
      contact_name: "John Smith",
      email: "john@supplier.com",
      phone: "+1-555-0123",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    order_date: "2024-12-01",
    expected_delivery_date: "2024-12-15",
    status: "pending",
    total_amount: 1500.0,
    product_count: 3,
    products: [
      {
        product_id: 1,
        sku: "ABC-123",
        name: "Product A",
        quantity: 10,
        unit_price: 50.0,
        total_price: 500.0,
      },
      {
        product_id: 2,
        sku: "DEF-456",
        name: "Product B",
        quantity: 20,
        unit_price: 25.0,
        total_price: 500.0,
      },
      {
        product_id: 3,
        sku: "GHI-789",
        name: "Product C",
        quantity: 20,
        unit_price: 25.0,
        total_price: 500.0,
      },
    ],
    notes: "Urgent order for low stock items",
    created_at: "2024-12-01T00:00:00Z",
    updated_at: "2024-12-01T00:00:00Z",
  },
  {
    id: 2,
    po_number: "PO-2024-002",
    supplier: {
      id: 2,
      name: "Another Supplier",
      contact_name: "Jane Doe",
      email: "jane@anothersupplier.com",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    order_date: "2024-11-28",
    expected_delivery_date: "2024-12-05", // This will be overdue
    status: "shipped",
    total_amount: 750.0,
    product_count: 2,
    created_at: "2024-11-28T00:00:00Z",
    updated_at: "2024-11-28T00:00:00Z",
  },
  {
    id: 3,
    po_number: "PO-2024-003",
    supplier: {
      id: 1,
      name: "Supplier Corp",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    order_date: "2024-11-25",
    status: "delivered",
    total_amount: 2000.0,
    product_count: 5,
    created_at: "2024-11-25T00:00:00Z",
    updated_at: "2024-11-25T00:00:00Z",
  },
];

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <WarehouseFilterProvider>{children}</WarehouseFilterProvider>
      </AppProvider>
    </QueryClientProvider>
  );
};

describe("RecentPurchases", () => {
  const mockUseRecentPurchases = vi.mocked(apiHooks.useRecentPurchases);

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock the current date to make overdue tests predictable
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-12-08T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders loading state", () => {
    mockUseRecentPurchases.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any);

    render(<RecentPurchases />, { wrapper: createWrapper() });

    expect(screen.getByText("Loading recent purchases...")).toBeInTheDocument();
  });

  it("renders error state", () => {
    const mockError = { message: "Failed to fetch data" };
    mockUseRecentPurchases.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: mockError,
      refetch: vi.fn(),
      isRefetching: false,
    } as any);

    render(<RecentPurchases />, { wrapper: createWrapper() });

    expect(
      screen.getByText("Failed to load recent purchases")
    ).toBeInTheDocument();
    expect(screen.getByText("Failed to fetch data")).toBeInTheDocument();
  });

  it("renders empty state when no orders", () => {
    mockUseRecentPurchases.mockReturnValue({
      data: { recent_orders: [] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any);

    render(<RecentPurchases />, { wrapper: createWrapper() });

    expect(
      screen.getByText("No recent purchase orders found")
    ).toBeInTheDocument();
  });

  it("renders purchase orders list", () => {
    mockUseRecentPurchases.mockReturnValue({
      data: { recent_orders: mockPurchaseOrders },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any);

    render(<RecentPurchases />, { wrapper: createWrapper() });

    // Check that all orders are rendered
    expect(screen.getByText("PO-2024-001")).toBeInTheDocument();
    expect(screen.getByText("PO-2024-002")).toBeInTheDocument();
    expect(screen.getByText("PO-2024-003")).toBeInTheDocument();

    // Check supplier names
    expect(screen.getAllByText("Supplier Corp")).toHaveLength(2);
    expect(screen.getByText("Another Supplier")).toBeInTheDocument();

    // Check product counts
    expect(screen.getByText("3 products")).toBeInTheDocument();
    expect(screen.getByText("2 products")).toBeInTheDocument();
    expect(screen.getByText("5 products")).toBeInTheDocument();
  });

  it("displays correct status badges", () => {
    mockUseRecentPurchases.mockReturnValue({
      data: { recent_orders: mockPurchaseOrders },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any);

    render(<RecentPurchases />, { wrapper: createWrapper() });

    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Overdue")).toBeInTheDocument(); // PO-2024-002 should be overdue
    expect(screen.getByText("Delivered")).toBeInTheDocument();
  });

  it("expands and collapses order details", async () => {
    mockUseRecentPurchases.mockReturnValue({
      data: { recent_orders: mockPurchaseOrders },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any);

    render(<RecentPurchases />, { wrapper: createWrapper() });

    // Initially, detailed info should not be visible
    expect(screen.queryByText("Order Information")).not.toBeInTheDocument();

    // Click expand button for first order
    const expandButtons = screen.getAllByTitle(
      /Expand details|Collapse details/
    );
    fireEvent.click(expandButtons[0]);

    // Now detailed info should be visible
    await waitFor(() => {
      expect(screen.getByText("Order Information")).toBeInTheDocument();
      expect(screen.getByText("Supplier Information")).toBeInTheDocument();
      expect(screen.getByText("Products (3)")).toBeInTheDocument();
    });

    // Check product details are shown
    expect(screen.getByText("Product A")).toBeInTheDocument();
    expect(screen.getByText("ABC-123")).toBeInTheDocument();
    expect(screen.getByText("$50.00")).toBeInTheDocument();

    // Check notes are shown
    expect(
      screen.getByText("Urgent order for low stock items")
    ).toBeInTheDocument();

    // Click collapse button
    fireEvent.click(expandButtons[0]);

    // Detailed info should be hidden again
    await waitFor(() => {
      expect(screen.queryByText("Order Information")).not.toBeInTheDocument();
    });
  });

  it("calls onSupplierClick when supplier is clicked", () => {
    const mockOnSupplierClick = vi.fn();
    mockUseRecentPurchases.mockReturnValue({
      data: { recent_orders: mockPurchaseOrders },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any);

    render(<RecentPurchases onSupplierClick={mockOnSupplierClick} />, {
      wrapper: createWrapper(),
    });

    // Click on supplier name
    const supplierButtons = screen.getAllByText("Supplier Corp");
    fireEvent.click(supplierButtons[0]);

    expect(mockOnSupplierClick).toHaveBeenCalledWith(1);
  });

  it("calls refetch when refresh button is clicked", () => {
    const mockRefetch = vi.fn();
    mockUseRecentPurchases.mockReturnValue({
      data: { recent_orders: mockPurchaseOrders },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      isRefetching: false,
    } as any);

    render(<RecentPurchases />, { wrapper: createWrapper() });

    const refreshButton = screen.getByTitle("Refresh purchases");
    fireEvent.click(refreshButton);

    expect(mockRefetch).toHaveBeenCalled();
  });

  it("respects maxItems prop", () => {
    mockUseRecentPurchases.mockReturnValue({
      data: { recent_orders: mockPurchaseOrders },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any);

    render(<RecentPurchases maxItems={2} />, { wrapper: createWrapper() });

    // Should only show first 2 orders
    expect(screen.getByText("PO-2024-001")).toBeInTheDocument();
    expect(screen.getByText("PO-2024-002")).toBeInTheDocument();
    expect(screen.queryByText("PO-2024-003")).not.toBeInTheDocument();

    expect(
      screen.getByText("Showing 2 of 3 recent orders")
    ).toBeInTheDocument();
  });

  it("hides header when showHeader is false", () => {
    mockUseRecentPurchases.mockReturnValue({
      data: { recent_orders: mockPurchaseOrders },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any);

    render(<RecentPurchases showHeader={false} />, {
      wrapper: createWrapper(),
    });

    expect(screen.queryByText("Recent Purchases")).not.toBeInTheDocument();
  });

  it("formats currency correctly", () => {
    mockUseRecentPurchases.mockReturnValue({
      data: { recent_orders: mockPurchaseOrders },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any);

    render(<RecentPurchases />, { wrapper: createWrapper() });

    expect(screen.getByText("$1,500.00")).toBeInTheDocument();
    expect(screen.getByText("$750.00")).toBeInTheDocument();
    expect(screen.getByText("$2,000.00")).toBeInTheDocument();
  });

  it("formats dates correctly", () => {
    mockUseRecentPurchases.mockReturnValue({
      data: { recent_orders: mockPurchaseOrders },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any);

    render(<RecentPurchases />, { wrapper: createWrapper() });

    expect(screen.getByText("Dec 1, 2024")).toBeInTheDocument();
    expect(screen.getByText("Nov 28, 2024")).toBeInTheDocument();
    expect(screen.getByText("Nov 25, 2024")).toBeInTheDocument();
  });

  it("identifies overdue orders correctly", () => {
    mockUseRecentPurchases.mockReturnValue({
      data: { recent_orders: mockPurchaseOrders },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any);

    render(<RecentPurchases />, { wrapper: createWrapper() });

    // PO-2024-002 has expected delivery date of 2024-12-05, which is before current date (2024-12-08)
    // and status is not delivered or cancelled, so it should be marked as overdue
    expect(screen.getByText("Overdue")).toBeInTheDocument();
  });

  it("does not mark delivered orders as overdue", () => {
    const deliveredOrder = {
      ...mockPurchaseOrders[1],
      status: "delivered" as const,
    };

    mockUseRecentPurchases.mockReturnValue({
      data: { recent_orders: [deliveredOrder] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any);

    render(<RecentPurchases />, { wrapper: createWrapper() });

    expect(screen.queryByText("Overdue")).not.toBeInTheDocument();
    expect(screen.getByText("Delivered")).toBeInTheDocument();
  });

  it("auto-refreshes when enabled", async () => {
    const mockRefetch = vi.fn();
    mockUseRecentPurchases.mockReturnValue({
      data: { recent_orders: mockPurchaseOrders },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      isRefetching: false,
    } as any);

    render(<RecentPurchases autoRefresh={true} refreshInterval={1000} />, {
      wrapper: createWrapper(),
    });

    // Fast-forward time by 1 second
    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  it("does not auto-refresh when disabled", async () => {
    const mockRefetch = vi.fn();
    mockUseRecentPurchases.mockReturnValue({
      data: { recent_orders: mockPurchaseOrders },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      isRefetching: false,
    } as any);

    render(<RecentPurchases autoRefresh={false} />, {
      wrapper: createWrapper(),
    });

    // Fast-forward time by 30 seconds (default refresh interval)
    vi.advanceTimersByTime(30000);

    // refetch should not have been called
    expect(mockRefetch).not.toHaveBeenCalled();
  });
});
