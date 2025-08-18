import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { vi, describe, it, expect, beforeEach } from "vitest";
import SummaryMetrics from "../../components/SummaryMetrics";
import StockLevels from "../../components/StockLevels";
import RecentPurchases from "../../components/RecentPurchases";
import WarehouseDistribution from "../../components/WarehouseDistribution";
import Dashboard from "../../pages/Dashboard";
import { WarehouseFilterProvider } from "../../contexts/WarehouseFilterContext";
import { AppProvider } from "../../contexts/AppContext";
import * as apiHooks from "../../hooks/useApi";

// Mock API hooks
vi.mock("../../hooks/useApi");

// Mock data for visual regression testing
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
};

const mockStockLevels = {
  products: [
    {
      id: 1,
      sku: "ABC-123",
      name: "Wireless Bluetooth Headphones with Noise Cancellation",
      category: "Electronics",
      total_quantity: 25,
      total_value: 1250.0,
      stock_status: "adequate",
      warehouse_count: 2,
      image_url: "https://example.com/headphones.jpg",
      locations: [
        { location_id: 1, location_name: "Main Warehouse", quantity: 15 },
        { location_id: 2, location_name: "Secondary Warehouse", quantity: 10 },
      ],
    },
    {
      id: 2,
      sku: "DEF-456",
      name: "Ergonomic Office Chair",
      category: "Furniture",
      total_quantity: 3,
      total_value: 300.0,
      stock_status: "low_stock",
      warehouse_count: 1,
      image_url: "",
      locations: [
        { location_id: 1, location_name: "Main Warehouse", quantity: 3 },
      ],
    },
    {
      id: 3,
      sku: "GHI-789",
      name: "Smartphone Case",
      category: "Electronics",
      total_quantity: 0,
      total_value: 0.0,
      stock_status: "out_of_stock",
      warehouse_count: 0,
      image_url: "https://example.com/case.jpg",
      locations: [],
    },
  ],
  filters: { warehouse_id: null, stock_filter: "all" },
  pagination: { page: 1, limit: 50, total: 3 },
};

const mockRecentPurchases = {
  recent_orders: [
    {
      id: 1,
      po_number: "PO-2024-001",
      supplier: { id: 1, name: "Tech Supplier Corporation" },
      order_date: "2024-12-01",
      status: "delivered",
      product_count: 5,
      total_amount: 1500.0,
      is_overdue: false,
    },
    {
      id: 2,
      po_number: "PO-2024-002",
      supplier: { id: 2, name: "Furniture Plus LLC" },
      order_date: "2024-12-05",
      status: "pending",
      product_count: 3,
      total_amount: 800.0,
      is_overdue: true,
    },
    {
      id: 3,
      po_number: "PO-2024-003",
      supplier: { id: 3, name: "Office Supplies Inc" },
      order_date: "2024-12-07",
      status: "shipped",
      product_count: 8,
      total_amount: 2200.0,
      is_overdue: false,
    },
  ],
};

