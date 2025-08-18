import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import ProductSearch from "../ProductSearch";
import { AppContextProvider } from "../../contexts/AppContext";
import { WarehouseFilterProvider } from "../../contexts/WarehouseFilterContext";

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
        {
          id: 2,
          name: "Another Product",
          sku: "TEST-002",
          category: "Furniture",
          sale_price: 199.99,
          cost_price: 100.0,
          total_quantity: 50,
          stock_status: "low_stock",
        },
      ],
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

describe("ProductSearch", () => {
  const mockOnChange = vi.fn();
  const mockOnProductSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders search input with placeholder", () => {
    render(
      <TestWrapper>
        <ProductSearch value="" onChange={mockOnChange} />
      </TestWrapper>
    );

    expect(
      screen.getByPlaceholderText(
        "Search products by name, SKU, or category..."
      )
    ).toBeInTheDocument();
  });

  it("calls onChange when user types", async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <ProductSearch value="" onChange={mockOnChange} />
      </TestWrapper>
    );

    const input = screen.getByRole("combobox");
    await user.type(input, "test");

    expect(mockOnChange).toHaveBeenCalledWith("t");
    expect(mockOnChange).toHaveBeenCalledWith("te");
    expect(mockOnChange).toHaveBeenCalledWith("tes");
    expect(mockOnChange).toHaveBeenCalledWith("test");
  });

  it("shows clear button when value is present", () => {
    render(
      <TestWrapper>
        <ProductSearch value="test search" onChange={mockOnChange} />
      </TestWrapper>
    );

    expect(screen.getByLabelText("Clear search")).toBeInTheDocument();
  });

  it("clears search when clear button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <ProductSearch value="test search" onChange={mockOnChange} />
      </TestWrapper>
    );

    const clearButton = screen.getByLabelText("Clear search");
    await user.click(clearButton);

    expect(mockOnChange).toHaveBeenCalledWith("");
  });

  it("shows suggestions when focused and has search value", async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <ProductSearch
          value="test"
          onChange={mockOnChange}
          onProductSelect={mockOnProductSelect}
          showSuggestions={true}
        />
      </TestWrapper>
    );

    const input = screen.getByRole("combobox");
    await user.click(input);

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });
  });

  it("handles keyboard navigation in suggestions", async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <ProductSearch
          value="test"
          onChange={mockOnChange}
          onProductSelect={mockOnProductSelect}
          showSuggestions={true}
        />
      </TestWrapper>
    );

    const input = screen.getByRole("combobox");
    await user.click(input);

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    // Test arrow down navigation
    await user.keyboard("{ArrowDown}");

    const firstOption = screen.getAllByRole("option")[0];
    expect(firstOption).toHaveAttribute("aria-selected", "true");
  });

  it("selects suggestion on Enter key", async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <ProductSearch
          value="test"
          onChange={mockOnChange}
          onProductSelect={mockOnProductSelect}
          showSuggestions={true}
        />
      </TestWrapper>
    );

    const input = screen.getByRole("combobox");
    await user.click(input);

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(mockOnChange).toHaveBeenCalledWith("Test Product 1");
  });

  it("closes suggestions on Escape key", async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <ProductSearch
          value="test"
          onChange={mockOnChange}
          showSuggestions={true}
        />
      </TestWrapper>
    );

    const input = screen.getByRole("combobox");
    await user.click(input);

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
  });

  it("handles disabled state", () => {
    render(
      <TestWrapper>
        <ProductSearch value="" onChange={mockOnChange} disabled={true} />
      </TestWrapper>
    );

    const input = screen.getByRole("combobox");
    expect(input).toBeDisabled();
    expect(screen.queryByLabelText("Clear search")).not.toBeInTheDocument();
  });

  it("displays custom placeholder", () => {
    const customPlaceholder = "Custom search placeholder";

    render(
      <TestWrapper>
        <ProductSearch
          value=""
          onChange={mockOnChange}
          placeholder={customPlaceholder}
        />
      </TestWrapper>
    );

    expect(screen.getByPlaceholderText(customPlaceholder)).toBeInTheDocument();
  });

  it("highlights search matches in suggestions", async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <ProductSearch
          value="test"
          onChange={mockOnChange}
          showSuggestions={true}
        />
      </TestWrapper>
    );

    const input = screen.getByRole("combobox");
    await user.click(input);

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    // Check for highlighted text (mark elements)
    const highlightedElements = screen.getAllByText("Test", {
      selector: "mark",
    });
    expect(highlightedElements.length).toBeGreaterThan(0);
  });

  it("shows no results message when no matches found", async () => {
    // Mock empty results
    const { useProducts } = await import("../../hooks/useApi");
    vi.mocked(useProducts).mockReturnValue({
      data: { products: [] },
      isLoading: false,
      error: null,
    });

    const user = userEvent.setup();

    render(
      <TestWrapper>
        <ProductSearch
          value="nonexistent"
          onChange={mockOnChange}
          showSuggestions={true}
        />
      </TestWrapper>
    );

    const input = screen.getByRole("combobox");
    await user.click(input);

    await waitFor(() => {
      expect(
        screen.getByText(/No products found matching/)
      ).toBeInTheDocument();
    });
  });
});
