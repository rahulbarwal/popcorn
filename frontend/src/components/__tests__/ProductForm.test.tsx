import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import ProductForm from "../ProductForm";
import { AppProvider } from "../../contexts/AppContext";
import * as apiHooks from "../../hooks/useApi";
import { api } from "../../services/api";

// Mock the API
vi.mock("../../services/api", () => ({
  api: {
    get: vi.fn(),
  },
}));

// Mock the hooks
vi.mock("../../hooks/useApi", () => ({
  useWarehouses: vi.fn(),
  useCategories: vi.fn(),
  useCreateProduct: vi.fn(),
}));

// Mock debounce hook
vi.mock("../../hooks/useDebounce", () => ({
  useDebounce: vi.fn((value) => value),
}));

const mockWarehouses = {
  warehouses: [
    {
      id: 1,
      name: "Main Warehouse",
      address: "123 Main St, City, State 12345",
      active: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: 2,
      name: "Secondary Warehouse",
      address: "456 Oak Ave, City, State 12345",
      active: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
  ],
};

const mockCategories = {
  categories: ["Electronics", "Clothing", "Books", "Home & Garden"],
};

const mockCreateProduct = {
  mutateAsync: vi.fn(),
  isPending: false,
  isError: false,
  error: null,
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AppProvider>{children}</AppProvider>
    </QueryClientProvider>
  );
};

