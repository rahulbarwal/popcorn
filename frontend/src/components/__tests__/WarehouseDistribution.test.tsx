import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach } from "vitest";
import WarehouseDistribution from "../WarehouseDistribution";
import { WarehouseFilterProvider } from "../../contexts/WarehouseFilterContext";
import { AppProvider } from "../../contexts/AppContext";
import * as apiHooks from "../../hooks/useApi";

// Mock the API hook
const mockUseWarehouseDistribution = vi.fn();
vi.mock("../../hooks/useApi", () => ({
  useWarehouseDistribution: () => mockUseWarehouseDistribution(),
}));

// Mock data
const mockWarehouseDistribution = {
  distributions: [
    {
      warehouse: {
        id: 1,
        name: "Main Warehouse",
        address: "123 Main St, City, State 12345",
        city: "City",
        state: "State",
        zip_code: "12345",
        warehouse_type: "main",
        active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
      products: [
        {
          location_id: 1,
          location_name: "Product A",
          location_address: "123 Main St",
          quantity: 100,
          unit_cost: 25.5,
          value: 2550.0,
        },
        {
          location_id: 1,
          location_name: "Product B",
          location_address: "123 Main St",
          quantity: 50,
          unit_cost: 15.0,
          value: 750.0,
        },
      ],
      total_products: 150,
      total_value: 3300.0,
      low_stock_count: 5,
      out_of_stock_count: 2,
    },
    {
      warehouse: {
        id: 2,
        name: "Secondary Warehouse",
        address: "456 Oak Ave, City, State 12345",
        city: "City",
        state: "State",
        zip_code: "12345",
        warehouse_type: "secondary",
        active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
      products: [
        {
          location_id: 2,
          location_name: "Product C",
          location_address: "456 Oak Ave",
          quantity: 75,
          unit_cost: 30.0,
          value: 2250.0,
        },
      ],
      total_products: 75,
      total_value: 2250.0,
      low_stock_count: 3,
      out_of_stock_count: 1,
    },
  ],
  filters: {},
};

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
      <AppProvider>
        <WarehouseFilterProvider>{children}</WarehouseFilterProvider>
      </AppProvider>
    </QueryClientProvider>
  );
};

