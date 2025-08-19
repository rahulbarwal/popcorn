import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ProductDeleteConfirmation from "../ProductDeleteConfirmation";
import { ProductDetail } from "../../types/api";

// Mock the OptimizedImage component
vi.mock("../OptimizedImage", () => ({
  OptimizedImage: ({ alt, className, fallbackContent }: any) => (
    <div className={className} data-testid="optimized-image">
      {fallbackContent || alt}
    </div>
  ),
}));

const mockProduct: ProductDetail = {
  id: 1,
  sku: "TEST-001",
  name: "Test Product",
  description: "A test product for deletion",
  category: "Electronics",
  sale_price: 99.99,
  cost_price: 49.99,
  reorder_point: 10,
  image_url: "https://example.com/image.jpg",
  total_quantity: 50,
  total_value: 2499.5,
  stock_status: "adequate",
  warehouse_count: 2,
  locations: [
    {
      location_id: 1,
      location_name: "Main Warehouse",
      location_address: "123 Main St",
      quantity: 30,
      unit_cost: 49.99,
      value: 1499.7,
    },
    {
      location_id: 2,
      location_name: "Secondary Warehouse",
      location_address: "456 Oak Ave",
      quantity: 20,
      unit_cost: 49.99,
      value: 999.8,
    },
  ],
  suppliers: [
    {
      id: 1,
      name: "Test Supplier",
      contact_name: "John Doe",
      email: "john@testsupplier.com",
      phone: "+1-555-0123",
      reliability_score: 0.95,
      last_order_date: "2024-01-15",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-15T00:00:00Z",
    },
  ],
  recent_purchases: [
    {
      id: 1,
      po_number: "PO-2024-001",
      supplier: {
        id: 1,
        name: "Test Supplier",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-15T00:00:00Z",
      },
      order_date: "2024-01-10",
      status: "delivered",
      total_amount: 500.0,
      product_count: 10,
      created_at: "2024-01-10T00:00:00Z",
      updated_at: "2024-01-15T00:00:00Z",
    },
  ],
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-15T00:00:00Z",
};

const mockProductWithActivePO: ProductDetail = {
  ...mockProduct,
  recent_purchases: [
    {
      id: 2,
      po_number: "PO-2024-002",
      supplier: {
        id: 1,
        name: "Test Supplier",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-15T00:00:00Z",
      },
      order_date: "2024-01-20",
      status: "pending",
      total_amount: 1000.0,
      product_count: 20,
      created_at: "2024-01-20T00:00:00Z",
      updated_at: "2024-01-20T00:00:00Z",
    },
  ],
};

