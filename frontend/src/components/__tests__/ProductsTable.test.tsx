import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";
import ProductsTable from "../ProductsTable";
import { AppProvider } from "../../contexts/AppContext";
import { WarehouseFilterProvider } from "../../contexts/WarehouseFilterContext";
import { Product } from "../../types/api";
import * as useApiHooks from "../../hooks/useApi";
import { it } from "zod/v4/locales";
import { it } from "zod/v4/locales";
import { it } from "zod/v4/locales";
import { it } from "zod/v4/locales";
import { it } from "zod/v4/locales";
import { it } from "zod/v4/locales";
import { it } from "zod/v4/locales";
import { it } from "zod/v4/locales";
import { it } from "zod/v4/locales";
import { it } from "zod/v4/locales";
import { it } from "zod/v4/locales";
import { it } from "zod/v4/locales";

// Mock the API hooks
vi.mock("../../hooks/useApi");
const mockUseProducts = useApiHooks.useProducts as any;

// Mock the warehouse filter context
vi.mock("../../contexts/WarehouseFilterContext", async () => {
  const actual = await vi.importActual("../../contexts/WarehouseFilterContext");
  return {
    ...actual,
    useWarehouseFilter: () => ({
      state: {
        selectedWarehouse: null,
        selectedWarehouseId: null,
        warehouses: [],
        isLoading: false,
        error: null,
      },
      dispatch: vi.fn(),
      selectWarehouse: vi.fn(),
      clearFilter: vi.fn(),
      isAllWarehouses: true,
    }),
  };
});

// Mock OptimizedImage component
vi.mock("../OptimizedImage", () => ({
  OptimizedImage: ({ alt, fallbackContent }: any) => (
    <div data-testid="optimized-image" aria-label={alt}>
      {fallbackContent}
    </div>
  ),
}));

