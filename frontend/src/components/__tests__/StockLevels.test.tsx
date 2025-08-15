import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach } from "vitest";
import StockLevels from "../StockLevels";
import { WarehouseFilterProvider } from "../../contexts/WarehouseFilterContext";
import { AppProvider } from "../../contexts/AppContext";
import * as apiHooks from "../../hooks/useApi";
import { Product, StockLevelsResponse } from "../../types/api";

// Mock the API hooks
vi.mock("../../hooks/useApi");

// Mock data
const mockProducts: Product[] = [
  {
    id: 1,
    sku: "ABC-123",
    name: "Test Product 1",
    description: "Test description",
    category: "Electronics",
    sale_price: 99.99,
    cost_price: 50.0,
    reorder_point: 10,
    image_url: "https://example.com/image1.jpg",
    total_quantity: 25,
    total_value: 1250.0,
    stock_status: "adequate",
    warehouse_count: 2,
    locations: [
      {
        location_id: 1,
        location_name: "Main Warehouse",
        location_address: "123 Main St",
        quantity: 15,
        unit_cost: 50.0,
        value: 750.0,
      },
      {
        location_id: 2,
        location_name: "Secondary Warehouse",
        location_address: "456 Oak Ave",
        quantity: 10,
        unit_cost: 50.0,
        value: 500.0,
      },
    ],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 2,
    sku: "DEF-456",
    name: "Test Product 2",
    description: "Another test product",
    category: "Furniture",
    sale_price: 199.99,
    cost_price: 100.0,
    reorder_point: 5,
    image_url: "https://example.com/image2.jpg",
    total_quantity: 3,
    total_value: 300.0,
    stock_status: "low_stock",
    warehouse_count: 1,
    locations: [
      {
        location_id: 1,
        location_name: "Main Warehouse",
        location_address: "123 Main St",
        quantity: 3,
        unit_cost: 100.0,
        value: 300.0,
      },
    ],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 3,
    sku: "GHI-789",
    name: "Test Product 3",
    description: "Out of stock product",
    category: "Electronics",
    sale_price: 49.99,
    cost_price: 25.0,
    reorder_point: 20,
    image_url: "",
    total_quantity: 0,
    total_value: 0.0,
    stock_status: "out_of_stock",
    warehouse_count: 0,
    locations: [],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
];

const mockStockLevelsResponse: StockLevelsResponse = {
  products: mockProducts,
  filters: {
    warehouse_id: undefined,
    stock_filter: "all",
  },
  pagination: {
    page: 1,
    limit: 50,
    total: 3,
  },
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
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

describe("StockLevels Component", () => {
  const mockUseStockLevels = vi.mocked(apiHooks.useStockLevels);

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementation
    mockUseStockLevels.mockReturnValue({
      data: mockStockLevelsResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any);
  });

  it("renders stock levels table with products", () => {
    render(
      <TestWrapper>
        <StockLevels />
      </TestWrapper>
    );

    // Check if products are displayed
    expect(screen.getByText("Test Product 1")).toBeInTheDocument();
    expect(screen.getByText("Test Product 2")).toBeInTheDocument();
    expect(screen.getByText("Test Product 3")).toBeInTheDocument();

    // Check SKUs
    expect(screen.getByText("ABC-123")).toBeInTheDocument();
    expect(screen.getByText("DEF-456")).toBeInTheDocument();
    expect(screen.getByText("GHI-789")).toBeInTheDocument();

    // Check categories
    expect(screen.getAllByText("Electronics")).toHaveLength(2);
    expect(screen.getByText("Furniture")).toBeInTheDocument();
  });

  it("displays stock status badges correctly", () => {
    render(
      <TestWrapper>
        <StockLevels />
      </TestWrapper>
    );

    // Check stock status badges
    expect(screen.getByText("In Stock")).toBeInTheDocument();
    expect(screen.getByText("Low Stock")).toBeInTheDocument();
    expect(screen.getByText("Out of Stock")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    mockUseStockLevels.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any);

    render(
      <TestWrapper>
        <StockLevels />
      </TestWrapper>
    );

    expect(screen.getByText("Loading stock levels...")).toBeInTheDocument();
  });

  it("shows error state", () => {
    const mockError = { message: "Failed to load stock levels" };
    mockUseStockLevels.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: mockError,
      refetch: vi.fn(),
      isRefetching: false,
    } as any);

    render(
      <TestWrapper>
        <StockLevels />
      </TestWrapper>
    );

    expect(screen.getByText("Error loading stock levels")).toBeInTheDocument();
    expect(screen.getByText("Failed to load stock levels")).toBeInTheDocument();
  });

  it("shows empty state when no products", () => {
    mockUseStockLevels.mockReturnValue({
      data: {
        ...mockStockLevelsResponse,
        products: [],
        pagination: { ...mockStockLevelsResponse.pagination, total: 0 },
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any);

    render(
      <TestWrapper>
        <StockLevels />
      </TestWrapper>
    );

    expect(screen.getByText("No products found")).toBeInTheDocument();
    expect(
      screen.getByText("No products are currently in the inventory.")
    ).toBeInTheDocument();
  });

  it("handles search input", async () => {
    const mockRefetch = vi.fn();
    mockUseStockLevels.mockReturnValue({
      data: mockStockLevelsResponse,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      isRefetching: false,
    } as any);

    render(
      <TestWrapper>
        <StockLevels />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText(
      "Search by SKU or product name..."
    );

    fireEvent.change(searchInput, { target: { value: "ABC" } });

    expect(searchInput).toHaveValue("ABC");

    // Wait for debounced search to trigger
    await waitFor(() => {
      expect(mockUseStockLevels).toHaveBeenCalledWith(
        expect.objectContaining({
          search: "ABC",
        })
      );
    });
  });

  it("handles category filter", () => {
    render(
      <TestWrapper>
        <StockLevels />
      </TestWrapper>
    );

    const categorySelect = screen.getByDisplayValue("All Categories");
    fireEvent.change(categorySelect, { target: { value: "Electronics" } });

    expect(mockUseStockLevels).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "Electronics",
      })
    );
  });

  it("handles stock status filter", () => {
    render(
      <TestWrapper>
        <StockLevels />
      </TestWrapper>
    );

    const stockSelect = screen.getByDisplayValue("All Stock");
    fireEvent.change(stockSelect, { target: { value: "low_stock" } });

    expect(mockUseStockLevels).toHaveBeenCalledWith(
      expect.objectContaining({
        stock_filter: "low_stock",
      })
    );
  });

  it("handles sorting", () => {
    render(
      <TestWrapper>
        <StockLevels />
      </TestWrapper>
    );

    const skuHeader = screen.getByText("SKU");
    fireEvent.click(skuHeader);

    expect(mockUseStockLevels).toHaveBeenCalledWith(
      expect.objectContaining({
        sort_by: "sku",
        sort_order: "asc",
      })
    );

    // Click again to reverse order
    fireEvent.click(skuHeader);

    expect(mockUseStockLevels).toHaveBeenCalledWith(
      expect.objectContaining({
        sort_by: "sku",
        sort_order: "desc",
      })
    );
  });

  it("shows advanced filters when toggled", () => {
    render(
      <TestWrapper>
        <StockLevels />
      </TestWrapper>
    );

    const advancedButton = screen.getByText("Advanced");
    fireEvent.click(advancedButton);

    expect(screen.getByText("Advanced Filters")).toBeInTheDocument();
    expect(screen.getByLabelText("Min Quantity")).toBeInTheDocument();
    expect(screen.getByLabelText("Max Quantity")).toBeInTheDocument();
  });

  it("handles quantity range filters", () => {
    render(
      <TestWrapper>
        <StockLevels />
      </TestWrapper>
    );

    // Open advanced filters
    const advancedButton = screen.getByText("Advanced");
    fireEvent.click(advancedButton);

    const minQuantityInput = screen.getByLabelText("Min Quantity");
    const maxQuantityInput = screen.getByLabelText("Max Quantity");

    fireEvent.change(minQuantityInput, { target: { value: "10" } });
    fireEvent.change(maxQuantityInput, { target: { value: "100" } });

    expect(mockUseStockLevels).toHaveBeenCalledWith(
      expect.objectContaining({
        price_min: 10,
        price_max: 100,
      })
    );
  });

  it("clears all filters", () => {
    render(
      <TestWrapper>
        <StockLevels />
      </TestWrapper>
    );

    // Set some filters first
    const searchInput = screen.getByPlaceholderText(
      "Search by SKU or product name..."
    );
    const categorySelect = screen.getByDisplayValue("All Categories");
    const stockSelect = screen.getByDisplayValue("All Stock");

    fireEvent.change(searchInput, { target: { value: "test" } });
    fireEvent.change(categorySelect, { target: { value: "Electronics" } });
    fireEvent.change(stockSelect, { target: { value: "low_stock" } });

    // Mock empty state to show clear button
    mockUseStockLevels.mockReturnValue({
      data: {
        ...mockStockLevelsResponse,
        products: [],
        pagination: { ...mockStockLevelsResponse.pagination, total: 0 },
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any);

    // Re-render to show empty state
    render(
      <TestWrapper>
        <StockLevels />
      </TestWrapper>
    );

    const clearButton = screen.getByText("Clear all filters");
    fireEvent.click(clearButton);

    // Check that filters are cleared
    expect(screen.getByDisplayValue("")).toBeInTheDocument(); // search input
    expect(screen.getByDisplayValue("All Categories")).toBeInTheDocument();
    expect(screen.getByDisplayValue("All Stock")).toBeInTheDocument();
  });

  it("calls onProductClick when product is clicked", () => {
    const mockOnProductClick = vi.fn();

    render(
      <TestWrapper>
        <StockLevels onProductClick={mockOnProductClick} />
      </TestWrapper>
    );

    const productRow = screen.getByText("Test Product 1").closest("tr");
    fireEvent.click(productRow!);

    expect(mockOnProductClick).toHaveBeenCalledWith(mockProducts[0]);
  });

  it("handles refresh button", () => {
    const mockRefetch = vi.fn();
    mockUseStockLevels.mockReturnValue({
      data: mockStockLevelsResponse,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      isRefetching: false,
    } as any);

    render(
      <TestWrapper>
        <StockLevels />
      </TestWrapper>
    );

    const refreshButton = screen.getByTitle("Refresh stock levels");
    fireEvent.click(refreshButton);

    expect(mockRefetch).toHaveBeenCalled();
  });

  it("displays product images with lazy loading", () => {
    render(
      <TestWrapper>
        <StockLevels />
      </TestWrapper>
    );

    const productImages = screen.getAllByRole("img");
    expect(productImages).toHaveLength(2); // Only products with image_url

    // Check lazy loading attribute
    productImages.forEach((img) => {
      expect(img).toHaveAttribute("loading", "lazy");
    });
  });

  it("shows placeholder for products without images", () => {
    render(
      <TestWrapper>
        <StockLevels />
      </TestWrapper>
    );

    // Product 3 has no image_url, should show package icon placeholder
    const packageIcons = screen.getAllByTestId("package-icon");
    expect(packageIcons.length).toBeGreaterThan(0);
  });

  it("formats currency and numbers correctly", () => {
    render(
      <TestWrapper>
        <StockLevels />
      </TestWrapper>
    );

    // Check currency formatting
    expect(screen.getByText("$1,250")).toBeInTheDocument();
    expect(screen.getByText("$300")).toBeInTheDocument();

    // Check number formatting
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("shows warehouse count correctly", () => {
    render(
      <TestWrapper>
        <StockLevels />
      </TestWrapper>
    );

    expect(screen.getByText("2 locations")).toBeInTheDocument();
    expect(screen.getByText("1 location")).toBeInTheDocument();
    expect(screen.getByText("0 locations")).toBeInTheDocument();
  });

  it("applies correct styling for stock status", () => {
    render(
      <TestWrapper>
        <StockLevels />
      </TestWrapper>
    );

    // Check that rows have appropriate background colors based on stock status
    const lowStockRow = screen.getByText("Test Product 2").closest("tr");
    const outOfStockRow = screen.getByText("Test Product 3").closest("tr");

    expect(lowStockRow).toHaveClass("bg-yellow-50");
    expect(outOfStockRow).toHaveClass("bg-red-50");
  });

  it("respects maxItems prop", () => {
    render(
      <TestWrapper>
        <StockLevels maxItems={2} />
      </TestWrapper>
    );

    expect(mockUseStockLevels).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 2,
      })
    );
  });

  it("hides search and filters when props are false", () => {
    render(
      <TestWrapper>
        <StockLevels showSearch={false} showFilters={false} />
      </TestWrapper>
    );

    expect(
      screen.queryByPlaceholderText("Search by SKU or product name...")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByDisplayValue("All Categories")
    ).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue("All Stock")).not.toBeInTheDocument();
  });
});
