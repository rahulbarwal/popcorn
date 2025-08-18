import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
import ProductSearchAndFilters from "../ProductSearchAndFilters";
import { AppContextProvider } from "../../contexts/AppContext";
import { WarehouseFilterProvider } from "../../contexts/WarehouseFilterContext";
import { SearchFilters, Product } from "../../types/api";

import { vi } from "vitest";

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
      ],
    },
    isLoading: false,
    error: null,
  })),
}));

const TestWrapper: React.FC<{
  children: React.ReactNode;
  initialEntries?: string[];
}> = ({ children, initialEntries = ["/"] }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <AppContextProvider>
          <WarehouseFilterProvider>{children}</WarehouseFilterProvider>
        </AppContextProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe("ProductSearchAndFilters", () => {
  const mockOnFiltersChange = vi.fn();
  const mockOnProductSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders search input and filter button", () => {
    render(
      <TestWrapper>
        <ProductSearchAndFilters
          onFiltersChange={mockOnFiltersChange}
          onProductSelect={mockOnProductSelect}
        />
      </TestWrapper>
    );

    expect(
      screen.getByPlaceholderText(
        "Search products by name, SKU, or category..."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Filters")).toBeInTheDocument();
  });

  it("initializes filters from URL parameters", () => {
    const initialUrl =
      "/?search=test&category=Electronics&stock_filter=low_stock";

    render(
      <TestWrapper initialEntries={[initialUrl]}>
        <ProductSearchAndFilters
          onFiltersChange={mockOnFiltersChange}
          onProductSelect={mockOnProductSelect}
        />
      </TestWrapper>
    );

    // Should call onFiltersChange with URL parameters
    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        search: "test",
        category: "Electronics",
        stock_filter: "low_stock",
      })
    );
  });

  it("updates URL when filters change", async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <ProductSearchAndFilters
          onFiltersChange={mockOnFiltersChange}
          onProductSelect={mockOnProductSelect}
        />
      </TestWrapper>
    );

    const searchInput = screen.getByRole("combobox");
    await user.type(searchInput, "test search");

    // Wait for debounced search
    await waitFor(
      () => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({
            search: "test search",
            page: 1,
          })
        );
      },
      { timeout: 1000 }
    );
  });

  it("shows and hides filter panel", async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <ProductSearchAndFilters
          onFiltersChange={mockOnFiltersChange}
          onProductSelect={mockOnProductSelect}
          showFilters={true}
        />
      </TestWrapper>
    );

    const filterButton = screen.getByText("Filters");

    // Filter panel should not be visible initially
    expect(screen.queryByText("Category")).not.toBeInTheDocument();

    // Click to show filter panel
    await user.click(filterButton);

    await waitFor(() => {
      expect(screen.getByText("Category")).toBeInTheDocument();
    });

    // Click again to hide filter panel
    await user.click(filterButton);

    await waitFor(() => {
      expect(screen.queryByText("Category")).not.toBeInTheDocument();
    });
  });

  it("displays active filter count in filter button", async () => {
    const initialUrl = "/?search=test&category=Electronics";

    render(
      <TestWrapper initialEntries={[initialUrl]}>
        <ProductSearchAndFilters
          onFiltersChange={mockOnFiltersChange}
          onProductSelect={mockOnProductSelect}
        />
      </TestWrapper>
    );

    // Should show filter count badge
    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument(); // search + category
    });
  });

  it("shows clear all button when filters are active", async () => {
    const initialUrl = "/?search=test&category=Electronics";

    render(
      <TestWrapper initialEntries={[initialUrl]}>
        <ProductSearchAndFilters
          onFiltersChange={mockOnFiltersChange}
          onProductSelect={mockOnProductSelect}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Clear All")).toBeInTheDocument();
    });
  });

  it("clears all filters when clear all is clicked", async () => {
    const user = userEvent.setup();
    const initialUrl =
      "/?search=test&category=Electronics&stock_filter=low_stock";

    render(
      <TestWrapper initialEntries={[initialUrl]}>
        <ProductSearchAndFilters
          onFiltersChange={mockOnFiltersChange}
          onProductSelect={mockOnProductSelect}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Clear All")).toBeInTheDocument();
    });

    const clearAllButton = screen.getByText("Clear All");
    await user.click(clearAllButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      sort_by: "name",
      sort_order: "asc",
      limit: 20,
      page: 1,
    });
  });

  it("handles product selection from search suggestions", async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <ProductSearchAndFilters
          onFiltersChange={mockOnFiltersChange}
          onProductSelect={mockOnProductSelect}
        />
      </TestWrapper>
    );

    const searchInput = screen.getByRole("combobox");
    await user.type(searchInput, "test");
    await user.click(searchInput);

    // Wait for suggestions to appear
    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    // Click on a suggestion
    const suggestion = screen.getByText("Test Product 1");
    await user.click(suggestion);

    expect(mockOnProductSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        name: "Test Product 1",
      })
    );
  });

  it("shows active filters summary on mobile", async () => {
    const initialUrl = "/?search=test&category=Electronics";

    render(
      <TestWrapper initialEntries={[initialUrl]}>
        <ProductSearchAndFilters
          onFiltersChange={mockOnFiltersChange}
          onProductSelect={mockOnProductSelect}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Active filters \(2\):/)).toBeInTheDocument();
      expect(screen.getByText('Search: "test"')).toBeInTheDocument();
      expect(screen.getByText("Category: Electronics")).toBeInTheDocument();
    });
  });

  it("shows results summary", async () => {
    const initialUrl = "/?search=test";

    render(
      <TestWrapper initialEntries={[initialUrl]}>
        <ProductSearchAndFilters
          onFiltersChange={mockOnFiltersChange}
          onProductSelect={mockOnProductSelect}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(
        screen.getByText('Showing filtered results for "test"')
      ).toBeInTheDocument();
    });
  });

  it("shows all products message when no filters", () => {
    render(
      <TestWrapper>
        <ProductSearchAndFilters
          onFiltersChange={mockOnFiltersChange}
          onProductSelect={mockOnProductSelect}
        />
      </TestWrapper>
    );

    expect(screen.getByText("Showing all products")).toBeInTheDocument();
  });

  it("handles disabled filters", () => {
    render(
      <TestWrapper>
        <ProductSearchAndFilters
          onFiltersChange={mockOnFiltersChange}
          onProductSelect={mockOnProductSelect}
          showFilters={false}
        />
      </TestWrapper>
    );

    expect(screen.queryByText("Filters")).not.toBeInTheDocument();
  });

  it("debounces search input", async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <ProductSearchAndFilters
          onFiltersChange={mockOnFiltersChange}
          onProductSelect={mockOnProductSelect}
        />
      </TestWrapper>
    );

    const searchInput = screen.getByRole("combobox");

    // Type quickly
    await user.type(searchInput, "test");

    // Should not call onFiltersChange immediately
    expect(mockOnFiltersChange).not.toHaveBeenCalledWith(
      expect.objectContaining({
        search: "test",
      })
    );

    // Wait for debounce
    await waitFor(
      () => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({
            search: "test",
            page: 1,
          })
        );
      },
      { timeout: 1000 }
    );
  });

  it("preserves sort and pagination settings when clearing filters", async () => {
    const user = userEvent.setup();
    const initialUrl =
      "/?search=test&sort_by=price&sort_order=desc&page=3&limit=50";

    render(
      <TestWrapper initialEntries={[initialUrl]}>
        <ProductSearchAndFilters
          onFiltersChange={mockOnFiltersChange}
          onProductSelect={mockOnProductSelect}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Clear All")).toBeInTheDocument();
    });

    const clearAllButton = screen.getByText("Clear All");
    await user.click(clearAllButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      sort_by: "price",
      sort_order: "desc",
      limit: 50,
      page: 1, // Reset to page 1
    });
  });
});
