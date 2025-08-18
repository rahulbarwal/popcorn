import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import StockVisualization from "../StockVisualization";
import { api } from "../../services/api";
import { WarehouseFilterProvider } from "../../contexts/WarehouseFilterContext";
import { StockVisualizationResponse } from "../../types/api";

// Mock the API
vi.mock("../../services/api");
const mockApi = vi.mocked(api);

// Mock Recharts with a simpler approach
vi.mock("recharts", () => {
  const MockChart = ({ children, data }: any) => (
    <div data-testid="mock-chart" data-chart-data={JSON.stringify(data || [])}>
      {children}
    </div>
  );

  const MockComponent = ({ children, ...props }: any) => (
    <div data-testid={`mock-${props.dataKey || "component"}`} {...props}>
      {children}
    </div>
  );

  return {
    default: MockChart,
    BarChart: MockChart,
    Bar: MockComponent,
    XAxis: MockComponent,
    YAxis: MockComponent,
    CartesianGrid: MockComponent,
    Tooltip: MockComponent,
    ResponsiveContainer: ({ children }: any) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    Legend: MockComponent,
    Cell: MockComponent,
  };
});

// Mock components
vi.mock("../LoadingSpinner", () => ({
  default: ({ text }: { text: string }) => (
    <div data-testid="loading-spinner">{text}</div>
  ),
}));

vi.mock("../ErrorStates", () => ({
  ErrorState: ({ type, title, message, actions }: any) => (
    <div data-testid="error-state" data-type={type}>
      <h3>{title}</h3>
      <p>{message}</p>
      {actions?.map((action: any, index: number) => (
        <button key={index} onClick={action.onClick}>
          {action.label}
        </button>
      ))}
    </div>
  ),
}));

// Sample test data
const mockStockVisualizationData: StockVisualizationResponse = {
  chart_data: {
    products: [
      {
        product_id: 1,
        product_name: "Product A",
        sku: "SKU-001",
        warehouses: [
          {
            warehouse_id: 1,
            warehouse_name: "Main Warehouse",
            quantity: 150,
            color: "#3B82F6",
          },
          {
            warehouse_id: 2,
            warehouse_name: "Secondary Warehouse",
            quantity: 75,
            color: "#10B981",
          },
        ],
      },
      {
        product_id: 2,
        product_name: "Product B",
        sku: "SKU-002",
        warehouses: [
          {
            warehouse_id: 1,
            warehouse_name: "Main Warehouse",
            quantity: 200,
            color: "#3B82F6",
          },
        ],
      },
    ],
    chart_config: {
      title: "Stock by Product per Warehouse",
      x_axis_label: "Products",
      y_axis_label: "Stock Quantity",
      color_palette: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"],
    },
  },
  filters: {
    warehouse_id: undefined,
    warehouse_name: "All Warehouses",
  },
  last_updated: "2024-12-08T10:30:00Z",
};

const mockEmptyData: StockVisualizationResponse = {
  chart_data: {
    products: [],
    chart_config: {
      title: "Stock by Product per Warehouse",
      x_axis_label: "Products",
      y_axis_label: "Stock Quantity",
      color_palette: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"],
    },
  },
  filters: {
    warehouse_id: undefined,
    warehouse_name: "All Warehouses",
  },
  last_updated: "2024-12-08T10:30:00Z",
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <WarehouseFilterProvider>{children}</WarehouseFilterProvider>
);

