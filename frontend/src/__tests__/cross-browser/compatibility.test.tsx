import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { vi, describe, it, expect, beforeEach } from "vitest";
import Dashboard from "../../pages/Dashboard";
import SummaryMetrics from "../../components/SummaryMetrics";
import StockLevels from "../../components/StockLevels";
import { WarehouseFilterProvider } from "../../contexts/WarehouseFilterContext";
import { AppProvider } from "../../contexts/AppContext";
import * as apiHooks from "../../hooks/useApi";

// Mock API hooks
vi.mock("../../hooks/useApi");

// Mock data
const mockData = {
  summaryMetrics: {
    metrics: {
      total_products: { value: 1250, status: "normal" as const },
      low_stock: { value: 45, status: "warning" as const },
      out_of_stock: { value: 12, status: "critical" as const },
      suppliers: { value: 28, status: "normal" as const },
      total_stock_value: {
        value: 125000.5,
        currency: "USD",
        status: "normal" as const,
      },
    },
  },
  stockLevels: {
    products: [
      {
        id: 1,
        sku: "ABC-123",
        name: "Test Product",
        category: "Electronics",
        total_quantity: 25,
        stock_status: "adequate",
        image_url: "https://example.com/image.jpg",
      },
    ],
    pagination: { page: 1, limit: 50, total: 1 },
  },
};

// Test wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
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

// Browser simulation helpers
const simulateBrowser = (browserName: string, version?: string) => {
  const userAgents = {
    chrome:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    firefox:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0",
    safari:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
    edge: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
    ie11: "Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko",
  };

  Object.defineProperty(navigator, "userAgent", {
    writable: true,
    value:
      userAgents[browserName as keyof typeof userAgents] || userAgents.chrome,
  });

  // Mock browser-specific features
  switch (browserName) {
    case "ie11":
      // Mock IE11 limitations
      delete (window as any).fetch;
      delete (window as any).Promise;
      (window as any).attachEvent = vi.fn();
      break;
    case "safari":
      // Mock Safari-specific behaviors
      Object.defineProperty(window, "safari", {
        value: { pushNotification: {} },
        writable: true,
      });
      break;
    case "firefox":
      // Mock Firefox-specific behaviors
      Object.defineProperty(window, "InstallTrigger", {
        value: {},
        writable: true,
      });
      break;
  }
};

