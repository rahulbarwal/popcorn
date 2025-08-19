import React, { useEffect, useRef, useState } from "react";
import {
  X,
  Package,
  MapPin,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Building2,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Edit3,
  Save,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { ProductDetail, UpdateProductRequest } from "../types/api";
import { useProduct } from "../hooks/useApi";
import LoadingSpinner from "./LoadingSpinner";
import { OptimizedImage } from "./OptimizedImage";
import ProductForm from "./ProductForm";

interface ProductDetailModalProps {
  productId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onProductUpdated?: (product: ProductDetail) => void;
  onDeleteProduct?: (product: ProductDetail) => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  productId,
  isOpen,
  onClose,
  onProductUpdated,
  onDeleteProduct,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);

  // Modal state
  const [isEditMode, setIsEditMode] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  // Fetch product data
  const {
    data: product,
    isLoading,
    error,
    refetch,
  } = useProduct(productId || 0);

  // Reset edit mode when modal closes or product changes
  useEffect(() => {
    if (!isOpen) {
      setIsEditMode(false);
      setHasUnsavedChanges(false);
      setShowUnsavedWarning(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (productId) {
      setIsEditMode(false);
      setHasUnsavedChanges(false);
      setShowUnsavedWarning(false);
    }
  }, [productId]);

  // Handle escape key, outside click, and focus management
  useEffect(() => {
    if (!isOpen) return;

    // Store the previously focused element
    const previouslyFocusedElement = document.activeElement as HTMLElement;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        handleClose();
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

    // Focus the appropriate button when modal opens
    setTimeout(() => {
      if (isEditMode && editButtonRef.current) {
        editButtonRef.current.focus();
      } else if (closeButtonRef.current) {
        closeButtonRef.current.focus();
      }
    }, 100);

    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("keydown", handleTabKey);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";

      // Restore focus to previously focused element
      if (previouslyFocusedElement) {
        previouslyFocusedElement.focus();
      }
    };
  }, [isOpen, isEditMode]);

  // Edit mode handlers
  const handleEditClick = () => {
    setIsEditMode(true);
    setHasUnsavedChanges(false);
  };

  const handleCancelEdit = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedWarning(true);
    } else {
      setIsEditMode(false);
    }
  };

  const handleClose = () => {
    if (isEditMode && hasUnsavedChanges) {
      setShowUnsavedWarning(true);
    } else {
      onClose();
    }
  };

  const handleConfirmDiscardChanges = () => {
    setIsEditMode(false);
    setHasUnsavedChanges(false);
    setShowUnsavedWarning(false);
  };

  const handleContinueEditing = () => {
    setShowUnsavedWarning(false);
  };

  const handleProductUpdateSuccess = (updatedProduct: ProductDetail) => {
    setIsEditMode(false);
    setHasUnsavedChanges(false);
    setShowUnsavedWarning(false);

    // Refetch the product data to get the latest version
    refetch();

    // Notify parent component
    if (onProductUpdated) {
      onProductUpdated(updatedProduct);
    }
  };

  const handleProductUpdateError = (error: any) => {
    // Keep edit mode open on error so user can retry
    // The error will be handled by the ProductForm component
    console.error("Product update failed:", error);
  };

  // Don't render if not open
  if (!isOpen) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStockStatusInfo = (status: string) => {
    switch (status) {
      case "out_of_stock":
        return {
          icon: AlertTriangle,
          text: "Out of Stock",
          className: "text-red-600 bg-red-50 border-red-200",
        };
      case "low_stock":
        return {
          icon: AlertTriangle,
          text: "Low Stock",
          className: "text-yellow-600 bg-yellow-50 border-yellow-200",
        };
      default:
        return {
          icon: CheckCircle,
          text: "In Stock",
          className: "text-green-600 bg-green-50 border-green-200",
        };
    }
  };

  const getLocationStockStatus = (quantity: number, reorderPoint: number) => {
    if (quantity === 0) return "out_of_stock";
    if (quantity <= reorderPoint) return "low_stock";
    return "adequate";
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-detail-title"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />

      {/* Modal Container */}
      <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
        <div
          ref={modalRef}
          className="relative w-full max-w-4xl bg-white rounded-t-lg sm:rounded-lg shadow-xl transform transition-all max-h-full sm:max-h-[90vh] flex flex-col"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
            <h2
              id="product-detail-title"
              className="text-lg sm:text-xl font-semibold text-gray-900"
            >
              {isEditMode ? "Edit Product" : "Product Details"}
            </h2>
            <div className="flex items-center gap-2">
              {!isEditMode && product && (
                <>
                  <button
                    ref={editButtonRef}
                    onClick={handleEditClick}
                    className="btn btn-primary flex items-center gap-2"
                    aria-label="Edit product"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </button>
                  {onDeleteProduct && (
                    <button
                      onClick={() => onDeleteProduct(product)}
                      className="btn btn-danger flex items-center gap-2"
                      aria-label="Delete product"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  )}
                </>
              )}
              <button
                ref={closeButtonRef}
                onClick={handleClose}
                className="btn btn-outline p-2 rounded-full hover:bg-gray-100 focus:ring-2 focus:ring-blue-500"
                aria-label="Close product details modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto overscroll-contain">
            {isLoading && (
              <div
                className="py-12"
                role="status"
                aria-live="polite"
                aria-label="Loading product details"
              >
                <LoadingSpinner text="Loading product details..." />
              </div>
            )}

            {error && (
              <div role="alert" className="error" aria-live="assertive">
                <h3 className="font-semibold text-red-800 mb-2">
                  Error Loading Product Details
                </h3>
                <p>{error.message}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="btn btn-outline mt-3"
                  aria-label="Retry loading product details"
                >
                  Retry
                </button>
              </div>
            )}

            {product && !isEditMode && (
              <div className="space-y-6">
                {/* Product Header */}
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                  {/* Product Image */}
                  <div className="flex-shrink-0 self-center sm:self-start">
                    {product.image_url ? (
                      <OptimizedImage
                        src={product.image_url}
                        alt={`${product.name} product image`}
                        className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 rounded-lg object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                        <Package className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Product Basic Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          SKU: {product.sku}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="inline-flex px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded-full">
                            {product.category}
                          </span>
                          <div
                            className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full border ${
                              getStockStatusInfo(product.stock_status).className
                            }`}
                          >
                            {React.createElement(
                              getStockStatusInfo(product.stock_status).icon,
                              { className: "w-4 h-4 mr-1" }
                            )}
                            {getStockStatusInfo(product.stock_status).text}
                          </div>
                        </div>
                      </div>

                      {/* Pricing Info */}
                      <div className="flex flex-col sm:text-right bg-gray-50 sm:bg-transparent p-3 sm:p-0 rounded-lg sm:rounded-none">
                        <div className="flex items-center gap-2 sm:justify-end">
                          <DollarSign className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            Sale Price:
                          </span>
                          <span className="text-base sm:text-lg font-semibold text-gray-900">
                            {formatCurrency(product.sale_price)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 sm:justify-end mt-1">
                          <span className="text-sm text-gray-600">
                            Cost Price:
                          </span>
                          <span className="text-sm text-gray-900">
                            {formatCurrency(product.cost_price)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 sm:justify-end mt-1">
                          <span className="text-sm text-gray-600">
                            Reorder Point:
                          </span>
                          <span className="text-sm text-gray-900">
                            {product.reorder_point.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {product.description && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          Description
                        </h4>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {product.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stock Levels by Warehouse */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    Stock Levels by Warehouse
                  </h4>

                  {product.locations && product.locations.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {product.locations.map((location) => {
                        const locationStatus = getLocationStockStatus(
                          location.quantity,
                          product.reorder_point
                        );
                        const statusInfo = getStockStatusInfo(locationStatus);

                        return (
                          <div
                            key={location.location_id}
                            className="card card-compact border border-gray-200"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="min-w-0 flex-1">
                                <h5 className="font-medium text-gray-900 truncate">
                                  {location.location_name}
                                </h5>
                                {location.location_address && (
                                  <p className="text-xs text-gray-600 mt-1 truncate">
                                    {location.location_address}
                                  </p>
                                )}
                              </div>
                              <div
                                className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${statusInfo.className}`}
                              >
                                {React.createElement(statusInfo.icon, {
                                  className: "w-3 h-3 mr-1",
                                })}
                                {statusInfo.text}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">
                                  Quantity:
                                </span>
                                <span className="font-semibold text-gray-900">
                                  {location.quantity.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">
                                  Unit Cost:
                                </span>
                                <span className="text-sm text-gray-900">
                                  {formatCurrency(location.unit_cost)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">
                                  Total Value:
                                </span>
                                <span className="font-medium text-gray-900">
                                  {formatCurrency(location.value)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p>No warehouse locations found for this product.</p>
                    </div>
                  )}

                  {/* Total Stock Summary */}
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-sm text-gray-600">
                            Total Stock:
                          </span>
                          <span className="ml-2 text-lg font-semibold text-gray-900">
                            {product.total_quantity.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">
                            Warehouses:
                          </span>
                          <span className="ml-2 text-sm font-medium text-gray-900">
                            {product.warehouse_count}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">
                          Total Value:
                        </span>
                        <span className="ml-2 text-lg font-semibold text-gray-900">
                          {formatCurrency(product.total_value)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Supplier Information */}
                {product.suppliers && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Building2 className="w-5 h-5 mr-2" />
                      Supplier Information
                    </h4>

                    {product.suppliers.length > 0 ? (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {product.suppliers.map((supplier) => (
                          <div
                            key={supplier.id}
                            className="card card-compact border border-gray-200"
                          >
                            <div className="space-y-3">
                              <div>
                                <h5 className="font-medium text-gray-900">
                                  {supplier.name}
                                </h5>
                                {supplier.contact_name && (
                                  <p className="text-sm text-gray-600">
                                    Contact: {supplier.contact_name}
                                  </p>
                                )}
                              </div>

                              <div className="space-y-2">
                                {supplier.email && (
                                  <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <a
                                      href={`mailto:${supplier.email}`}
                                      className="text-sm text-blue-600 hover:text-blue-800"
                                    >
                                      {supplier.email}
                                    </a>
                                  </div>
                                )}
                                {supplier.phone && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <a
                                      href={`tel:${supplier.phone}`}
                                      className="text-sm text-blue-600 hover:text-blue-800"
                                    >
                                      {supplier.phone}
                                    </a>
                                  </div>
                                )}
                                {supplier.last_order_date && (
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-600">
                                      Last Order:{" "}
                                      {formatDate(supplier.last_order_date)}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {supplier.reliability_score && (
                                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                  <span className="text-sm text-gray-600">
                                    Reliability:
                                  </span>
                                  <div className="flex items-center gap-1">
                                    {supplier.reliability_score >= 0.9 ? (
                                      <TrendingUp className="w-4 h-4 text-green-500" />
                                    ) : supplier.reliability_score >= 0.7 ? (
                                      <Minus className="w-4 h-4 text-yellow-500" />
                                    ) : (
                                      <TrendingDown className="w-4 h-4 text-red-500" />
                                    )}
                                    <span className="text-sm font-medium">
                                      {Math.round(
                                        supplier.reliability_score * 100
                                      )}
                                      %
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p>No suppliers assigned to this product.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Product Variants */}
                {product.variants && product.variants.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      Product Variants
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {product.variants.map((variant) => (
                        <div
                          key={variant.id}
                          className="card card-compact border border-gray-200"
                        >
                          <div>
                            <h5 className="font-medium text-gray-900">
                              {variant.variant_name}
                            </h5>
                            <p className="text-sm text-gray-600 mt-1">
                              SKU: {variant.variant_sku}
                            </p>
                            {variant.attributes &&
                              Object.keys(variant.attributes).length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {Object.entries(variant.attributes).map(
                                    ([key, value]) => (
                                      <div
                                        key={key}
                                        className="flex justify-between text-sm"
                                      >
                                        <span className="text-gray-600 capitalize">
                                          {key}:
                                        </span>
                                        <span className="text-gray-900">
                                          {String(value)}
                                        </span>
                                      </div>
                                    )
                                  )}
                                </div>
                              )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Purchase History */}
                {product.recent_purchases && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Calendar className="w-5 h-5 mr-2" />
                      Recent Purchase History
                    </h4>

                    {product.recent_purchases.length > 0 ? (
                      <div className="space-y-3">
                        {product.recent_purchases.map((order) => (
                          <div
                            key={order.id}
                            className="card card-compact border border-gray-200"
                          >
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h5 className="font-medium text-gray-900">
                                    {order.po_number}
                                  </h5>
                                  <span
                                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                      order.status === "delivered"
                                        ? "bg-green-100 text-green-800"
                                        : order.status === "shipped"
                                        ? "bg-blue-100 text-blue-800"
                                        : order.status === "confirmed"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {order.status.charAt(0).toUpperCase() +
                                      order.status.slice(1)}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600">
                                  Supplier: {order.supplier.name}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Order Date: {formatDate(order.order_date)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-600">
                                  Total Amount
                                </p>
                                <p className="font-semibold text-gray-900">
                                  {formatCurrency(order.total_amount)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p>No recent purchase orders found for this product.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          {!isEditMode && (
            <div className="flex justify-end p-4 sm:p-6 border-t border-gray-200">
              <button
                onClick={handleClose}
                className="btn btn-primary"
                aria-label="Close product details modal"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Unsaved Changes Warning Modal */}
      {showUnsavedWarning && (
        <div
          className="fixed inset-0 z-60 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="unsaved-changes-title"
        >
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />

          {/* Warning Modal Container */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl transform transition-all">
              {/* Warning Header */}
              <div className="p-6 border-b border-gray-200">
                <h3
                  id="unsaved-changes-title"
                  className="text-lg font-semibold text-gray-900"
                >
                  Unsaved Changes
                </h3>
              </div>

              {/* Warning Content */}
              <div className="p-6">
                <p className="text-gray-600">
                  You have unsaved changes. Are you sure you want to discard
                  them?
                </p>
              </div>

              {/* Warning Footer */}
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={handleContinueEditing}
                  className="btn btn-outline"
                >
                  Continue Editing
                </button>
                <button
                  onClick={handleConfirmDiscardChanges}
                  className="btn btn-danger"
                >
                  Discard Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Form Modal */}
      {product && isEditMode && (
        <ProductForm
          isOpen={true}
          onClose={handleCancelEdit}
          onSuccess={handleProductUpdateSuccess}
          onError={handleProductUpdateError}
          editMode={true}
          initialData={product}
          onUnsavedChanges={setHasUnsavedChanges}
        />
      )}
    </div>
  );
};

export default ProductDetailModal;