describe("ProductDeleteConfirmation", () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly when open with product", () => {
    render(
      <ProductDeleteConfirmation
        product={mockProduct}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(
      screen.getByRole("heading", { name: "Delete Product" })
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
      "Test Product"
    );
    expect(screen.getByText("SKU: TEST-001")).toBeInTheDocument();
    expect(screen.getByText("Electronics")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <ProductDeleteConfirmation
        product={mockProduct}
        isOpen={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.queryByText("Delete Product")).not.toBeInTheDocument();
  });

  it("does not render when no product provided", () => {
    render(
      <ProductDeleteConfirmation
        product={null}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.queryByText("Delete Product")).not.toBeInTheDocument();
  });

  it("displays stock consequences correctly", () => {
    render(
      <ProductDeleteConfirmation
        product={mockProduct}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByText("50 units")).toBeInTheDocument();
    expect(screen.getByText("Stock will be lost")).toBeInTheDocument();
    expect(screen.getByText("$2,499.50")).toBeInTheDocument();
    expect(screen.getByText("Value will be lost")).toBeInTheDocument();
    expect(screen.getByText("2 warehouses")).toBeInTheDocument();
  });

  it("displays purchase order history", () => {
    render(
      <ProductDeleteConfirmation
        product={mockProduct}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByText("1 orders")).toBeInTheDocument();
    expect(screen.getByText("Will be preserved")).toBeInTheDocument();
  });

  it("blocks deletion when active purchase orders exist", () => {
    render(
      <ProductDeleteConfirmation
        product={mockProductWithActivePO}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByText("Cannot Delete Product")).toBeInTheDocument();
    expect(screen.getByText("Deletion Blocked")).toBeInTheDocument();
    expect(screen.getByText("Active Purchase Orders")).toBeInTheDocument();
    expect(screen.getByText("1 active")).toBeInTheDocument();
    expect(screen.getByText("Blocks deletion")).toBeInTheDocument();

    // Delete button should not be present
    expect(
      screen.queryByRole("button", { name: /delete product/i })
    ).not.toBeInTheDocument();
  });

  it("requires confirmation text to enable delete button", async () => {
    const user = userEvent.setup();

    render(
      <ProductDeleteConfirmation
        product={mockProduct}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const deleteButton = screen.getByRole("button", {
      name: /delete product/i,
    });
    const confirmationInput = screen.getByPlaceholderText(
      "Enter product name to confirm"
    );

    // Delete button should be disabled initially
    expect(deleteButton).toBeDisabled();

    // Type incorrect name
    await user.type(confirmationInput, "Wrong Name");
    expect(deleteButton).toBeDisabled();

    // Clear and type correct name
    await user.clear(confirmationInput);
    await user.type(confirmationInput, "Test Product");
    expect(deleteButton).toBeEnabled();
  });

  it("calls onConfirm when delete button is clicked with valid confirmation", async () => {
    const user = userEvent.setup();

    render(
      <ProductDeleteConfirmation
        product={mockProduct}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const deleteButton = screen.getByRole("button", {
      name: /delete product/i,
    });
    const confirmationInput = screen.getByPlaceholderText(
      "Enter product name to confirm"
    );

    // Type correct confirmation text
    await user.type(confirmationInput, "Test Product");

    // Click delete button
    await user.click(deleteButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when cancel button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <ProductDeleteConfirmation
        product={mockProduct}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <ProductDeleteConfirmation
        product={mockProduct}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const closeButton = screen.getByRole("button", {
      name: "Close delete confirmation dialog",
    });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("handles escape key to close modal", () => {
    render(
      <ProductDeleteConfirmation
        product={mockProduct}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("does not close on escape when deleting", () => {
    render(
      <ProductDeleteConfirmation
        product={mockProduct}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        isDeleting={true}
      />
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it("shows loading state when deleting", () => {
    render(
      <ProductDeleteConfirmation
        product={mockProduct}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        isDeleting={true}
      />
    );

    expect(screen.getByText("Deleting...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });

  it("disables interactions when deleting", async () => {
    const user = userEvent.setup();

    render(
      <ProductDeleteConfirmation
        product={mockProduct}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        isDeleting={true}
      />
    );

    const confirmationInput = screen.getByPlaceholderText(
      "Enter product name to confirm"
    );
    const closeButton = screen.getByRole("button", {
      name: "Close delete confirmation dialog",
    });

    expect(confirmationInput).toBeDisabled();
    expect(closeButton).toBeDisabled();

    // Should not close on click outside when deleting
    fireEvent.mouseDown(document.body);
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it("resets confirmation text when modal opens", () => {
    const { rerender } = render(
      <ProductDeleteConfirmation
        product={mockProduct}
        isOpen={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    // Open modal
    rerender(
      <ProductDeleteConfirmation
        product={mockProduct}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const confirmationInput = screen.getByPlaceholderText(
      "Enter product name to confirm"
    );
    expect(confirmationInput).toHaveValue("");
  });

  it("handles products with no stock gracefully", () => {
    const productWithNoStock = {
      ...mockProduct,
      total_quantity: 0,
      total_value: 0,
      locations: [],
    };

    render(
      <ProductDeleteConfirmation
        product={productWithNoStock}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByText("0 units")).toBeInTheDocument();
    expect(screen.getByText("$0.00")).toBeInTheDocument();
    expect(screen.queryByText("Stock will be lost")).not.toBeInTheDocument();
    expect(screen.queryByText("Value will be lost")).not.toBeInTheDocument();
  });

  it("handles products with no purchase history", () => {
    const productWithNoPurchases = {
      ...mockProduct,
      recent_purchases: [],
    };

    render(
      <ProductDeleteConfirmation
        product={productWithNoPurchases}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByText("0 orders")).toBeInTheDocument();
    expect(screen.getByText("Will be preserved")).toBeInTheDocument();
  });
});
