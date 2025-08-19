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
  useUpdateProduct: vi.fn(),
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

    vi.mocked(apiHooks.useUpdateProduct).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

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

  describe("Edit Mode", () => {
    const mockProductData = {
      id: 1,
      name: "Test Product",
      sku: "TEST-001",
      description: "Test description",
      category: "Electronics",
      cost_price: 50,
      sale_price: 100,
      reorder_point: 10,
      image_url: "https://example.com/image.jpg",
      total_quantity: 150,
      total_value: 7500,
      stock_status: "adequate" as const,
      warehouse_count: 2,
      locations: [
        {
          location_id: 1,
          location_name: "Main Warehouse",
          quantity: 100,
          unit_cost: 50,
          value: 5000,
        },
      ],
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };

    const mockUpdateProduct = {
      mutateAsync: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    };

    beforeEach(() => {
      vi.mocked(apiHooks.useUpdateProduct).mockReturnValue(
        mockUpdateProduct as any
      );
    });

    it("renders in edit mode with pre-populated data", () => {
      renderProductForm({
        editMode: true,
        initialData: mockProductData,
      });

      expect(screen.getByText("Edit Product")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Test Product")).toBeInTheDocument();
      expect(screen.getByDisplayValue("TEST-001")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Test description")).toBeInTheDocument();
      expect(screen.getByDisplayValue("50")).toBeInTheDocument();
      expect(screen.getByDisplayValue("100")).toBeInTheDocument();
      expect(screen.getByDisplayValue("10")).toBeInTheDocument();
    });

    it("prevents SKU modification in edit mode", () => {
      renderProductForm({
        editMode: true,
        initialData: mockProductData,
      });

      const skuInput = screen.getByDisplayValue("TEST-001");
      expect(skuInput).toBeDisabled();
      expect(skuInput).toHaveAttribute("readonly");
    });

    it("does not show warehouse stock section in edit mode", () => {
      renderProductForm({
        editMode: true,
        initialData: mockProductData,
      });

      expect(screen.queryByText("Stock Management")).not.toBeInTheDocument();
      expect(screen.queryByText("Main Warehouse")).not.toBeInTheDocument();
    });

    it("submits update request with correct data", async () => {
      const user = userEvent.setup();
      const mockUpdatedProduct = {
        ...mockProductData,
        name: "Updated Product",
      };
      mockUpdateProduct.mutateAsync.mockResolvedValue(mockUpdatedProduct);

      renderProductForm({
        editMode: true,
        initialData: mockProductData,
      });

      // Modify the product name
      const nameInput = screen.getByDisplayValue("Test Product");
      await user.clear(nameInput);
      await user.type(nameInput, "Updated Product");

      const submitButton = screen.getByRole("button", {
        name: /update product/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateProduct.mutateAsync).toHaveBeenCalledWith({
          id: 1,
          data: {
            name: "Updated Product",
            description: "Test description",
            category: "Electronics",
            cost_price: 50,
            sale_price: 100,
            reorder_point: 10,
            image_url: "https://example.com/image.jpg",
          },
        });
      });

      expect(mockOnSuccess).toHaveBeenCalledWith(mockUpdatedProduct);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("handles update errors with rollback", async () => {
      const user = userEvent.setup();
      const mockError = new Error("Update failed");
      mockUpdateProduct.mutateAsync.mockRejectedValue(mockError);

      const mockOnError = vi.fn();
      renderProductForm({
        editMode: true,
        initialData: mockProductData,
        onError: mockOnError,
      });

      // Modify the product name
      const nameInput = screen.getByDisplayValue("Test Product");
      await user.clear(nameInput);
      await user.type(nameInput, "Updated Product");

      const submitButton = screen.getByRole("button", {
        name: /update product/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateProduct.mutateAsync).toHaveBeenCalled();
      });

      // Should rollback to original data
      expect(screen.getByDisplayValue("Test Product")).toBeInTheDocument();
      expect(mockOnError).toHaveBeenCalledWith(mockError);
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it("resets to original data when reset button is clicked", async () => {
      const user = userEvent.setup();
      renderProductForm({
        editMode: true,
        initialData: mockProductData,
      });

      // Modify the product name
      const nameInput = screen.getByDisplayValue("Test Product");
      await user.clear(nameInput);
      await user.type(nameInput, "Modified Product");

      expect(screen.getByDisplayValue("Modified Product")).toBeInTheDocument();

      // Click reset button
      const resetButton = screen.getByRole("button", { name: /reset/i });
      await user.click(resetButton);

      // Should revert to original data
      expect(screen.getByDisplayValue("Test Product")).toBeInTheDocument();
    });

    it("shows unsaved changes warning in edit mode", async () => {
      const user = userEvent.setup();
      renderProductForm({
        editMode: true,
        initialData: mockProductData,
      });

      // Modify the product name
      const nameInput = screen.getByDisplayValue("Test Product");
      await user.clear(nameInput);
      await user.type(nameInput, "Modified Product");

      // Try to close
      const closeButton = screen.getByRole("button", {
        name: /close product form/i,
      });
      await user.click(closeButton);

      expect(screen.getByText("Unsaved Changes")).toBeInTheDocument();
      expect(screen.getByText("Continue Editing")).toBeInTheDocument();
      expect(screen.getByText("Discard Changes")).toBeInTheDocument();
    });

    it("tracks unsaved changes correctly in edit mode", async () => {
      const user = userEvent.setup();
      const mockOnUnsavedChanges = vi.fn();

      renderProductForm({
        editMode: true,
        initialData: mockProductData,
        onUnsavedChanges: mockOnUnsavedChanges,
      });

      // Initially no unsaved changes
      expect(mockOnUnsavedChanges).toHaveBeenCalledWith(false);

      // Modify the product name
      const nameInput = screen.getByDisplayValue("Test Product");
      await user.clear(nameInput);
      await user.type(nameInput, "Modified Product");

      // Should detect unsaved changes
      await waitFor(() => {
        expect(mockOnUnsavedChanges).toHaveBeenCalledWith(true);
      });

      // Revert back to original
      await user.clear(nameInput);
      await user.type(nameInput, "Test Product");

      // Should detect no unsaved changes
      await waitFor(() => {
        expect(mockOnUnsavedChanges).toHaveBeenCalledWith(false);
      });
    });

    it("validates edit operations correctly", async () => {
      const user = userEvent.setup();
      renderProductForm({
        editMode: true,
        initialData: mockProductData,
      });

      // Clear required field
      const nameInput = screen.getByDisplayValue("Test Product");
      await user.clear(nameInput);

      const submitButton = screen.getByRole("button", {
        name: /update product/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Product name is required")
        ).toBeInTheDocument();
      });

      expect(mockUpdateProduct.mutateAsync).not.toHaveBeenCalled();
    });

    it("shows loading state during update", () => {
      vi.mocked(apiHooks.useUpdateProduct).mockReturnValue({
        ...mockUpdateProduct,
        isPending: true,
      } as any);

      renderProductForm({
        editMode: true,
        initialData: mockProductData,
      });

      const submitButton = screen.getByRole("button", { name: /updating/i });
      expect(submitButton).toBeDisabled();
      expect(screen.getByText("Updating...")).toBeInTheDocument();
    });

    it("handles confirmation dialog for discarding changes", async () => {
      const user = userEvent.setup();
      renderProductForm({
        editMode: true,
        initialData: mockProductData,
      });

      // Modify the product name
      const nameInput = screen.getByDisplayValue("Test Product");
      await user.clear(nameInput);
      await user.type(nameInput, "Modified Product");

      // Try to close
      const closeButton = screen.getByRole("button", {
        name: /close product form/i,
      });
      await user.click(closeButton);

      // Confirm discard changes
      const discardButton = screen.getByText("Discard Changes");
      await user.click(discardButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("handles confirmation dialog for continuing editing", async () => {
      const user = userEvent.setup();
      renderProductForm({
        editMode: true,
        initialData: mockProductData,
      });

      // Modify the product name
      const nameInput = screen.getByDisplayValue("Test Product");
      await user.clear(nameInput);
      await user.type(nameInput, "Modified Product");

      // Try to close
      const closeButton = screen.getByRole("button", {
        name: /close product form/i,
      });
      await user.click(closeButton);

      // Continue editing
      const continueButton = screen.getByText("Continue Editing");
      await user.click(continueButton);

      // Should still be in edit mode
      expect(screen.getByText("Edit Product")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Modified Product")).toBeInTheDocument();
      expect(mockOnClose).not.toHaveBeenCalled();
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