const mockWarehouseDistribution = {
  distribution: [
    {
      location_id: 1,
      location_name: "Main Warehouse",
      location_address: "123 Main Street, Business District",
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
      location_address: "456 Oak Avenue, Industrial Zone",
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

// Helper function to capture component snapshot
const captureSnapshot = (component: React.ReactElement, testName: string) => {
  const { container } = render(<TestWrapper>{component}</TestWrapper>);

  // Remove dynamic content that changes between runs
  const dynamicElements = container.querySelectorAll(
    '[data-testid="timestamp"], [data-testid="last-updated"]'
  );
  dynamicElements.forEach((el) => {
    el.textContent = "2024-12-08T10:30:00Z"; // Fixed timestamp
  });

  expect(container.firstChild).toMatchSnapshot(`${testName}.html`);
  return container;
};

describe("Visual Regression Tests", () => {
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

  describe("SummaryMetrics Component", () => {
    it("should render correctly with normal data", () => {
      captureSnapshot(<SummaryMetrics />, "summary-metrics-normal");
    });

    it("should render correctly with critical status", () => {
      vi.mocked(apiHooks.useSummaryMetrics).mockReturnValue({
        data: {
          ...mockSummaryMetrics,
          metrics: {
            ...mockSummaryMetrics.metrics,
            low_stock: {
              value: 85,
              status: "critical" as const,
              threshold: 50,
            },
            out_of_stock: { value: 25, status: "critical" as const },
          },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      } as any);

      captureSnapshot(<SummaryMetrics />, "summary-metrics-critical");
    });

    it("should render correctly in loading state", () => {
      vi.mocked(apiHooks.useSummaryMetrics).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      } as any);

      captureSnapshot(<SummaryMetrics />, "summary-metrics-loading");
    });

    it("should render correctly in error state", () => {
      vi.mocked(apiHooks.useSummaryMetrics).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: { message: "Failed to load metrics" },
        refetch: vi.fn(),
        isRefetching: false,
      } as any);

      captureSnapshot(<SummaryMetrics />, "summary-metrics-error");
    });

    it("should render correctly with warehouse filter", () => {
      vi.mocked(apiHooks.useSummaryMetrics).mockReturnValue({
        data: {
          ...mockSummaryMetrics,
          warehouse_filter: { id: 1, name: "Main Warehouse" },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      } as any);

      captureSnapshot(<SummaryMetrics />, "summary-metrics-filtered");
    });

    it("should render correctly without navigation", () => {
      captureSnapshot(
        <SummaryMetrics enableNavigation={false} />,
        "summary-metrics-no-navigation"
      );
    });
  });

  describe("StockLevels Component", () => {
    it("should render correctly with mixed stock statuses", () => {
      captureSnapshot(<StockLevels />, "stock-levels-mixed");
    });

    it("should render correctly with empty state", () => {
      vi.mocked(apiHooks.useStockLevels).mockReturnValue({
        data: {
          products: [],
          filters: { warehouse_id: null, stock_filter: "all" },
          pagination: { page: 1, limit: 50, total: 0 },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      } as any);

      captureSnapshot(<StockLevels />, "stock-levels-empty");
    });

    it("should render correctly in loading state", () => {
      vi.mocked(apiHooks.useStockLevels).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      } as any);

      captureSnapshot(<StockLevels />, "stock-levels-loading");
    });

    it("should render correctly with search and filters", () => {
      captureSnapshot(
        <StockLevels showSearch={true} showFilters={true} />,
        "stock-levels-with-filters"
      );
    });

    it("should render correctly without search and filters", () => {
      captureSnapshot(
        <StockLevels showSearch={false} showFilters={false} />,
        "stock-levels-minimal"
      );
    });

    it("should render correctly with limited items", () => {
      captureSnapshot(<StockLevels maxItems={2} />, "stock-levels-limited");
    });
  });

  describe("RecentPurchases Component", () => {
    it("should render correctly with mixed order statuses", () => {
      captureSnapshot(<RecentPurchases />, "recent-purchases-mixed");
    });

    it("should render correctly with empty state", () => {
      vi.mocked(apiHooks.useRecentPurchases).mockReturnValue({
        data: { recent_orders: [] },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      } as any);

      captureSnapshot(<RecentPurchases />, "recent-purchases-empty");
    });

    it("should render correctly in loading state", () => {
      vi.mocked(apiHooks.useRecentPurchases).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      } as any);

      captureSnapshot(<RecentPurchases />, "recent-purchases-loading");
    });

    it("should render correctly with overdue orders", () => {
      vi.mocked(apiHooks.useRecentPurchases).mockReturnValue({
        data: {
          recent_orders: [
            {
              ...mockRecentPurchases.recent_orders[1],
              is_overdue: true,
              status: "pending",
            },
          ],
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      } as any);

      captureSnapshot(<RecentPurchases />, "recent-purchases-overdue");
    });
  });

  describe("WarehouseDistribution Component", () => {
    it("should render correctly with multiple warehouses", () => {
      captureSnapshot(
        <WarehouseDistribution />,
        "warehouse-distribution-multiple"
      );
    });

    it("should render correctly with single warehouse", () => {
      vi.mocked(apiHooks.useWarehouseDistribution).mockReturnValue({
        data: {
          distribution: [mockWarehouseDistribution.distribution[0]],
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      } as any);

      captureSnapshot(
        <WarehouseDistribution />,
        "warehouse-distribution-single"
      );
    });

    it("should render correctly with empty state", () => {
      vi.mocked(apiHooks.useWarehouseDistribution).mockReturnValue({
        data: { distribution: [] },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      } as any);

      captureSnapshot(
        <WarehouseDistribution />,
        "warehouse-distribution-empty"
      );
    });

    it("should render correctly in loading state", () => {
      vi.mocked(apiHooks.useWarehouseDistribution).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      } as any);

      captureSnapshot(
        <WarehouseDistribution />,
        "warehouse-distribution-loading"
      );
    });
  });

  describe("Complete Dashboard", () => {
    it("should render correctly with all components", () => {
      captureSnapshot(<Dashboard />, "dashboard-complete");
    });

    it("should render correctly with mixed loading states", () => {
      vi.mocked(apiHooks.useSummaryMetrics).mockReturnValue({
        data: mockSummaryMetrics,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      } as any);

      vi.mocked(apiHooks.useStockLevels).mockReturnValue({
        data: undefined,
        isLoading: true,
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
        data: undefined,
        isLoading: false,
        error: { message: "Network error" },
        refetch: vi.fn(),
        isRefetching: false,
      } as any);

      captureSnapshot(<Dashboard />, "dashboard-mixed-states");
    });
  });

  describe("Responsive Design", () => {
    it("should render correctly on mobile viewport", () => {
      // Mock mobile viewport
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 375,
      });

      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query.includes("max-width: 768px"),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      captureSnapshot(<Dashboard />, "dashboard-mobile");
    });

    it("should render correctly on tablet viewport", () => {
      // Mock tablet viewport
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 768,
      });

      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches:
            query.includes("max-width: 1024px") &&
            !query.includes("max-width: 768px"),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      captureSnapshot(<Dashboard />, "dashboard-tablet");
    });

    it("should render correctly on desktop viewport", () => {
      // Mock desktop viewport
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1920,
      });

      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: false, // No mobile/tablet queries match
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      captureSnapshot(<Dashboard />, "dashboard-desktop");
    });
  });

  describe("Theme Variations", () => {
    it("should render correctly in high contrast mode", () => {
      // Mock high contrast preference
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query.includes("prefers-contrast: high"),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      captureSnapshot(<SummaryMetrics />, "summary-metrics-high-contrast");
    });

    it("should render correctly with reduced motion", () => {
      // Mock reduced motion preference
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query.includes("prefers-reduced-motion: reduce"),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      captureSnapshot(<StockLevels />, "stock-levels-reduced-motion");
    });
  });

  describe("Data Variations", () => {
    it("should render correctly with very large numbers", () => {
      vi.mocked(apiHooks.useSummaryMetrics).mockReturnValue({
        data: {
          ...mockSummaryMetrics,
          metrics: {
            ...mockSummaryMetrics.metrics,
            total_products: { value: 999999, status: "normal" as const },
            total_stock_value: {
              value: 99999999.99,
              currency: "USD",
              status: "normal" as const,
            },
          },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      } as any);

      captureSnapshot(<SummaryMetrics />, "summary-metrics-large-numbers");
    });

    it("should render correctly with very long product names", () => {
      vi.mocked(apiHooks.useStockLevels).mockReturnValue({
        data: {
          ...mockStockLevels,
          products: [
            {
              ...mockStockLevels.products[0],
              name: "Ultra Premium Wireless Bluetooth Noise-Cancelling Over-Ear Headphones with Advanced Audio Technology and Extended Battery Life",
            },
          ],
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      } as any);

      captureSnapshot(<StockLevels />, "stock-levels-long-names");
    });

    it("should render correctly with zero values", () => {
      vi.mocked(apiHooks.useSummaryMetrics).mockReturnValue({
        data: {
          ...mockSummaryMetrics,
          metrics: {
            total_products: { value: 0, status: "critical" as const },
            low_stock: { value: 0, status: "normal" as const, threshold: 50 },
            out_of_stock: { value: 0, status: "normal" as const },
            suppliers: { value: 0, status: "critical" as const },
            total_stock_value: {
              value: 0,
              currency: "USD",
              status: "critical" as const,
            },
          },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      } as any);

      captureSnapshot(<SummaryMetrics />, "summary-metrics-zero-values");
    });
  });
});