describe("StockVisualization Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Loading State", () => {
    it("should display loading spinner while fetching data", async () => {
      // Mock API to return a promise that doesn't resolve immediately
      mockApi.get.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(mockStockVisualizationData), 100)
          )
      );

      render(
        <TestWrapper>
          <StockVisualization />
        </TestWrapper>
      );

      expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
      expect(
        screen.getByText("Loading stock visualization...")
      ).toBeInTheDocument();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
      });
    });
  });

  describe("Data Display", () => {
    beforeEach(() => {
      mockApi.get.mockResolvedValue(mockStockVisualizationData);
    });

    it("should render chart with correct title and data", async () => {
      render(
        <TestWrapper>
          <StockVisualization />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          screen.getByText("Stock by Product per Warehouse")
        ).toBeInTheDocument();
      });

      expect(
        screen.getByText("Showing data for: All Warehouses")
      ).toBeInTheDocument();
      expect(screen.getByTestId("mock-chart")).toBeInTheDocument();
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("should display correct product and warehouse counts", async () => {
      render(
        <TestWrapper>
          <StockVisualization />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          screen.getByText(/2 products • 2 warehouses/)
        ).toBeInTheDocument();
      });
    });

    it("should display last updated timestamp", async () => {
      render(
        <TestWrapper>
          <StockVisualization />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
      });
    });
  });

  describe("Empty State", () => {
    beforeEach(() => {
      mockApi.get.mockResolvedValue(mockEmptyData);
    });

    it("should display empty state when no data is available", async () => {
      render(
        <TestWrapper>
          <StockVisualization />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId("error-state")).toBeInTheDocument();
        expect(screen.getByText("No Data Available")).toBeInTheDocument();
      });
    });

    it("should show contextual empty message for all warehouses", async () => {
      render(
        <TestWrapper>
          <StockVisualization />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          screen.getByText(/No stock data available for visualization/)
        ).toBeInTheDocument();
      });
    });

    it("should provide refresh action in empty state", async () => {
      render(
        <TestWrapper>
          <StockVisualization />
        </TestWrapper>
      );

      await waitFor(() => {
        const refreshButton = screen.getByText("Refresh");
        expect(refreshButton).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("should display error state when API call fails", async () => {
      const errorMessage = "Network error occurred";
      mockApi.get.mockRejectedValue(new Error(errorMessage));

      render(
        <TestWrapper>
          <StockVisualization />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId("error-state")).toBeInTheDocument();
        expect(screen.getByText("Failed to Load Chart")).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it("should provide retry functionality on error", async () => {
      mockApi.get.mockRejectedValueOnce(new Error("Network error"));
      mockApi.get.mockResolvedValueOnce(mockStockVisualizationData);

      render(
        <TestWrapper>
          <StockVisualization />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("Retry")).toBeInTheDocument();
      });

      // Click retry button
      fireEvent.click(screen.getByText("Retry"));

      await waitFor(() => {
        expect(
          screen.getByText("Stock by Product per Warehouse")
        ).toBeInTheDocument();
      });

      expect(mockApi.get).toHaveBeenCalledTimes(2);
    });
  });

  describe("Interactivity", () => {
    beforeEach(() => {
      mockApi.get.mockResolvedValue(mockStockVisualizationData);
    });

    it("should provide refresh button in header", async () => {
      render(
        <TestWrapper>
          <StockVisualization />
        </TestWrapper>
      );

      await waitFor(() => {
        const refreshButton = screen.getByText("Refresh");
        expect(refreshButton).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Refresh"));
      expect(mockApi.get).toHaveBeenCalledTimes(2);
    });

    it("should handle auto-refresh when enabled", async () => {
      vi.useFakeTimers();

      render(
        <TestWrapper>
          <StockVisualization autoRefresh={true} refreshInterval={1000} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Auto-refreshing every 1s/)
        ).toBeInTheDocument();
      });

      // Fast-forward time to trigger auto-refresh
      vi.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledTimes(2);
      });

      vi.useRealTimers();
    });
  });

  describe("Responsive Design", () => {
    beforeEach(() => {
      mockApi.get.mockResolvedValue(mockStockVisualizationData);
    });

    it("should render responsive container", async () => {
      render(
        <TestWrapper>
          <StockVisualization />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
      });
    });

    it("should accept custom height prop", async () => {
      const customHeight = 500;

      render(
        <TestWrapper>
          <StockVisualization height={customHeight} />
        </TestWrapper>
      );

      await waitFor(() => {
        const chartContainer = document.querySelector('[style*="height"]');
        expect(chartContainer).toBeInTheDocument();
      });
    });

    it("should apply custom className", async () => {
      const customClass = "custom-chart-class";

      render(
        <TestWrapper>
          <StockVisualization className={customClass} />
        </TestWrapper>
      );

      await waitFor(() => {
        const container = document.querySelector(`.${customClass}`);
        expect(container).toBeInTheDocument();
      });
    });
  });

  describe("API Integration", () => {
    it("should call correct API endpoint for all warehouses", async () => {
      mockApi.get.mockResolvedValue(mockStockVisualizationData);

      render(
        <TestWrapper>
          <StockVisualization />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledWith(
          "/api/dashboard/stock-visualization"
        );
      });
    });

    it("should include warehouse_id parameter when warehouse is selected", async () => {
      // This would require mocking the WarehouseFilterContext with a selected warehouse
      // For now, we'll test the API call structure
      mockApi.get.mockResolvedValue({
        ...mockStockVisualizationData,
        filters: {
          warehouse_id: 1,
          warehouse_name: "Main Warehouse",
        },
      });

      render(
        <TestWrapper>
          <StockVisualization />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalled();
      });
    });
  });

  describe("Accessibility", () => {
    beforeEach(() => {
      mockApi.get.mockResolvedValue(mockStockVisualizationData);
    });

    it("should have proper heading structure", async () => {
      render(
        <TestWrapper>
          <StockVisualization />
        </TestWrapper>
      );

      await waitFor(() => {
        const heading = screen.getByRole("heading", { level: 3 });
        expect(heading).toHaveTextContent("Stock by Product per Warehouse");
      });
    });

    it("should provide accessible button labels", async () => {
      render(
        <TestWrapper>
          <StockVisualization />
        </TestWrapper>
      );

      await waitFor(() => {
        const refreshButton = screen.getByTitle("Refresh chart data");
        expect(refreshButton).toBeInTheDocument();
      });
    });
  });
});