describe("ProductForm", () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations
    vi.mocked(apiHooks.useWarehouses).mockReturnValue({
      data: mockWarehouses,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.mocked(apiHooks.useCategories).mockReturnValue({
      data: mockCategories,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.mocked(apiHooks.useCreateProduct).mockReturnValue(
      mockCreateProduct as any
    );

    // Mock successful SKU validation
    vi.mocked(api.get).mockResolvedValue({ valid: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderProductForm = (props = {}) => {
    const defaultProps = {
      isOpen: true,
      onClose: mockOnClose,
      onSuccess: mockOnSuccess,
      ...props,
    };

    return render(<ProductForm {...defaultProps} />, {
      wrapper: createWrapper(),
    });
  };

  describe("Form Rendering", () => {
    it("renders the form when open", () => {
      renderProductForm();

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Add New Product")).toBeInTheDocument();
      expect(screen.getByLabelText(/product name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/sku/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    });

    it("does not render when closed", () => {
      renderProductForm({ isOpen: false });

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("renders all form sections", () => {
      renderProductForm();

      expect(screen.getByText("Basic Information")).toBeInTheDocument();
      expect(screen.getByText("Pricing")).toBeInTheDocument();
      expect(screen.getByText("Stock Management")).toBeInTheDocument();
      expect(screen.getByText("Image")).toBeInTheDocument();
    });

    it("renders warehouse stock inputs", () => {
      renderProductForm();

      expect(screen.getByText("Main Warehouse")).toBeInTheDocument();
      expect(screen.getByText("Secondary Warehouse")).toBeInTheDocument();
      expect(
        screen.getByText("123 Main St, City, State 12345")
      ).toBeInTheDocument();
    });

    it("renders category options", () => {
      renderProductForm();

      const categorySelect = screen.getByLabelText(/category/i);
      fireEvent.click(categorySelect);

      mockCategories.categories.forEach((category) => {
        expect(screen.getByText(category)).toBeInTheDocument();
      });
    });
  });

  describe("Form Validation", () => {
    it("validates required fields", async () => {
      const user = userEvent.setup();
      renderProductForm();

      const submitButton = screen.getByRole("button", {
        name: /create product/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Product name is required")
        ).toBeInTheDocument();
        expect(screen.getByText("SKU is required")).toBeInTheDocument();
        expect(screen.getByText("Category is required")).toBeInTheDocument();
        expect(screen.getByText("Cost price is required")).toBeInTheDocument();
        expect(screen.getByText("Sale price is required")).toBeInTheDocument();
        expect(
          screen.getByText("Reorder point is required")
        ).toBeInTheDocument();
      });
    });

    it("validates SKU format", async () => {
      const user = userEvent.setup();
      renderProductForm();

      const skuInput = screen.getByLabelText(/sku/i);
      await user.type(skuInput, "ab");

      const submitButton = screen.getByRole("button", {
        name: /create product/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("SKU must be at least 3 characters long")
        ).toBeInTheDocument();
      });
    });

    it("validates price relationships", async () => {
      const user = userEvent.setup();
      renderProductForm();

      // Fill required fields
      await user.type(screen.getByLabelText(/product name/i), "Test Product");
      await user.type(screen.getByLabelText(/sku/i), "TEST-123");
      await user.selectOptions(
        screen.getByLabelText(/category/i),
        "Electronics"
      );
      await user.type(screen.getByLabelText(/cost price/i), "100");
      await user.type(screen.getByLabelText(/sale price/i), "50");
      await user.type(screen.getByLabelText(/reorder point/i), "10");

      const submitButton = screen.getByRole("button", {
        name: /create product/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(
            "Sale price must be greater than or equal to cost price"
          )
        ).toBeInTheDocument();
      });
    });

    it("validates warehouse stock quantities", async () => {
      const user = userEvent.setup();
      renderProductForm();

      // Fill required fields
      await user.type(screen.getByLabelText(/product name/i), "Test Product");
      await user.type(screen.getByLabelText(/sku/i), "TEST-123");
      await user.selectOptions(
        screen.getByLabelText(/category/i),
        "Electronics"
      );
      await user.type(screen.getByLabelText(/cost price/i), "50");
      await user.type(screen.getByLabelText(/sale price/i), "100");
      await user.type(screen.getByLabelText(/reorder point/i), "10");

      // Enter invalid warehouse quantity
      const warehouseInputs = screen.getAllByDisplayValue("0");
      await user.clear(warehouseInputs[0]);
      await user.type(warehouseInputs[0], "-5");

      const submitButton = screen.getByRole("button", {
        name: /create product/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Quantity must be a non-negative integer")
        ).toBeInTheDocument();
      });
    });
  });

  describe("SKU Validation", () => {
    it("validates SKU uniqueness", async () => {
      const user = userEvent.setup();
      vi.mocked(api.get).mockResolvedValue({ valid: false });

      renderProductForm();

      const skuInput = screen.getByLabelText(/sku/i);
      await user.type(skuInput, "EXISTING-SKU");

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(
          "/api/products/validate-sku/EXISTING-SKU"
        );
      });

      await waitFor(() => {
        expect(
          screen.getByText("This SKU is already in use")
        ).toBeInTheDocument();
      });
    });

    it("shows loading state during SKU validation", async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      vi.mocked(api.get).mockReturnValue(promise);

      renderProductForm();

      const skuInput = screen.getByLabelText(/sku/i);
      await user.type(skuInput, "NEW-SKU");

      // Should show loading indicator
      await waitFor(() => {
        expect(document.querySelector(".animate-spin")).toBeInTheDocument();
      });

      // Resolve the promise
      act(() => {
        resolvePromise!({ valid: true });
      });
    });
  });

  describe("Image Validation", () => {
    it("validates image URL format", async () => {
      const user = userEvent.setup();
      renderProductForm();

      const imageInput = screen.getByLabelText(/image url/i);
      await user.type(imageInput, "not-a-url");

      await waitFor(() => {
        expect(
          screen.getByText("Please enter a valid URL")
        ).toBeInTheDocument();
      });
    });

    it("shows image preview for valid URLs", async () => {
      const user = userEvent.setup();
      renderProductForm();

      // Mock successful image loading
      const mockImage = {
        onload: null as any,
        onerror: null as any,
        src: "",
      };
      vi.spyOn(window, "Image").mockImplementation(() => mockImage as any);

      const imageInput = screen.getByLabelText(/image url/i);
      await user.type(imageInput, "https://example.com/image.jpg");

      // Simulate successful image load
      act(() => {
        mockImage.onload();
      });

      await waitFor(() => {
        const preview = screen.getByAltText("Product preview");
        expect(preview).toBeInTheDocument();
        expect(preview).toHaveAttribute("src", "https://example.com/image.jpg");
      });
    });
  });

  describe("Form Submission", () => {
    it("submits form with valid data", async () => {
      const user = userEvent.setup();
      const mockProduct = { id: 1, name: "Test Product", sku: "TEST-123" };
      mockCreateProduct.mutateAsync.mockResolvedValue(mockProduct);

      renderProductForm();

      // Fill all required fields
      await user.type(screen.getByLabelText(/product name/i), "Test Product");
      await user.type(screen.getByLabelText(/sku/i), "TEST-123");
      await user.selectOptions(
        screen.getByLabelText(/category/i),
        "Electronics"
      );
      await user.type(screen.getByLabelText(/cost price/i), "50");
      await user.type(screen.getByLabelText(/sale price/i), "100");
      await user.type(screen.getByLabelText(/reorder point/i), "10");

      // Set warehouse stock
      const warehouseInputs = screen.getAllByDisplayValue("0");
      await user.clear(warehouseInputs[0]);
      await user.type(warehouseInputs[0], "25");

      const submitButton = screen.getByRole("button", {
        name: /create product/i,
      });
      await user.click(submitButton);

      await waitFor(
        () => {
          expect(mockCreateProduct.mutateAsync).toHaveBeenCalledWith({
            name: "Test Product",
            sku: "TEST-123",
            category: "Electronics",
            cost_price: 50,
            sale_price: 100,
            reorder_point: 10,
            warehouse_stock: [
              {
                warehouse_id: 1,
                initial_quantity: 25,
              },
            ],
          });
        },
        { timeout: 3000 }
      );

      expect(mockOnSuccess).toHaveBeenCalledWith(mockProduct);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("handles submission errors", async () => {
      const user = userEvent.setup();
      const error = new Error("Failed to create product");
      mockCreateProduct.mutateAsync.mockRejectedValue(error);

      renderProductForm();

      // Fill required fields
      await user.type(screen.getByLabelText(/product name/i), "Test Product");
      await user.type(screen.getByLabelText(/sku/i), "TEST-123");
      await user.selectOptions(
        screen.getByLabelText(/category/i),
        "Electronics"
      );
      await user.type(screen.getByLabelText(/cost price/i), "50");
      await user.type(screen.getByLabelText(/sale price/i), "100");
      await user.type(screen.getByLabelText(/reorder point/i), "10");

      const submitButton = screen.getByRole("button", {
        name: /create product/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateProduct.mutateAsync).toHaveBeenCalled();
      });

      // Form should remain open on error
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it("shows loading state during submission", async () => {
      const user = userEvent.setup();
      vi.mocked(apiHooks.useCreateProduct).mockReturnValue({
        ...mockCreateProduct,
        isPending: true,
      } as any);

      renderProductForm();

      const submitButton = screen.getByRole("button", { name: /creating/i });
      expect(submitButton).toBeDisabled();
      expect(screen.getByText("Creating...")).toBeInTheDocument();
    });
  });

  describe("Form Reset and Cancel", () => {
    it("resets form data", async () => {
      const user = userEvent.setup();
      renderProductForm();

      // Fill some fields
      await user.type(screen.getByLabelText(/product name/i), "Test Product");
      await user.type(screen.getByLabelText(/sku/i), "TEST-123");

      const resetButton = screen.getByRole("button", { name: /reset/i });
      await user.click(resetButton);

      expect(screen.getByLabelText(/product name/i)).toHaveValue("");
      expect(screen.getByLabelText(/sku/i)).toHaveValue("");
    });

    it("shows unsaved changes warning", async () => {
      const user = userEvent.setup();
      renderProductForm();

      // Make changes
      await user.type(screen.getByLabelText(/product name/i), "Test Product");

      // Try to close
      const closeButton = screen.getByRole("button", {
        name: /close product form/i,
      });
      await user.click(closeButton);

      expect(screen.getByText("Unsaved Changes")).toBeInTheDocument();
      expect(screen.getByText("Continue Editing")).toBeInTheDocument();
      expect(screen.getByText("Discard Changes")).toBeInTheDocument();
    });

    it("closes without warning when no changes", async () => {
      const user = userEvent.setup();
      renderProductForm();

      const closeButton = screen.getByRole("button", {
        name: /close product form/i,
      });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
      expect(screen.queryByText("Unsaved Changes")).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA labels", () => {
      renderProductForm();

      expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
      expect(screen.getByRole("dialog")).toHaveAttribute(
        "aria-labelledby",
        "product-form-title"
      );
    });

    it("focuses first input when opened", async () => {
      renderProductForm();

      await waitFor(() => {
        expect(screen.getByLabelText(/product name/i)).toHaveFocus();
      });
    });

    it("handles escape key", async () => {
      const user = userEvent.setup();
      renderProductForm();

      await user.keyboard("{Escape}");

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe("Responsive Design", () => {
    it("renders mobile-friendly layout", () => {
      renderProductForm();

      // Check for responsive classes
      const modalContainer = screen.getByRole("dialog").parentElement;
      expect(modalContainer).toHaveClass(
        "flex",
        "min-h-full",
        "items-end",
        "sm:items-center"
      );

      const modalContent = screen.getByRole("dialog");
      expect(modalContent).toHaveClass("rounded-t-lg", "sm:rounded-lg");
    });
  });

  describe("Loading States", () => {
    it("shows loading spinner when data is loading", () => {
      vi.mocked(apiHooks.useWarehouses).mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      } as any);

      renderProductForm();

      expect(
        screen.getAllByText("Loading form data...")[0]
      ).toBeInTheDocument();
    });

    it("disables form during submission", () => {
      vi.mocked(apiHooks.useCreateProduct).mockReturnValue({
        ...mockCreateProduct,
        isPending: true,
      } as any);

      renderProductForm();

      expect(screen.getByLabelText(/product name/i)).toBeDisabled();
      expect(screen.getByLabelText(/sku/i)).toBeDisabled();
      expect(screen.getByRole("button", { name: /creating/i })).toBeDisabled();
    });
  });
});