const mockProducts: Product[] = [
  {
    id: 1,
    sku: "TEST-001",
    name: "Test Product 1",
    description: "Test description",
    category: "Electronics",
    sale_price: 99.99,
    cost_price: 50.0,
    reorder_point: 10,
    image_url: "https://example.com/image1.jpg",
    total_quantity: 100,
    total_value: 5000,
    stock_status: "adequate",
    warehouse_count: 2,
    locations: [
      {
        location_id: 1,
        location_name: "Main Warehouse",
        quantity: 60,
        unit_cost: 50.0,
        value: 3000,
      },
      {
        location_id: 2,
        location_name: "Secondary Warehouse",
        quantity: 40,
        unit_cost: 50.0,
        value: 2000,
      },
    ],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 2,
    sku: "TEST-002",
    name: "Test Product 2",
    description: "Another test description",
    category: "Clothing",
    sale_price: 29.99,
    cost_price: 15.0,
    reorder_point: 5,
    image_url: null,
    total_quantity: 5,
    total_value: 75,
    stock_status: "low_stock",
    warehouse_count: 1,
    locations: [
      {
        location_id: 1,
        location_name: "Main Warehouse",
        quantity: 5,
        unit_cost: 15.0,
        value: 75,
      },
    ],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
];

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <WarehouseFilterProvider>{children}</WarehouseFilterProvider>
        </AppProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe("ProductsTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state", () => {
    mockUseProducts.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: false,
    });

    render(
      <TestWrapper>
        <ProductsTable />
      </TestWrapper>
    );

    expect(screen.getByText("Loading products...")).toBeInTheDocument();
  });

  it("renders error state", () => {
    const mockError = { message: "Failed to load products" };
    mockUseProducts.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: mockError,
      refetch: vi.fn(),
      isError: true,
      isSuccess: false,
    });

    render(
      <TestWrapper>
        <ProductsTable />
      </TestWrapper>
    );

    expect(screen.getByText("Error Loading Products")).toBeInTheDocument();
    expect(screen.getByText("Failed to load products")).toBeInTheDocument();
  });

  it("renders empty state when no products", () => {
    mockUseProducts.mockReturnValue({
      data: { products: [], pagination: { page: 1, limit: 20, total: 0 } },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: true,
    });

    render(
      <TestWrapper>
        <ProductsTable />
      </TestWrapper>
    );

    expect(screen.getByText("No Products Found")).toBeInTheDocument();
    expect(
      screen.getByText(/Get started by adding your first product/)
    ).toBeInTheDocument();
  });

  it("renders products table with data", () => {
    mockUseProducts.mockReturnValue({
      data: {
        products: mockProducts,
        pagination: { page: 1, limit: 20, total: 2 },
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: true,
    });

    render(
      <TestWrapper>
        <ProductsTable />
      </TestWrapper>
    );

    // Check table headers
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.getByText("Sale Price")).toBeInTheDocument();
    expect(screen.getByText("Cost Price")).toBeInTheDocument();
    expect(screen.getByText("Stock")).toBeInTheDocument();
    expect(screen.getByText("Warehouses")).toBeInTheDocument();

    // Check product data
    expect(screen.getByText("Test Product 1")).toBeInTheDocument();
    expect(screen.getByText("TEST-001")).toBeInTheDocument();
    expect(screen.getByText("Electronics")).toBeInTheDocument();
    expect(screen.getByText("$99.99")).toBeInTheDocument();
    expect(screen.getByText("$50.00")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("2 locations")).toBeInTheDocument();

    expect(screen.getByText("Test Product 2")).toBeInTheDocument();
    expect(screen.getByText("Low Stock")).toBeInTheDocument();
  });

  it("handles sorting by clicking column headers", async () => {
    mockUseProducts.mockReturnValue({
      data: {
        products: mockProducts,
        pagination: { page: 1, limit: 20, total: 2 },
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: true,
    });

    render(
      <TestWrapper>
        <ProductsTable />
      </TestWrapper>
    );

    const nameHeader = screen.getByRole("button", { name: /Sort by name/ });
    fireEvent.click(nameHeader);

    // Should trigger a re-render with new sort parameters
    await waitFor(() => {
      expect(mockUseProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          sort_by: "name",
          sort_order: "desc", // Should toggle from default "asc" to "desc"
        })
      );
    });
  });

  it("calls onViewProduct when View button is clicked", () => {
    const mockOnViewProduct = vi.fn();

    mockUseProducts.mockReturnValue({
      data: {
        products: mockProducts,
        pagination: { page: 1, limit: 20, total: 2 },
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: true,
    });

    render(
      <TestWrapper>
        <ProductsTable onViewProduct={mockOnViewProduct} />
      </TestWrapper>
    );

    const viewButtons = screen.getAllByLabelText(/View details for/);
    fireEvent.click(viewButtons[0]);

    expect(mockOnViewProduct).toHaveBeenCalledWith(mockProducts[0]);
  });

  it("calls onDeleteProduct when Delete button is clicked", () => {
    const mockOnDeleteProduct = vi.fn();

    mockUseProducts.mockReturnValue({
      data: {
        products: mockProducts,
        pagination: { page: 1, limit: 20, total: 2 },
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: true,
    });

    render(
      <TestWrapper>
        <ProductsTable onDeleteProduct={mockOnDeleteProduct} />
      </TestWrapper>
    );

    const deleteButtons = screen.getAllByLabelText(/Delete/);
    fireEvent.click(deleteButtons[0]);

    expect(mockOnDeleteProduct).toHaveBeenCalledWith(mockProducts[0]);
  });

  it("handles pagination correctly", () => {
    mockUseProducts.mockReturnValue({
      data: {
        products: mockProducts,
        pagination: { page: 1, limit: 20, total: 50 },
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: true,
    });

    render(
      <TestWrapper>
        <ProductsTable />
      </TestWrapper>
    );

    // Should show pagination controls
    expect(
      screen.getByText("Showing 1 to 2 of 50 results")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Go to next page")).toBeInTheDocument();
    expect(screen.getByLabelText("Go to previous page")).toBeInTheDocument();
  });

  it("displays correct stock status colors", () => {
    mockUseProducts.mockReturnValue({
      data: {
        products: mockProducts,
        pagination: { page: 1, limit: 20, total: 2 },
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: true,
    });

    render(
      <TestWrapper>
        <ProductsTable />
      </TestWrapper>
    );

    // Check that low stock has appropriate styling
    const lowStockBadge = screen.getByText("Low Stock");
    expect(lowStockBadge).toHaveClass("text-yellow-600", "bg-yellow-50");
  });

  it("formats currency correctly", () => {
    mockUseProducts.mockReturnValue({
      data: {
        products: mockProducts,
        pagination: { page: 1, limit: 20, total: 2 },
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: true,
    });

    render(
      <TestWrapper>
        <ProductsTable />
      </TestWrapper>
    );

    expect(screen.getByText("$99.99")).toBeInTheDocument();
    expect(screen.getByText("$50.00")).toBeInTheDocument();
    expect(screen.getByText("$29.99")).toBeInTheDocument();
    expect(screen.getByText("$15.00")).toBeInTheDocument();
  });

  it("handles keyboard navigation for sorting", () => {
    mockUseProducts.mockReturnValue({
      data: {
        products: mockProducts,
        pagination: { page: 1, limit: 20, total: 2 },
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: true,
    });

    render(
      <TestWrapper>
        <ProductsTable />
      </TestWrapper>
    );

    const nameHeader = screen.getByRole("button", { name: /Sort by name/ });

    // Test Enter key
    fireEvent.keyDown(nameHeader, { key: "Enter" });

    expect(mockUseProducts).toHaveBeenCalledWith(
      expect.objectContaining({
        sort_by: "name",
        sort_order: "desc",
      })
    );
  });

  it("shows proper accessibility labels and roles", () => {
    mockUseProducts.mockReturnValue({
      data: {
        products: mockProducts,
        pagination: { page: 1, limit: 20, total: 2 },
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: true,
    });

    render(
      <TestWrapper>
        <ProductsTable />
      </TestWrapper>
    );

    // Check table has proper role and aria-label
    expect(screen.getByRole("table")).toHaveAttribute(
      "aria-label",
      "Products inventory table"
    );

    // Check action buttons have proper labels
    expect(
      screen.getByLabelText("View details for Test Product 1")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Delete Test Product 1")).toBeInTheDocument();
  });
});
