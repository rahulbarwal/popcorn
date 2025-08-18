import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import ProductFilters from "../ProductFilters";
import { AppContextProvider } from "../../contexts/AppContext";
import { WarehouseFilterProvider } from "../../contexts/WarehouseFilterContext";
import { SearchFilters } from "../../types/api";

import { vi } from "vitest";
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

// Mock the API hook
vi.mock("../../hooks/useApi", () => ({
  useProducts: vi.fn(() => ({
    data: {
      products: [
        {
          id: 1,
          name: "Test Product 1",
          sku: "TEST-001",
          category: "Electronics",
          sale_price: 99.99,
          cost_price: 50.0,
          total_quantity: 100,
          stock_status: "adequate",
        },
        {
          id: 2,
          name: "Test Product 2",
          sku: "TEST-002",
          category: "Furniture",
          sale_price: 199.99,
          cost_price: 100.0,
          total_quantity: 0,
          stock_status: "out_of_stock",
        },
        {
          id: 3,
          name: "Test Product 3",
          sku: "TEST-003",
          category: "Electronics",
          sale_price: 149.99,
          cost_price: 75.0,
          total_quantity: 5,
          stock_status: "low_stock",
        },
      ],
    },
    isLoading: false,
    error: null,
  })),
  useCategories: vi.fn(() => ({
    data: {
      categories: ["Electronics", "Furniture"],
    },
    isLoading: false,
    error: null,
  })),
}));

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
        <AppContextProvider>
          <WarehouseFilterProvider>{children}</WarehouseFilterProvider>
        </AppContextProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe("ProductFilters", () => {
  const mockOnFiltersChange = vi.fn();
  const defaultFilters: SearchFilters = {};

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders filter controls", () => {
    render(
      <TestWrapper>
        <ProductFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      </TestWrapper>
    );

    expect(screen.getByText("Filters")).toBeInTheDocument();
    expect(screen.getByLabelText("Category")).toBeInTheDocument();
    expect(screen.getByLabelText("Stock Status")).toBeInTheDocument();
    expect(screen.getByText("Price Range")).toBeInTheDocument();
  });

  it("displays category options from products data", async () => {
    render(
      <TestWrapper>
        <ProductFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      const categorySelect = screen.getByLabelText("Category");
      expect(categorySelect).toBeInTheDocument();

      // Check for category options
      expect(screen.getByText("All Categories")).toBeInTheDocument();
    });
  });

  it("displays stock status options with counts", async () => {
    render(
      <TestWrapper>
        <ProductFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      const stockSelect = screen.getByLabelText("Stock Status");
      expect(stockSelect).toBeInTheDocument();
    });
  });

  it("calls onFiltersChange when category is selected", async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <ProductFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      const categorySelect = screen.getByLabelText("Category");
      expect(categorySelect).toBeInTheDocument();
    });

    const categorySelect = screen.getByLabelText("Category");
    await user.selectOptions(categorySelect, "Electronics");

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      category: "Electronics",
    });
  });

  it("calls onFiltersChange when stock filter is selected", async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <ProductFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      const stockSelect = screen.getByLabelText("Stock Status");
      expect(stockSelect).toBeInTheDocument();
    });

    const stockSelect = screen.getByLabelText("Stock Status");
    await user.selectOptions(stockSelect, "low_stock");

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      stock_filter: "low_stock",
    });
  });

  it("shows price range controls when price filter is expanded", async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <ProductFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      </TestWrapper>
    );

    const priceButton = screen.getByText("Any Price").closest("button");
    expect(priceButton).toBeInTheDocument();

    await user.click(priceButton!);

    await waitFor(() => {
      expect(screen.getByLabelText("Minimum Price")).toBeInTheDocument();
      expect(screen.getByLabelText("Maximum Price")).toBeInTheDocument();
    });
  });

  it("handles price range input changes", async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <ProductFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      </TestWrapper>
    );

    // Expand price filter
    const priceButton = screen.getByText("Any Price").closest("button");
    await user.click(priceButton!);

    await waitFor(() => {
      expect(screen.getByLabelText("Minimum Price")).toBeInTheDocument();
    });

    const minPriceInput = screen.getByLabelText("Minimum Price");
    await user.type(minPriceInput, "50");

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      price_min: 50,
    });
  });

  it("displays active filters", () => {
    const filtersWithActive: SearchFilters = {
      category: "Electronics",
      stock_filter: "low_stock",
      price_min: 50,
      price_max: 200,
    };

    render(
      <TestWrapper>
        <ProductFilters
          filters={filtersWithActive}
          onFiltersChange={mockOnFiltersChange}
        />
      </TestWrapper>
    );

    expect(screen.getByText("4 active")).toBeInTheDocument();
    expect(screen.getByText("Category: Electronics")).toBeInTheDocument();
    expect(screen.getByText(/Stock: Low Stock/)).toBeInTheDocument();
    expect(screen.getByText("Price: $50 - $200")).toBeInTheDocument();
  });

  it("allows removing individual active filters", async () => {
    const user = userEvent.setup();
    const filtersWithActive: SearchFilters = {
      category: "Electronics",
      stock_filter: "low_stock",
    };

    render(
      <TestWrapper>
        <ProductFilters
          filters={filtersWithActive}
          onFiltersChange={mockOnFiltersChange}
        />
      </TestWrapper>
    );

    // Find and click the remove button for category filter
    const categoryFilter = screen.getByText("Category: Electronics");
    const removeButton = categoryFilter.parentElement?.querySelector("button");
    expect(removeButton).toBeInTheDocument();

    await user.click(removeButton!);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      stock_filter: "low_stock",
    });
  });

  it("clears all filters when clear all is clicked", async () => {
    const user = userEvent.setup();
    const filtersWithActive: SearchFilters = {
      category: "Electronics",
      stock_filter: "low_stock",
      price_min: 50,
      search: "test",
      warehouse_id: 1,
      sort_by: "name",
      sort_order: "asc",
      page: 2,
      limit: 20,
    };

    render(
      <TestWrapper>
        <ProductFilters
          filters={filtersWithActive}
          onFiltersChange={mockOnFiltersChange}
        />
      </TestWrapper>
    );

    const clearAllButton = screen.getByText("Clear all");
    await user.click(clearAllButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      search: "test", // Keep search term
      warehouse_id: 1, // Keep warehouse filter
      sort_by: "name", // Keep sorting
      sort_order: "asc",
      page: 2,
      limit: 20,
    });
  });

  it("validates price input values", async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <ProductFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      </TestWrapper>
    );

    // Expand price filter
    const priceButton = screen.getByText("Any Price").closest("button");
    await user.click(priceButton!);

    await waitFor(() => {
      expect(screen.getByLabelText("Minimum Price")).toBeInTheDocument();
    });

    const minPriceInput = screen.getByLabelText("Minimum Price");

    // Test invalid input (negative number)
    await user.type(minPriceInput, "-10");

    // Should not call onFiltersChange for invalid values
    expect(mockOnFiltersChange).not.toHaveBeenCalledWith({
      price_min: -10,
    });
  });

  it("shows no active filters message when no filters are applied", () => {
    render(
      <TestWrapper>
        <ProductFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      </TestWrapper>
    );

    expect(screen.getByText("No filters applied")).toBeInTheDocument();
  });
});