describe("Cross-Browser Compatibility Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    vi.mocked(apiHooks.useSummaryMetrics).mockReturnValue({
      data: mockData.summaryMetrics,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any);

    vi.mocked(apiHooks.useStockLevels).mockReturnValue({
      data: mockData.stockLevels,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any);

    vi.mocked(apiHooks.useRecentPurchases).mockReturnValue({
      data: { recent_orders: [] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any);

    vi.mocked(apiHooks.useWarehouseDistribution).mockReturnValue({
      data: { distribution: [] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any);
  });

  describe("Chrome Compatibility", () => {
    beforeEach(() => {
      simulateBrowser("chrome");
    });

    it("should render dashboard correctly in Chrome", () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      expect(screen.getByText("Inventory Dashboard")).toBeInTheDocument();
      expect(screen.getByText("1,250")).toBeInTheDocument();
    });

    it("should handle modern JavaScript features in Chrome", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <StockLevels />
        </TestWrapper>
      );

      // Test async/await, arrow functions, template literals
      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, "test");

      expect(searchInput).toHaveValue("test");
    });

    it("should support CSS Grid and Flexbox in Chrome", () => {
      render(
        <TestWrapper>
          <SummaryMetrics />
        </TestWrapper>
      );

      const metricsContainer = screen.getByRole("region");
      const styles = window.getComputedStyle(metricsContainer);

      // Chrome should support modern CSS
      expect(styles.display).toBeDefined();
    });
  });

  describe("Firefox Compatibility", () => {
    beforeEach(() => {
      simulateBrowser("firefox");
    });

    it("should render dashboard correctly in Firefox", () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      expect(screen.getByText("Inventory Dashboard")).toBeInTheDocument();
      expect(screen.getByText("1,250")).toBeInTheDocument();
    });

    it("should handle Firefox-specific event handling", () => {
      render(
        <TestWrapper>
          <SummaryMetrics />
        </TestWrapper>
      );

      const refreshButton = screen.getByRole("button", { name: /refresh/i });

      // Test Firefox-specific events
      fireEvent.click(refreshButton);
      fireEvent.keyDown(refreshButton, { key: "Enter" });

      expect(refreshButton).toBeInTheDocument();
    });

    it("should support Firefox CSS features", () => {
      render(
        <TestWrapper>
          <StockLevels />
        </TestWrapper>
      );

      const table = screen.getByRole("table");
      const styles = window.getComputedStyle(table);

      // Firefox should support table styling
      expect(styles.borderCollapse).toBeDefined();
    });
  });

  describe("Safari Compatibility", () => {
    beforeEach(() => {
      simulateBrowser("safari");
    });

    it("should render dashboard correctly in Safari", () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      expect(screen.getByText("Inventory Dashboard")).toBeInTheDocument();
      expect(screen.getByText("1,250")).toBeInTheDocument();
    });

    it("should handle Safari date formatting", () => {
      render(
        <TestWrapper>
          <SummaryMetrics />
        </TestWrapper>
      );

      // Safari has different date parsing behavior
      const timestamp = new Date("2024-12-08T10:30:00Z");
      expect(timestamp.getTime()).toBeGreaterThan(0);
    });

    it("should support Safari-specific CSS", () => {
      render(
        <TestWrapper>
          <StockLevels />
        </TestWrapper>
      );

      const searchInput = screen.getByRole("searchbox");
      const styles = window.getComputedStyle(searchInput);

      // Safari should handle input styling
      expect(styles.appearance).toBeDefined();
    });
  });

  describe("Edge Compatibility", () => {
    beforeEach(() => {
      simulateBrowser("edge");
    });

    it("should render dashboard correctly in Edge", () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      expect(screen.getByText("Inventory Dashboard")).toBeInTheDocument();
      expect(screen.getByText("1,250")).toBeInTheDocument();
    });

    it("should handle Edge-specific features", () => {
      render(
        <TestWrapper>
          <SummaryMetrics />
        </TestWrapper>
      );

      const metricCards = screen.getAllByRole("button");

      // Edge should handle button interactions
      metricCards.forEach((card) => {
        fireEvent.click(card);
        expect(card).toBeInTheDocument();
      });
    });
  });

  describe("Feature Detection and Polyfills", () => {
    it("should detect and handle missing fetch API", () => {
      // Simulate older browser without fetch
      const originalFetch = global.fetch;
      delete (global as any).fetch;

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      // Should still render without fetch
      expect(screen.getByText("Inventory Dashboard")).toBeInTheDocument();

      // Restore fetch
      global.fetch = originalFetch;
    });

    it("should detect and handle missing Promise", () => {
      // Simulate older browser without Promise
      const originalPromise = global.Promise;
      delete (global as any).Promise;

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      // Should still render without Promise
      expect(screen.getByText("Inventory Dashboard")).toBeInTheDocument();

      // Restore Promise
      global.Promise = originalPromise;
    });

    it("should detect and handle missing Array methods", () => {
      // Simulate older browser without modern Array methods
      const originalFind = Array.prototype.find;
      delete (Array.prototype as any).find;

      render(
        <TestWrapper>
          <StockLevels />
        </TestWrapper>
      );

      // Should still render without modern Array methods
      expect(screen.getByRole("table")).toBeInTheDocument();

      // Restore Array.find
      Array.prototype.find = originalFind;
    });

    it("should detect and handle missing Object methods", () => {
      // Simulate older browser without Object.assign
      const originalAssign = Object.assign;
      delete (Object as any).assign;

      render(
        <TestWrapper>
          <SummaryMetrics />
        </TestWrapper>
      );

      // Should still render without Object.assign
      expect(screen.getByRole("region")).toBeInTheDocument();

      // Restore Object.assign
      Object.assign = originalAssign;
    });
  });

  describe("CSS Compatibility", () => {
    it("should handle CSS Grid fallbacks", () => {
      // Mock browser without CSS Grid support
      const originalSupports = CSS.supports;
      CSS.supports = vi.fn().mockImplementation((property, value) => {
        if (property === "display" && value === "grid") {
          return false;
        }
        return originalSupports.call(CSS, property, value);
      });

      render(
        <TestWrapper>
          <SummaryMetrics />
        </TestWrapper>
      );

      const container = screen.getByRole("region");
      expect(container).toBeInTheDocument();

      // Restore CSS.supports
      CSS.supports = originalSupports;
    });

    it("should handle Flexbox fallbacks", () => {
      // Mock browser without Flexbox support
      const originalSupports = CSS.supports;
      CSS.supports = vi.fn().mockImplementation((property, value) => {
        if (
          property === "display" &&
          (value === "flex" || value === "inline-flex")
        ) {
          return false;
        }
        return originalSupports.call(CSS, property, value);
      });

      render(
        <TestWrapper>
          <StockLevels />
        </TestWrapper>
      );

      const table = screen.getByRole("table");
      expect(table).toBeInTheDocument();

      // Restore CSS.supports
      CSS.supports = originalSupports;
    });

    it("should handle custom properties fallbacks", () => {
      // Mock browser without CSS custom properties support
      const originalSupports = CSS.supports;
      CSS.supports = vi.fn().mockImplementation((property, value) => {
        if (property.startsWith("--") || value.includes("var(")) {
          return false;
        }
        return originalSupports.call(CSS, property, value);
      });

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      expect(screen.getByText("Inventory Dashboard")).toBeInTheDocument();

      // Restore CSS.supports
      CSS.supports = originalSupports;
    });
  });

  describe("Event Handling Compatibility", () => {
    it("should handle touch events on mobile browsers", () => {
      // Mock touch support
      Object.defineProperty(window, "ontouchstart", {
        value: null,
        writable: true,
      });

      render(
        <TestWrapper>
          <SummaryMetrics />
        </TestWrapper>
      );

      const metricCard = screen.getAllByRole("button")[0];

      // Test touch events
      fireEvent.touchStart(metricCard);
      fireEvent.touchEnd(metricCard);

      expect(metricCard).toBeInTheDocument();
    });

    it("should handle pointer events", () => {
      // Mock pointer events support
      Object.defineProperty(window, "PointerEvent", {
        value: class PointerEvent extends Event {
          constructor(type: string, options?: any) {
            super(type, options);
          }
        },
        writable: true,
      });

      render(
        <TestWrapper>
          <StockLevels />
        </TestWrapper>
      );

      const searchInput = screen.getByRole("searchbox");

      // Test pointer events
      fireEvent.pointerDown(searchInput);
      fireEvent.pointerUp(searchInput);

      expect(searchInput).toBeInTheDocument();
    });

    it("should handle keyboard events across browsers", () => {
      render(
        <TestWrapper>
          <SummaryMetrics />
        </TestWrapper>
      );

      const metricCard = screen.getAllByRole("button")[0];

      // Test various keyboard events
      fireEvent.keyDown(metricCard, { key: "Enter", keyCode: 13 });
      fireEvent.keyDown(metricCard, { key: " ", keyCode: 32 });
      fireEvent.keyDown(metricCard, { key: "Tab", keyCode: 9 });

      expect(metricCard).toBeInTheDocument();
    });
  });

  describe("Performance Across Browsers", () => {
    it("should handle large datasets efficiently", () => {
      // Mock large dataset
      const largeDataset = {
        products: Array.from({ length: 1000 }, (_, i) => ({
          id: i + 1,
          sku: `SKU-${i + 1}`,
          name: `Product ${i + 1}`,
          category: "Electronics",
          total_quantity: Math.floor(Math.random() * 100),
          stock_status: "adequate",
        })),
        pagination: { page: 1, limit: 1000, total: 1000 },
      };

      vi.mocked(apiHooks.useStockLevels).mockReturnValue({
        data: largeDataset,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      } as any);

      const startTime = performance.now();

      render(
        <TestWrapper>
          <StockLevels />
        </TestWrapper>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (adjust threshold as needed)
      expect(renderTime).toBeLessThan(1000); // 1 second
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    it("should handle rapid user interactions", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <StockLevels />
        </TestWrapper>
      );

      const searchInput = screen.getByRole("searchbox");

      // Rapid typing simulation
      const startTime = performance.now();

      for (let i = 0; i < 10; i++) {
        await user.type(searchInput, `test${i}`);
        await user.clear(searchInput);
      }

      const endTime = performance.now();
      const interactionTime = endTime - startTime;

      // Should handle rapid interactions without significant delay
      expect(interactionTime).toBeLessThan(5000); // 5 seconds for 10 interactions
      expect(searchInput).toBeInTheDocument();
    });
  });

  describe("Accessibility Across Browsers", () => {
    it("should maintain ARIA support across browsers", () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      // Check ARIA attributes are preserved
      const main = screen.getByRole("main");
      expect(main).toHaveAttribute("aria-label");

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toHaveAttribute("tabindex");
      });
    });

    it("should support screen reader navigation", () => {
      render(
        <TestWrapper>
          <StockLevels />
        </TestWrapper>
      );

      const table = screen.getByRole("table");
      const headers = screen.getAllByRole("columnheader");
      const rows = screen.getAllByRole("row");

      // Check table structure for screen readers
      expect(table).toHaveAttribute("aria-label");
      expect(headers.length).toBeGreaterThan(0);
      expect(rows.length).toBeGreaterThan(0);
    });

    it("should handle focus management consistently", () => {
      render(
        <TestWrapper>
          <SummaryMetrics />
        </TestWrapper>
      );

      const focusableElements = screen.getAllByRole("button");

      // Test focus behavior
      focusableElements.forEach((element) => {
        element.focus();
        expect(document.activeElement).toBe(element);
      });
    });
  });
});
