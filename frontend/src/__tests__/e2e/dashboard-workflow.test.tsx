import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import Dashboard from "../../pages/Dashboard";
import { WarehouseFilterProvider } from "../../contexts/WarehouseFilterContext";
import { AppProvider } from "../../contexts/AppContext";
import * as apiHooks from "../../hooks/useApi";

// Mock all API hooks
vi.mock("../../hooks/useApi");

// Mock data for complete dashboard workflow
const mockSummaryMetrics = {
  metrics: {
    total_products: { value: 1250, status: "normal" as const },
    low_stock: { value: 45, status: "warning" as const, threshold: 50 },
    out_of_stock: { value: 12, status: "critical" as const },
    suppliers: { value: 28, status: "normal" as const },
    total_stock_value: {
      value: 125000.5,
      currency: "USD",
      status: "normal" as const,
    },
  },
  last_updated: "2024-12-08T10:30:00Z",
  warehouse_filter: null,
};

const mockStockLevels = {
  products: [
    {
      id: 1,
      sku: "ABC-123",
      name: "Wireless Headphones",
      category: "Electronics",
      total_quantity: 25,
      total_value: 1250.0,
      stock_status: "adequate",
      warehouse_count: 2,
      locations: [
        { location_id: 1, location_name: "Main Warehouse", quantity: 15 },
        { location_id: 2, location_name: "Secondary Warehouse", quantity: 10 },
      ],
    },
    {
      id: 2,
      sku: "DEF-456",
      name: "Office Chair",
      category: "Furniture",
      total_quantity: 3,
      total_value: 300.0,
      stock_status: "low_stock",
      warehouse_count: 1,
      locations: [
        { location_id: 1, location_name: "Main Warehouse", quantity: 3 },
      ],
    },
  ],
  filters: { warehouse_id: null, stock_filter: "all" },
  pagination: { page: 1, limit: 50, total: 2 },
};

const mockRecentPurchases = {
  recent_orders: [
    {
      id: 1,
      po_number: "PO-2024-001",
      supplier: { id: 1, name: "Tech Supplier Corp" },
      order_date: "2024-12-01",
      status: "delivered",
      product_count: 5,
      total_amount: 1500.0,
      is_overdue: false,
    },
    {
      id: 2,
      po_number: "PO-2024-002",
      supplier: { id: 2, name: "Furniture Plus" },
      order_date: "2024-12-05",
      status: "pending",
      product_count: 3,
      total_amount: 800.0,
      is_overdue: true,
    },
  ],
};

