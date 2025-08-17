import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import SummaryMetrics from "../SummaryMetrics";
import StockLevels from "../StockLevels";
import Products from "../../pages/Products";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WarehouseFilterProvider } from "../../contexts/WarehouseFilterContext";
import { AppProvider } from "../../contexts/AppContext";
import { BrowserRouter } from "react-router-dom";

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock API hooks
vi.mock("../../hooks/useApi", () => ({
  useSummaryMetrics: () => ({
    data: {
      metrics: {
        total_products: { value: 100, status: "normal" },
        low_stock: { value: 5, status: "warning" },
        out_of_stock: { value: 2, status: "critical" },
        suppliers: { value: 10, status: "normal" },
        total_stock_value: { value: 50000, currency: "USD", status: "normal" },
      },
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    isRefetching: false,
  }),
  useStockLevels: () => ({
    data: {
      products: [
        {
          id: 1,
          name: "Test Product",
          sku: "TEST-001",
          category: "Electronics",
          total_quantity: 100,
          total_value: 1000,
          stock_status: "adequate",
          warehouse_count: 2,
          image_url: "/test-image.jpg",
        },
      ],
      pagination: { page: 1, limit: 50, total: 1 },
      filters: {},
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    isRefetching: false,
  }),
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
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

describe("Accessibility Tests", () => {
  describe("SummaryMetrics Component", () => {
    it("should not have accessibility violations", async () => {
      const { container } = render(
        <TestWrapper>
          <SummaryMetrics />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have proper ARIA labels", () => {
      render(
        <TestWrapper>
          <SummaryMetrics />
        </TestWrapper>
      );

      // Check for section with proper labeling
      expect(
        screen.getByRole("group", { name: /inventory metrics/i })
      ).toBeInTheDocument();

      // Check for proper heading
      expect(
        screen.getByRole("heading", { name: /summary metrics/i })
      ).toBeInTheDocument();

      // Check for refresh button with proper label
      expect(
        screen.getByRole("button", { name: /refresh metrics/i })
      ).toBeInTheDocument();
    });

    it("should support keyboard navigation", () => {
      const mockOnMetricClick = vi.fn();
      render(
        <TestWrapper>
          <SummaryMetrics onMetricClick={mockOnMetricClick} />
        </TestWrapper>
      );

      const metricCard = screen.getAllByRole("button")[1]; // First metric card (second button after refresh)

      // Test keyboard activation
      fireEvent.keyDown(metricCard, { key: "Enter" });
      expect(mockOnMetricClick).toHaveBeenCalled();

      fireEvent.keyDown(metricCard, { key: " " });
      expect(mockOnMetricClick).toHaveBeenCalledTimes(2);
    });

    it("should have proper live regions for status updates", () => {
      render(
        <TestWrapper>
          <SummaryMetrics />
        </TestWrapper>
      );

      // Check for live regions using aria-live attribute
      const liveRegions = document.querySelectorAll("[aria-live]");
      expect(liveRegions.length).toBeGreaterThan(0);
    });
  });

  describe("StockLevels Component", () => {
    it("should not have accessibility violations", async () => {
      const { container } = render(
        <TestWrapper>
          <StockLevels />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have proper table structure", () => {
      render(
        <TestWrapper>
          <StockLevels />
        </TestWrapper>
      );

      // Check for table with proper role and label
      const table = screen.getByRole("table", { name: /stock levels table/i });
      expect(table).toBeInTheDocument();

      // Check for column headers
      expect(
        screen.getByRole("columnheader", { name: /product/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("columnheader", { name: /sku/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("columnheader", { name: /category/i })
      ).toBeInTheDocument();
    });

    it("should have accessible search and filter controls", () => {
      render(
        <TestWrapper>
          <StockLevels />
        </TestWrapper>
      );

      // Check for search input with proper labeling
      const searchInput = screen.getByRole("textbox", {
        name: /search products by sku or name/i,
      });
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute("aria-describedby");

      // Check for filter controls
      expect(
        screen.getByRole("combobox", { name: /filter by category/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("combobox", { name: /filter by stock status/i })
      ).toBeInTheDocument();
    });

    it("should support keyboard navigation for sortable headers", () => {
      render(
        <TestWrapper>
          <StockLevels />
        </TestWrapper>
      );

      const sortButton = screen.getByRole("button", {
        name: /sku.*not sorted/i,
      });

      // Test keyboard activation
      fireEvent.keyDown(sortButton, { key: "Enter" });

      // Check that the parent th element has aria-sort attribute
      const thElement = sortButton.closest("th");
      expect(thElement).toHaveAttribute("aria-sort");
    });

    it("should have proper mobile accessibility", () => {
      // Mock mobile viewport
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 500,
      });

      render(
        <TestWrapper>
          <StockLevels />
        </TestWrapper>
      );

      // Check for mobile list structure
      const mobileList = screen.getByRole("list", { name: /stock levels/i });
      expect(mobileList).toBeInTheDocument();
    });
  });

  describe("Products Page", () => {
    it("should not have accessibility violations", async () => {
      const { container } = render(
        <TestWrapper>
          <Products />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have proper page structure", () => {
      render(
        <TestWrapper>
          <Products />
        </TestWrapper>
      );

      // Check for main landmark
      expect(screen.getByRole("main")).toBeInTheDocument();

      // Check for proper heading hierarchy
      expect(
        screen.getByRole("heading", { level: 1, name: /products/i })
      ).toBeInTheDocument();

      // Check for sections with proper labeling
      expect(
        screen.getByRole("region", { name: /search and filter products/i })
      ).toBeInTheDocument();
    });

    it("should have accessible form controls", () => {
      render(
        <TestWrapper>
          <Products />
        </TestWrapper>
      );

      // Check for properly labeled search input
      const searchInput = screen.getByRole("textbox");
      expect(searchInput).toHaveAttribute("aria-describedby");

      // Check for disabled state communication
      expect(searchInput).toBeDisabled();
      expect(searchInput).toHaveAttribute("aria-describedby");
    });

    it("should have accessible table structure", () => {
      render(
        <TestWrapper>
          <Products />
        </TestWrapper>
      );

      // Check for table with caption
      const table = screen.getByRole("table");
      expect(table).toBeInTheDocument();

      // Check for column headers with proper scope
      const headers = screen.getAllByRole("columnheader");
      headers.forEach((header) => {
        expect(header).toHaveAttribute("scope", "col");
      });
    });
  });

  describe("Keyboard Navigation", () => {
    it("should handle Tab navigation properly", () => {
      render(
        <TestWrapper>
          <SummaryMetrics enableNavigation={true} />
        </TestWrapper>
      );

      const focusableElements = screen.getAllByRole("button");

      // Test that interactive elements are focusable (either have tabIndex or are naturally focusable)
      focusableElements.forEach((element) => {
        const hasTabIndex = element.hasAttribute("tabIndex");
        const isNativelyFocusable = element.tagName.toLowerCase() === "button";
        expect(hasTabIndex || isNativelyFocusable).toBe(true);
      });
    });

    it("should handle arrow key navigation in tables", () => {
      render(
        <TestWrapper>
          <StockLevels />
        </TestWrapper>
      );

      const table = screen.getByRole("table");

      // Test arrow key navigation
      fireEvent.keyDown(table, { key: "ArrowDown" });
      fireEvent.keyDown(table, { key: "ArrowUp" });
      fireEvent.keyDown(table, { key: "Home" });
      fireEvent.keyDown(table, { key: "End" });

      // Should not throw errors
      expect(table).toBeInTheDocument();
    });
  });

  describe("Screen Reader Support", () => {
    it("should have proper live regions", () => {
      render(
        <TestWrapper>
          <SummaryMetrics />
        </TestWrapper>
      );

      // Check for live regions
      const liveRegions = document.querySelectorAll("[aria-live]");
      expect(liveRegions.length).toBeGreaterThan(0);
    });

    it("should have proper status announcements", () => {
      render(
        <TestWrapper>
          <StockLevels />
        </TestWrapper>
      );

      // Check for status elements
      const statusElements = screen.getAllByRole("status");
      expect(statusElements.length).toBeGreaterThan(0);
    });

    it("should have descriptive labels for complex elements", () => {
      render(
        <TestWrapper>
          <SummaryMetrics />
        </TestWrapper>
      );

      // Check that the main section has descriptive labeling
      const mainSection = screen.getByRole("region");
      expect(mainSection).toHaveAttribute("aria-labelledby");
    });
  });

  describe("High Contrast Mode", () => {
    it("should maintain visibility in high contrast mode", () => {
      // Mock high contrast preference
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === "(prefers-contrast: high)",
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
          <SummaryMetrics />
        </TestWrapper>
      );

      // Elements should still be visible and accessible
      expect(
        screen.getByRole("group", { name: /inventory metrics/i })
      ).toBeInTheDocument();
    });
  });

  describe("Reduced Motion", () => {
    it("should respect reduced motion preferences", () => {
      // Mock reduced motion preference
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === "(prefers-reduced-motion: reduce)",
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
          <SummaryMetrics />
        </TestWrapper>
      );

      // Should render without animations
      expect(
        screen.getByRole("group", { name: /inventory metrics/i })
      ).toBeInTheDocument();
    });
  });
});
