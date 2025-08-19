import React, { useEffect, useRef, useState } from "react";
import {
  X,
  AlertTriangle,
  Package,
  MapPin,
  ShoppingCart,
  DollarSign,
  Trash2,
} from "lucide-react";
import { ProductDetail } from "../types/api";
import { OptimizedImage } from "./OptimizedImage";

interface ProductDeleteConfirmationProps {
  product: ProductDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

const ProductDeleteConfirmation: React.FC<ProductDeleteConfirmationProps> = ({
  product,
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const [confirmationText, setConfirmationText] = useState("");

  // Reset confirmation text when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setConfirmationText("");
    }
  }, [isOpen, product?.id]);

  // Handle escape key, outside click, and focus management
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isDeleting) {
        onClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node) &&
        !isDeleting
      ) {
        onClose();
      }
    };

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key === "Tab" && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[
          focusableElements.length - 1
        ] as HTMLElement;

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("keydown", handleTabKey);
    document.addEventListener("mousedown", handleClickOutside);

    // Focus the confirm button when modal opens
    setTimeout(() => {
      if (confirmButtonRef.current) {
        confirmButtonRef.current.focus();
      }
    }, 100);

    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("keydown", handleTabKey);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, isDeleting, onClose]);

  // Don't render if not open or no product
  if (!isOpen || !product) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate consequences
  const totalStock = product.total_quantity;
  const totalValue = product.total_value;
  const hasStock = totalStock > 0;
  const hasActivePurchaseOrders = product.recent_purchases?.some(
    (order) => order.status === "pending" || order.status === "confirmed"
  );

  // Determine if deletion should be blocked
  const isBlocked = hasActivePurchaseOrders;

  // Check if confirmation text matches product name
  const isConfirmationValid = confirmationText.trim() === product.name.trim();

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-confirmation-title"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />

      {/* Modal Container */}
      <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
        <div
          ref={modalRef}
          className="relative w-full max-w-lg bg-white rounded-t-lg sm:rounded-lg shadow-xl transform transition-all"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h2
                id="delete-confirmation-title"
                className="text-lg font-semibold text-gray-900"
              >
                {isBlocked ? "Cannot Delete Product" : "Delete Product"}
              </h2>
            </div>
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="btn btn-outline p-2 rounded-full hover:bg-gray-100 focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Close delete confirmation dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-4 sm:p-6">
            {/* Product Information */}
            <div className="flex gap-4 mb-6">
              {/* Product Image */}
              <div className="flex-shrink-0">
                {product.image_url ? (
                  <OptimizedImage
                    src={product.image_url}
                    alt={`${product.name} product image`}
                    className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                    <Package className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                    {product.category}
                  </span>
                </div>
              </div>
            </div>

            {/* Warning Message */}
            {isBlocked ? (
              <div className="mb-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-red-800 mb-2">
                        Deletion Blocked
                      </h4>
                      <p className="text-sm text-red-700">
                        This product cannot be deleted because it has active
                        purchase orders. Please complete or cancel all pending
                        orders before attempting to delete this product.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-yellow-800 mb-2">
                        Warning: This action cannot be undone
                      </h4>
                      <p className="text-sm text-yellow-700">
                        Deleting this product will permanently remove it from
                        your inventory system along with all associated data.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Consequences */}
            <div className="space-y-4 mb-6">
              <h4 className="text-sm font-semibold text-gray-900">
                What will be deleted:
              </h4>

              <div className="space-y-3">
                {/* Stock Information */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Current Stock
                      </p>
                      <p className="text-xs text-gray-600">
                        {product.warehouse_count} warehouse
                        {product.warehouse_count !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${
                        hasStock ? "text-yellow-600" : "text-gray-600"
                      }`}
                    >
                      {totalStock.toLocaleString()} units
                    </p>
                    {hasStock && (
                      <p className="text-xs text-yellow-600">
                        Stock will be lost
                      </p>
                    )}
                  </div>
                </div>

                {/* Stock Value */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Stock Value
                      </p>
                      <p className="text-xs text-gray-600">
                        Total inventory value
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${
                        totalValue > 0 ? "text-yellow-600" : "text-gray-600"
                      }`}
                    >
                      {formatCurrency(totalValue)}
                    </p>
                    {totalValue > 0 && (
                      <p className="text-xs text-yellow-600">
                        Value will be lost
                      </p>
                    )}
                  </div>
                </div>

                {/* Purchase Order History */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Purchase History
                      </p>
                      <p className="text-xs text-gray-600">
                        Historical order data
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-600">
                      {product.recent_purchases?.length || 0} orders
                    </p>
                    <p className="text-xs text-gray-600">Will be preserved</p>
                  </div>
                </div>

                {/* Active Purchase Orders Warning */}
                {hasActivePurchaseOrders && (
                  <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <div>
                        <p className="text-sm font-medium text-red-900">
                          Active Purchase Orders
                        </p>
                        <p className="text-xs text-red-700">
                          Pending or confirmed orders
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-red-600">
                        {
                          product.recent_purchases?.filter(
                            (order) =>
                              order.status === "pending" ||
                              order.status === "confirmed"
                          ).length
                        }{" "}
                        active
                      </p>
                      <p className="text-xs text-red-600">Blocks deletion</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Confirmation Input */}
            {!isBlocked && (
              <div className="mb-6">
                <label
                  htmlFor="confirmation-text"
                  className="block text-sm font-medium text-gray-900 mb-2"
                >
                  To confirm deletion, type the product name:{" "}
                  <span className="font-semibold">{product.name}</span>
                </label>
                <input
                  id="confirmation-text"
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Enter product name to confirm"
                  disabled={isDeleting}
                />
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex flex-col sm:flex-row gap-3 p-4 sm:p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="btn btn-outline flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>

            {!isBlocked && (
              <button
                ref={confirmButtonRef}
                onClick={onConfirm}
                disabled={isDeleting || !isConfirmationValid}
                className="btn btn-danger flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`Delete product ${product.name}`}
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Product
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDeleteConfirmation;