const mockWarehouseDistribution = {
  distribution: [
    {
      location_id: 1,
      location_name: "Main Warehouse",
      location_address: "123 Main St",
      total_products: 15,
      total_quantity: 150,
      total_value: 7500.0,
      products: [
        {
          product_id: 1,
          sku: "ABC-123",
          name: "Wireless Headphones",
          quantity: 15,
        },
        { product_id: 2, sku: "DEF-456", name: "Office Chair", quantity: 3 },
      ],
    },
    {
      location_id: 2,
      location_name: "Secondary Warehouse",
      location_address: "456 Oak Ave",
      total_products: 8,
      total_quantity: 80,
      total_value: 4000.0,
      products: [
        {
          product_id: 1,
          sku: "ABC-123",
          name: "Wireless Headphones",
          quantity: 10,
        },
      ],
    },
  ],
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        cacheTime: 0,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppProvider>
          <WarehouseFilterProvider>{children}</WarehouseFilterProvider>
        </AppProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe("Dashboard End-to-End Workflow Tests", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations
    vi.mocked(apiHooks.useSummaryMetrics).mockReturnValue({
      data: mockSummaryMetrics,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any);

    vi.mocked(apiHooks.useStockLevels).mockReturnValue({
      data: mockStockLevels,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any);

    vi.mocked(apiHooks.useRecentPurchases).mockReturnValue({
      data: mockRecentPurchases,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any);

    vi.mocked(apiHooks.useWarehouseDistribution).mockReturnValue({
      data: mockWarehouseDistribution,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("completes full dashboard overview workflow", async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // 1. Verify dashboard loads with all components
    expect(screen.getByText("Inventory Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Summary Metrics")).toBeInTheDocument();
    expect(screen.getByText("Stock Levels")).toBeInTheDocument();
    expect(screen.getByText("Recent Purchases")).toBeInTheDocument();
    expect(screen.getByText("Warehouse Distribution")).toBeInTheDocument();

    // 2. Verify summary metrics display correctly
    expect(screen.getByText("1,250")).toBeInTheDocument(); // Total products
    expect(screen.getByText("45")).toBeInTheDocument(); // Low stock
    expect(screen.getByText("12")).toBeInTheDocument(); // Out of stock
    expect(screen.getByText("28")).toBeInTheDocument(); // Suppliers
    expect(screen.getByText("$125,001")).toBeInTheDocument(); // Total value

    // 3. Verify stock levels table shows products
    expect(screen.getByText("Wireless Headphones")).toBeInTheDocument();
    expect(screen.getByText("Office Chair")).toBeInTheDocument();
    expect(screen.getByText("ABC-123")).toBeInTheDocument();
    expect(screen.getByText("DEF-456")).toBeInTheDocument();

    // 4. Verify recent purchases display
    expect(screen.getByText("PO-2024-001")).toBeInTheDocument();
    expect(screen.getByText("Tech Supplier Corp")).toBeInTheDocument();
    expect(screen.getByText("PO-2024-002")).toBeInTheDocument();
    expect(screen.getByText("Furniture Plus")).toBeInTheDocument();

    // 5. Verify warehouse distribution shows locations
    expect(screen.getByText("Main Warehouse")).toBeInTheDocument();
    expect(screen.getByText("Secondary Warehouse")).toBeInTheDocument();
  });

  it("completes warehouse filtering workflow", async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // 1. Find and interact with warehouse filter
    const warehouseFilter = screen.getByDisplayValue("All Warehouses");
    expect(warehouseFilter).toBeInTheDocument();

    // 2. Change to specific warehouse
    await user.selectOptions(warehouseFilter, "1");

    // 3. Verify API calls are made with warehouse filter
    await waitFor(() => {
      expect(apiHooks.useSummaryMetrics).toHaveBeenCalledWith(
        expect.objectContaining({ warehouse_id: 1 })
      );
      expect(apiHooks.useStockLevels).toHaveBeenCalledWith(
        expect.objectContaining({ warehouse_id: 1 })
      );
      expect(apiHooks.useRecentPurchases).toHaveBeenCalledWith(
        expect.objectContaining({ warehouse_id: 1 })
      );
      expect(apiHooks.useWarehouseDistribution).toHaveBeenCalledWith(
        expect.objectContaining({ warehouse_id: 1 })
      );
    });

    // 4. Change back to all warehouses
    await user.selectOptions(warehouseFilter, "");

    // 5. Verify API calls are made without warehouse filter
    await waitFor(() => {
      expect(apiHooks.useSummaryMetrics).toHaveBeenCalledWith(
        expect.objectContaining({ warehouse_id: undefined })
      );
    });
  });

  it("completes stock level filtering and search workflow", async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // 1. Find stock levels section
    const stockLevelsSection = screen
      .getByText("Stock Levels")
      .closest("section");
    expect(stockLevelsSection).toBeInTheDocument();

    // 2. Use search functionality
    const searchInput = within(stockLevelsSection!).getByPlaceholderText(
      "Search by SKU or product name..."
    );
    await user.type(searchInput, "Wireless");

    // 3. Verify search triggers API call
    await waitFor(() => {
      expect(apiHooks.useStockLevels).toHaveBeenCalledWith(
        expect.objectContaining({ search: "Wireless" })
      );
    });

    // 4. Use category filter
    const categoryFilter = within(stockLevelsSection!).getByDisplayValue(
      "All Categories"
    );
    await user.selectOptions(categoryFilter, "Electronics");

    // 5. Verify category filter triggers API call
    await waitFor(() => {
      expect(apiHooks.useStockLevels).toHaveBeenCalledWith(
        expect.objectContaining({
          search: "Wireless",
          category: "Electronics",
        })
      );
    });

    // 6. Use stock status filter
    const stockFilter = within(stockLevelsSection!).getByDisplayValue(
      "All Stock"
    );
    await user.selectOptions(stockFilter, "low_stock");

    // 7. Verify stock filter triggers API call
    await waitFor(() => {
      expect(apiHooks.useStockLevels).toHaveBeenCalledWith(
        expect.objectContaining({
          search: "Wireless",
          category: "Electronics",
          stock_filter: "low_stock",
        })
      );
    });

    // 8. Clear all filters
    const clearButton = within(stockLevelsSection!).getByText("Clear Filters");
    await user.click(clearButton);

    // 9. Verify filters are cleared
    expect(searchInput).toHaveValue("");
    expect(categoryFilter).toHaveValue("");
    expect(stockFilter).toHaveValue("all");
  });

  it("completes metric card navigation workflow", async () => {
    const mockOnMetricClick = vi.fn();

    render(
      <TestWrapper>
        <Dashboard onMetricClick={mockOnMetricClick} />
      </TestWrapper>
    );

    // 1. Find and click on low stock metric card
    const lowStockCard = screen.getByText("45").closest(".card");
    expect(lowStockCard).toBeInTheDocument();

    await user.click(lowStockCard!);

    // 2. Verify metric click handler is called
    expect(mockOnMetricClick).toHaveBeenCalledWith("low_stock");

    // 3. Click on out of stock metric card
    const outOfStockCard = screen.getByText("12").closest(".card");
    await user.click(outOfStockCard!);

    // 4. Verify navigation to out of stock view
    expect(mockOnMetricClick).toHaveBeenCalledWith("out_of_stock");

    // 5. Click on total stock value card
    const stockValueCard = screen.getByText("$125,001").closest(".card");
    await user.click(stockValueCard!);

    // 6. Verify navigation to stock value details
    expect(mockOnMetricClick).toHaveBeenCalledWith("total_stock_value");
  });

  it("completes refresh and real-time updates workflow", async () => {
    const mockRefetch = vi.fn();

    // Mock refetch functions
    vi.mocked(apiHooks.useSummaryMetrics).mockReturnValue({
      data: mockSummaryMetrics,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      isRefetching: false,
    } as any);

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // 1. Find and click refresh button in summary metrics
    const refreshButton = screen.getByTitle("Refresh metrics");
    await user.click(refreshButton);

    // 2. Verify refetch is called
    expect(mockRefetch).toHaveBeenCalled();

    // 3. Simulate refetching state
    vi.mocked(apiHooks.useSummaryMetrics).mockReturnValue({
      data: mockSummaryMetrics,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      isRefetching: true,
    } as any);

    // 4. Re-render to show refetching state
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // 5. Verify refresh button is disabled during refetch
    const disabledRefreshButton = screen.getByTitle("Refresh metrics");
    expect(disabledRefreshButton).toBeDisabled();
  });

  it("completes error handling and recovery workflow", async () => {
    // 1. Start with error state
    vi.mocked(apiHooks.useSummaryMetrics).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { message: "Network error" },
      refetch: vi.fn(),
      isRefetching: false,
    } as any);

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // 2. Verify error state is displayed
    expect(screen.getAllByText("Network error")).toHaveLength(5); // One for each metric card

    // 3. Find and click retry button
    const retryButton = screen.getByText("Retry");
    await user.click(retryButton);

    // 4. Simulate successful retry
    vi.mocked(apiHooks.useSummaryMetrics).mockReturnValue({
      data: mockSummaryMetrics,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any);

    // 5. Re-render to show recovered state
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // 6. Verify data is now displayed correctly
    expect(screen.getByText("1,250")).toBeInTheDocument();
    expect(screen.queryByText("Network error")).not.toBeInTheDocument();
  });

  it("completes responsive design workflow", async () => {
    // Mock window.matchMedia for responsive testing
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query.includes("max-width: 768px"), // Simulate mobile
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // 1. Verify mobile layout adaptations
    const dashboard = screen.getByRole("main");
    expect(dashboard).toHaveClass("mobile-layout"); // Assuming mobile class is applied

    // 2. Verify compact metric cards on mobile
    const metricCards = screen
      .getAllByRole("button")
      .filter((btn) => btn.classList.contains("metric-card"));
    metricCards.forEach((card) => {
      expect(card).toHaveClass("compact"); // Assuming compact class for mobile
    });

    // 3. Test touch interactions (simulated)
    const firstMetricCard = metricCards[0];
    fireEvent.touchStart(firstMetricCard);
    fireEvent.touchEnd(firstMetricCard);

    // 4. Verify mobile navigation works
    expect(firstMetricCard).toHaveAttribute("tabindex", "0");
  });

  it("completes accessibility workflow", async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // 1. Verify ARIA labels are present
    expect(screen.getByRole("main")).toHaveAttribute(
      "aria-label",
      "Inventory Dashboard"
    );

    // 2. Verify keyboard navigation
    const firstMetricCard = screen
      .getByText("1,250")
      .closest("[role='button']");
    expect(firstMetricCard).toHaveAttribute("tabindex", "0");

    // 3. Test keyboard interaction
    firstMetricCard?.focus();
    fireEvent.keyDown(firstMetricCard!, { key: "Enter" });

    // 4. Verify screen reader announcements
    const liveRegion = screen.getByRole("status");
    expect(liveRegion).toBeInTheDocument();

    // 5. Verify color contrast and visual indicators
    const criticalCard = screen.getByText("12").closest(".card");
    expect(criticalCard).toHaveClass("border-red-200"); // Critical status styling

    // 6. Test focus management
    const searchInput = screen.getByPlaceholderText(
      "Search by SKU or product name..."
    );
    searchInput.focus();
    expect(document.activeElement).toBe(searchInput);
  });

  it("completes performance optimization workflow", async () => {
    vi.useFakeTimers();

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // 1. Verify lazy loading is implemented
    const productImages = screen.getAllByRole("img");
    productImages.forEach((img) => {
      expect(img).toHaveAttribute("loading", "lazy");
    });

    // 2. Test debounced search
    const searchInput = screen.getByPlaceholderText(
      "Search by SKU or product name..."
    );

    // Type rapidly
    await user.type(searchInput, "test");

    // Verify API is not called immediately
    expect(apiHooks.useStockLevels).not.toHaveBeenCalledWith(
      expect.objectContaining({ search: "test" })
    );

    // Fast-forward past debounce delay
    vi.advanceTimersByTime(500);

    // Verify API is called after debounce
    await waitFor(() => {
      expect(apiHooks.useStockLevels).toHaveBeenCalledWith(
        expect.objectContaining({ search: "test" })
      );
    });

    // 3. Test virtual scrolling (if implemented)
    const stockTable = screen.getByRole("table");
    expect(stockTable).toHaveAttribute("data-virtualized", "true");

    vi.useRealTimers();
  });
});