describe("WarehouseDistribution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state", () => {
    mockUseWarehouseDistribution.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    render(
      <TestWrapper>
        <WarehouseDistribution />
      </TestWrapper>
    );

    expect(
      screen.getByText("Loading warehouse distribution...")
    ).toBeInTheDocument();
  });

  it("renders error state", () => {
    mockUseWarehouseDistribution.mockReturnValue({
      data: null,
      isLoading: false,
      error: { message: "Failed to fetch data" },
    });

    render(
      <TestWrapper>
        <WarehouseDistribution />
      </TestWrapper>
    );

    expect(
      screen.getByText("Failed to load warehouse distribution")
    ).toBeInTheDocument();
    expect(screen.getByText("Failed to fetch data")).toBeInTheDocument();
  });

  it("renders empty state when no distributions", () => {
    mockUseWarehouseDistribution.mockReturnValue({
      data: { distributions: [] },
      isLoading: false,
      error: null,
    });

    render(
      <TestWrapper>
        <WarehouseDistribution />
      </TestWrapper>
    );

    expect(screen.getByText("No warehouse data available")).toBeInTheDocument();
  });

  it("renders warehouse distribution data", () => {
    mockUseWarehouseDistribution.mockReturnValue({
      data: mockWarehouseDistribution,
      isLoading: false,
      error: null,
    });

    render(
      <TestWrapper>
        <WarehouseDistribution />
      </TestWrapper>
    );

    expect(screen.getByText("Warehouse Distribution")).toBeInTheDocument();
    expect(screen.getByText("Main Warehouse")).toBeInTheDocument();
    expect(screen.getByText("Secondary Warehouse")).toBeInTheDocument();
    expect(
      screen.getByText("123 Main St, City, State 12345")
    ).toBeInTheDocument();
    expect(
      screen.getByText("456 Oak Ave, City, State 12345")
    ).toBeInTheDocument();
  });

  it("displays warehouse metrics correctly", () => {
    mockUseWarehouseDistribution.mockReturnValue({
      data: mockWarehouseDistribution,
      isLoading: false,
      error: null,
    });

    render(
      <TestWrapper>
        <WarehouseDistribution />
      </TestWrapper>
    );

    // Check for product counts
    expect(screen.getByText("150")).toBeInTheDocument();
    expect(screen.getByText("75")).toBeInTheDocument();

    // Check for formatted currency values
    expect(screen.getByText("$3,300.00")).toBeInTheDocument();
    expect(screen.getByText("$2,250.00")).toBeInTheDocument();
  });

  it("shows imbalance indicator for multiple warehouses", () => {
    mockUseWarehouseDistribution.mockReturnValue({
      data: mockWarehouseDistribution,
      isLoading: false,
      error: null,
    });

    render(
      <TestWrapper>
        <WarehouseDistribution />
      </TestWrapper>
    );

    // Should show imbalance indicator since we have warehouses with different stock levels
    expect(screen.getByText(/Imbalance/)).toBeInTheDocument();
  });

  it("expands warehouse details when clicked", async () => {
    mockUseWarehouseDistribution.mockReturnValue({
      data: mockWarehouseDistribution,
      isLoading: false,
      error: null,
    });

    const onWarehouseClick = vi.fn();

    render(
      <TestWrapper>
        <WarehouseDistribution onWarehouseClick={onWarehouseClick} />
      </TestWrapper>
    );

    const warehouseCard = screen.getByText("Main Warehouse").closest("div");
    if (warehouseCard) {
      fireEvent.click(warehouseCard);
    }

    await waitFor(() => {
      expect(onWarehouseClick).toHaveBeenCalledWith(1);
    });

    // Should show expanded product breakdown
    expect(screen.getByText("Product Breakdown (2 items)")).toBeInTheDocument();
    expect(screen.getByText("Product A")).toBeInTheDocument();
    expect(screen.getByText("Product B")).toBeInTheDocument();
  });

  it("shows view mode controls when analysis is enabled", () => {
    mockUseWarehouseDistribution.mockReturnValue({
      data: mockWarehouseDistribution,
      isLoading: false,
      error: null,
    });

    render(
      <TestWrapper>
        <WarehouseDistribution showAnalysis={true} />
      </TestWrapper>
    );

    expect(screen.getByText("Distribution")).toBeInTheDocument();
    expect(screen.getByText("Comparison")).toBeInTheDocument();
    expect(screen.getByText("Analysis")).toBeInTheDocument();
  });

  it("switches to comparison view", async () => {
    mockUseWarehouseDistribution.mockReturnValue({
      data: mockWarehouseDistribution,
      isLoading: false,
      error: null,
    });

    render(
      <TestWrapper>
        <WarehouseDistribution showAnalysis={true} />
      </TestWrapper>
    );

    const comparisonButton = screen.getByText("Comparison");
    fireEvent.click(comparisonButton);

    await waitFor(() => {
      // Check that comparison button is now active (has different styling)
      expect(comparisonButton).toHaveClass(
        "bg-white",
        "text-gray-900",
        "shadow-sm"
      );
    });
  });

  it("switches to analysis view", async () => {
    mockUseWarehouseDistribution.mockReturnValue({
      data: mockWarehouseDistribution,
      isLoading: false,
      error: null,
    });

    render(
      <TestWrapper>
        <WarehouseDistribution
          showAnalysis={true}
          showTransferSuggestions={true}
        />
      </TestWrapper>
    );

    const analysisButton = screen.getByText("Analysis");
    fireEvent.click(analysisButton);

    await waitFor(() => {
      expect(screen.getByText("Performance Metrics")).toBeInTheDocument();
      expect(screen.getByText("Total Products")).toBeInTheDocument();
      expect(screen.getByText("Total Value")).toBeInTheDocument();
      expect(screen.getByText("Imbalance Score")).toBeInTheDocument();
    });
  });

  it("shows transfer suggestions in analysis view", async () => {
    mockUseWarehouseDistribution.mockReturnValue({
      data: mockWarehouseDistribution,
      isLoading: false,
      error: null,
    });

    const onTransferSuggestion = vi.fn();

    render(
      <TestWrapper>
        <WarehouseDistribution
          showAnalysis={true}
          showTransferSuggestions={true}
          onTransferSuggestion={onTransferSuggestion}
        />
      </TestWrapper>
    );

    const analysisButton = screen.getByText("Analysis");
    fireEvent.click(analysisButton);

    await waitFor(() => {
      expect(screen.getByText("Transfer Suggestions")).toBeInTheDocument();
    });

    // Should show transfer suggestion from Main to Secondary warehouse
    const applySuggestionButton = screen.getByText("Apply Suggestion");
    fireEvent.click(applySuggestionButton);

    expect(onTransferSuggestion).toHaveBeenCalled();
  });

  it("limits displayed items when maxItems is set", () => {
    mockUseWarehouseDistribution.mockReturnValue({
      data: mockWarehouseDistribution,
      isLoading: false,
      error: null,
    });

    render(
      <TestWrapper>
        <WarehouseDistribution maxItems={1} />
      </TestWrapper>
    );

    expect(screen.getByText("Main Warehouse")).toBeInTheDocument();
    expect(screen.queryByText("Secondary Warehouse")).not.toBeInTheDocument();
    expect(screen.getByText("View All 2 Warehouses")).toBeInTheDocument();
  });

  it("shows stock status indicators", () => {
    mockUseWarehouseDistribution.mockReturnValue({
      data: mockWarehouseDistribution,
      isLoading: false,
      error: null,
    });

    render(
      <TestWrapper>
        <WarehouseDistribution />
      </TestWrapper>
    );

    // Should show adequate, low stock, and out of stock indicators
    expect(screen.getByText("143 Adequate")).toBeInTheDocument(); // 150 - 5 - 2
    expect(screen.getByText("5 Low")).toBeInTheDocument();
    expect(screen.getByText("2 Out")).toBeInTheDocument();
  });

  it("shows rebalancing suggestion when imbalance is detected", () => {
    mockUseWarehouseDistribution.mockReturnValue({
      data: mockWarehouseDistribution,
      isLoading: false,
      error: null,
    });

    render(
      <TestWrapper>
        <WarehouseDistribution />
      </TestWrapper>
    );

    expect(screen.getByText("Stock Rebalancing Suggested")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Consider transferring stock between warehouses to optimize distribution"
      )
    ).toBeInTheDocument();
  });
});
