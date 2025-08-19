import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Package,
  DollarSign,
  Building2,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  Loader2,
  Save,
  RotateCcw,
} from "lucide-react";
import {
  CreateProductRequest,
  UpdateProductRequest,
  WarehouseStockInput,
  Warehouse,
  ProductValidationResponse,
  ProductDetail,
} from "../types/api";
import {
  useWarehouses,
  useCategories,
  useCreateProduct,
  useUpdateProduct,
} from "../hooks/useApi";
import { useDebounce } from "../hooks/useDebounce";
import { api } from "../services/api";
import LoadingSpinner from "./LoadingSpinner";

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (product: any) => void;
  onError?: (error: any) => void;
  editMode?: boolean;
  initialData?: ProductDetail;
  onUnsavedChanges?: (hasChanges: boolean) => void;
}

interface FormData {
  name: string;
  sku: string;
  description: string;
  category: string;
  cost_price: string;
  sale_price: string;
  reorder_point: string;
  image_url: string;
  warehouse_stock: Record<number, string>;
}

interface FormErrors {
  name?: string;
  sku?: string;
  description?: string;
  category?: string;
  cost_price?: string;
  sale_price?: string;
  reorder_point?: string;
  image_url?: string;
  warehouse_stock?: Record<number, string>;
  general?: string;
}

interface ValidationState {
  sku: {
    isValidating: boolean;
    isValid: boolean | null;
    message?: string;
  };
  image: {
    isValidating: boolean;
    isValid: boolean | null;
    previewUrl?: string;
  };
}

const ProductForm: React.FC<ProductFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onError,
  editMode = false,
  initialData,
  onUnsavedChanges,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: "",
    sku: "",
    description: "",
    category: "",
    cost_price: "",
    sale_price: "",
    reorder_point: "",
    image_url: "",
    warehouse_stock: {},
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [validationState, setValidationState] = useState<ValidationState>({
    sku: { isValidating: false, isValid: null },
    image: { isValidating: false, isValid: null },
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [originalData, setOriginalData] = useState<FormData | null>(null);

  // API hooks
  const { data: warehousesData, isLoading: warehousesLoading } =
    useWarehouses();
  const { data: categoriesData, isLoading: categoriesLoading } =
    useCategories();
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();

  // Debounced values for validation
  const debouncedSku = useDebounce(formData.sku, 500);
  const debouncedImageUrl = useDebounce(formData.image_url, 1000);

  // Initialize form data with initial data when in edit mode
  useEffect(() => {
    if (editMode && initialData && warehousesData?.warehouses) {
      const warehouseStock: Record<number, string> = {};

      // Initialize all warehouses with 0
      warehousesData.warehouses.forEach((warehouse) => {
        warehouseStock[warehouse.id] = "0";
      });

      // Set actual quantities from product locations
      if (initialData.locations) {
        initialData.locations.forEach((location) => {
          warehouseStock[location.location_id] = location.quantity.toString();
        });
      }

      const initialFormData = {
        name: initialData.name,
        sku: initialData.sku,
        description: initialData.description || "",
        category: initialData.category,
        cost_price: initialData.cost_price.toString(),
        sale_price: initialData.sale_price.toString(),
        reorder_point: initialData.reorder_point.toString(),
        image_url: initialData.image_url || "",
        warehouse_stock: warehouseStock,
      };

      setFormData(initialFormData);
      setOriginalData(initialFormData);
    } else if (
      !editMode &&
      warehousesData?.warehouses &&
      Object.keys(formData.warehouse_stock).length === 0
    ) {
      // Initialize warehouse stock for create mode
      const initialStock: Record<number, string> = {};
      warehousesData.warehouses.forEach((warehouse) => {
        initialStock[warehouse.id] = "0";
      });
      setFormData((prev) => ({
        ...prev,
        warehouse_stock: initialStock,
      }));
    }
  }, [editMode, initialData, warehousesData, formData.warehouse_stock]);

  // SKU validation
  useEffect(() => {
    if (debouncedSku && debouncedSku.length >= 3) {
      validateSku(debouncedSku);
    } else if (debouncedSku.length > 0 && debouncedSku.length < 3) {
      setValidationState((prev) => ({
        ...prev,
        sku: {
          isValidating: false,
          isValid: false,
          message: "SKU must be at least 3 characters long",
        },
      }));
    } else {
      setValidationState((prev) => ({
        ...prev,
        sku: { isValidating: false, isValid: null },
      }));
    }
  }, [debouncedSku]);

  // Image URL validation
  useEffect(() => {
    if (debouncedImageUrl) {
      validateImageUrl(debouncedImageUrl);
    } else {
      setValidationState((prev) => ({
        ...prev,
        image: { isValidating: false, isValid: null },
      }));
    }
  }, [debouncedImageUrl]);

  // Track unsaved changes
  useEffect(() => {
    let hasChanges = false;

    if (editMode && initialData) {
      // Check if any field has changed from initial data
      hasChanges =
        formData.name !== initialData.name ||
        formData.description !== (initialData.description || "") ||
        formData.category !== initialData.category ||
        formData.cost_price !== initialData.cost_price.toString() ||
        formData.sale_price !== initialData.sale_price.toString() ||
        formData.reorder_point !== initialData.reorder_point.toString() ||
        formData.image_url !== (initialData.image_url || "");

      // Check warehouse stock changes (edit mode doesn't allow warehouse stock changes)
    } else {
      // For create mode, check if any field has been filled
      hasChanges = Object.values(formData).some((value) => {
        if (typeof value === "object") {
          return Object.values(value).some((v) => v !== "0");
        }
        return value !== "";
      });
    }

    setHasUnsavedChanges(hasChanges);

    // Notify parent component about unsaved changes
    if (onUnsavedChanges) {
      onUnsavedChanges(hasChanges);
    }
  }, [formData, editMode, initialData, onUnsavedChanges]);

  // Focus management and escape handling
  useEffect(() => {
    if (!isOpen) return;

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

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);
    document.body.style.overflow = "hidden";

    // Focus the first input
    setTimeout(() => {
      if (nameInputRef.current) {
        nameInputRef.current.focus();
      }
    }, 100);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const validateSku = async (sku: string) => {
    setValidationState((prev) => ({
      ...prev,
      sku: { ...prev.sku, isValidating: true },
    }));

    try {
      const response = await api.get<ProductValidationResponse>(
        `/api/products/validate-sku/${encodeURIComponent(sku)}`
      );

      setValidationState((prev) => ({
        ...prev,
        sku: {
          isValidating: false,
          isValid: response.valid,
          message: response.valid ? "SKU is available" : "SKU already exists",
        },
      }));

      if (!response.valid) {
        setErrors((prev) => ({
          ...prev,
          sku: "This SKU is already in use",
        }));
      } else {
        setErrors((prev) => {
          const { sku, ...rest } = prev;
          return rest;
        });
      }
    } catch (error) {
      setValidationState((prev) => ({
        ...prev,
        sku: {
          isValidating: false,
          isValid: false,
          message: "Unable to validate SKU",
        },
      }));
    }
  };

  const validateImageUrl = async (url: string) => {
    setValidationState((prev) => ({
      ...prev,
      image: { ...prev.image, isValidating: true },
    }));

    try {
      // Basic URL validation
      new URL(url);

      // Try to load the image
      const img = new Image();
      img.onload = () => {
        setValidationState((prev) => ({
          ...prev,
          image: {
            isValidating: false,
            isValid: true,
            previewUrl: url,
          },
        }));
        setErrors((prev) => {
          const { image_url, ...rest } = prev;
          return rest;
        });
      };
      img.onerror = () => {
        setValidationState((prev) => ({
          ...prev,
          image: {
            isValidating: false,
            isValid: false,
          },
        }));
        setErrors((prev) => ({
          ...prev,
          image_url: "Unable to load image from this URL",
        }));
      };
      img.src = url;
    } catch {
      setValidationState((prev) => ({
        ...prev,
        image: {
          isValidating: false,
          isValid: false,
        },
      }));
      setErrors((prev) => ({
        ...prev,
        image_url: "Please enter a valid URL",
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required field validation
    if (!formData.name.trim()) {
      newErrors.name = "Product name is required";
    } else if (formData.name.length > 255) {
      newErrors.name = "Product name must be less than 255 characters";
    }

    if (!editMode) {
      // SKU validation only for create mode
      if (!formData.sku.trim()) {
        newErrors.sku = "SKU is required";
      } else if (formData.sku.length < 3) {
        newErrors.sku = "SKU must be at least 3 characters long";
      } else if (formData.sku.length > 50) {
        newErrors.sku = "SKU must be less than 50 characters";
      } else if (!/^[a-zA-Z0-9-]+$/.test(formData.sku)) {
        newErrors.sku = "SKU can only contain letters, numbers, and hyphens";
      } else if (validationState.sku.isValid === false) {
        newErrors.sku = "This SKU is already in use";
      }
    }

    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    if (!formData.cost_price.trim()) {
      newErrors.cost_price = "Cost price is required";
    } else {
      const costPrice = parseFloat(formData.cost_price);
      if (isNaN(costPrice) || costPrice < 0) {
        newErrors.cost_price = "Cost price must be a positive number";
      }
    }

    if (!formData.sale_price.trim()) {
      newErrors.sale_price = "Sale price is required";
    } else {
      const salePrice = parseFloat(formData.sale_price);
      const costPrice = parseFloat(formData.cost_price);
      if (isNaN(salePrice) || salePrice < 0) {
        newErrors.sale_price = "Sale price must be a positive number";
      } else if (!isNaN(costPrice) && salePrice < costPrice) {
        newErrors.sale_price =
          "Sale price must be greater than or equal to cost price";
      }
    }

    if (!formData.reorder_point.trim()) {
      newErrors.reorder_point = "Reorder point is required";
    } else {
      const reorderPoint = parseInt(formData.reorder_point);
      if (isNaN(reorderPoint) || reorderPoint < 0) {
        newErrors.reorder_point =
          "Reorder point must be a non-negative integer";
      }
    }

    // Optional field validation
    if (formData.description && formData.description.length > 1000) {
      newErrors.description = "Description must be less than 1000 characters";
    }

    if (formData.image_url && validationState.image.isValid === false) {
      newErrors.image_url = "Please enter a valid image URL";
    }

    // Warehouse stock validation
    const warehouseErrors: Record<number, string> = {};
    Object.entries(formData.warehouse_stock).forEach(
      ([warehouseId, quantity]) => {
        const qty = parseInt(quantity);
        if (isNaN(qty) || qty < 0) {
          warehouseErrors[parseInt(warehouseId)] =
            "Quantity must be a non-negative integer";
        }
      }
    );

    if (Object.keys(warehouseErrors).length > 0) {
      newErrors.warehouse_stock = warehouseErrors;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear field-specific errors
    if (errors[field]) {
      setErrors((prev) => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleWarehouseStockChange = (warehouseId: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      warehouse_stock: {
        ...prev.warehouse_stock,
        [warehouseId]: value,
      },
    }));

    // Clear warehouse-specific errors
    if (errors.warehouse_stock?.[warehouseId]) {
      setErrors((prev) => {
        const newWarehouseStock = { ...prev.warehouse_stock };
        delete newWarehouseStock[warehouseId];
        return {
          ...prev,
          warehouse_stock: newWarehouseStock,
        };
      });
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Check if SKU validation is still in progress (only for create mode)
    if (!editMode && validationState.sku.isValidating) {
      setErrors({ general: "Please wait for SKU validation to complete" });
      return;
    }

    try {
      let result;

      if (editMode && initialData) {
        // Update existing product with optimistic updates
        const updateData: UpdateProductRequest = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          category: formData.category,
          cost_price: parseFloat(formData.cost_price),
          sale_price: parseFloat(formData.sale_price),
          reorder_point: parseInt(formData.reorder_point),
          image_url: formData.image_url.trim() || undefined,
        };

        // Store current form data for potential rollback
        const currentFormData = { ...formData };

        try {
          result = await updateProductMutation.mutateAsync({
            id: initialData.id,
            data: updateData,
          });

          // Update successful - update original data to reflect new state
          setOriginalData(currentFormData);
        } catch (updateError) {
          // Rollback to original data on failure
          if (originalData) {
            setFormData(originalData);
            setHasUnsavedChanges(false);
          }

          // Call error callback if provided
          if (onError) {
            onError(updateError);
          }

          throw updateError;
        }
      } else {
        // Create new product
        const warehouseStock: WarehouseStockInput[] = Object.entries(
          formData.warehouse_stock
        )
          .map(([warehouseId, quantity]) => ({
            warehouse_id: parseInt(warehouseId),
            initial_quantity: parseInt(quantity),
          }))
          .filter((stock) => stock.initial_quantity > 0);

        const productData: CreateProductRequest = {
          name: formData.name.trim(),
          sku: formData.sku.trim(),
          description: formData.description.trim() || undefined,
          category: formData.category,
          cost_price: parseFloat(formData.cost_price),
          sale_price: parseFloat(formData.sale_price),
          reorder_point: parseInt(formData.reorder_point),
          image_url: formData.image_url.trim() || undefined,
          warehouse_stock: warehouseStock,
        };

        result = await createProductMutation.mutateAsync(productData);
      }

      // Reset form
      resetForm();

      // Call success callback
      if (onSuccess) {
        onSuccess(result);
      }

      // Close modal
      onClose();
    } catch (error) {
      // Error is handled by the mutation hook and callback
      console.error(
        `Failed to ${editMode ? "update" : "create"} product:`,
        error
      );

      // Call error callback if provided (for create mode)
      if (!editMode && onError) {
        onError(error);
      }
    }
  };

  const resetForm = () => {
    if (editMode && originalData) {
      // In edit mode, reset to original data
      setFormData(originalData);
    } else {
      // In create mode, reset to empty form
      setFormData({
        name: "",
        sku: "",
        description: "",
        category: "",
        cost_price: "",
        sale_price: "",
        reorder_point: "",
        image_url: "",
        warehouse_stock:
          warehousesData?.warehouses.reduce((acc, warehouse) => {
            acc[warehouse.id] = "0";
            return acc;
          }, {} as Record<number, string>) || {},
      });
    }
    setErrors({});
    setValidationState({
      sku: { isValidating: false, isValid: null },
      image: { isValidating: false, isValid: null },
    });
    setHasUnsavedChanges(false);
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedWarning(true);
    } else {
      onClose();
    }
  };

  const confirmClose = () => {
    resetForm();
    setOriginalData(null);
    setShowUnsavedWarning(false);
    onClose();
  };

  const cancelClose = () => {
    setShowUnsavedWarning(false);
  };

  if (!isOpen) return null;

  const isLoading = warehousesLoading || categoriesLoading;
  const isSubmitting =
    createProductMutation.isPending || updateProductMutation.isPending;

  return (
    <>
      {/* Main Modal */}
      <div
        className="fixed inset-0 z-50 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-form-title"
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
                id="product-form-title"
                className="text-lg sm:text-xl font-semibold text-gray-900"
              >
                {editMode ? "Edit Product" : "Add New Product"}
              </h2>
              <button
                onClick={handleClose}
                className="btn btn-outline p-2 rounded-full hover:bg-gray-100 focus:ring-2 focus:ring-blue-500"
                aria-label="Close product form"
                disabled={isSubmitting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto overscroll-contain">
              {isLoading ? (
                <div className="py-12">
                  <LoadingSpinner text="Loading form data..." />
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* General Error */}
                  {errors.general && (
                    <div className="error" role="alert">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      {errors.general}
                    </div>
                  )}

                  {/* Basic Information Section */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                      <Package className="w-5 h-5 text-gray-600" />
                      <h3 className="text-lg font-medium text-gray-900">
                        Basic Information
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Product Name */}
                      <div className="md:col-span-2">
                        <label htmlFor="name" className="form-label required">
                          Product Name
                        </label>
                        <input
                          ref={nameInputRef}
                          type="text"
                          id="name"
                          className={`form-input ${errors.name ? "error" : ""}`}
                          value={formData.name}
                          onChange={(e) =>
                            handleInputChange("name", e.target.value)
                          }
                          placeholder="Enter product name"
                          maxLength={255}
                          required
                          disabled={isSubmitting}
                        />
                        {errors.name && (
                          <p className="form-error" role="alert">
                            {errors.name}
                          </p>
                        )}
                      </div>

                      {/* SKU */}
                      <div>
                        <label htmlFor="sku" className="form-label required">
                          SKU
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            id="sku"
                            className={`form-input pr-10 ${
                              errors.sku
                                ? "error"
                                : validationState.sku.isValid === true
                                ? "success"
                                : ""
                            } ${editMode ? "bg-gray-50" : ""}`}
                            value={formData.sku}
                            onChange={(e) =>
                              handleInputChange(
                                "sku",
                                e.target.value.toUpperCase()
                              )
                            }
                            placeholder="Enter SKU (e.g., ABC-123)"
                            maxLength={50}
                            required
                            disabled={isSubmitting || editMode}
                            readOnly={editMode}
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            {validationState.sku.isValidating ? (
                              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                            ) : validationState.sku.isValid === true ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : validationState.sku.isValid === false ? (
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            ) : null}
                          </div>
                        </div>
                        {errors.sku && (
                          <p className="form-error" role="alert">
                            {errors.sku}
                          </p>
                        )}
                        {editMode && (
                          <p className="text-sm text-gray-500 mt-1">
                            SKU cannot be modified for existing products
                          </p>
                        )}
                        {!editMode &&
                          validationState.sku.message &&
                          !errors.sku && (
                            <p
                              className={`text-sm mt-1 ${
                                validationState.sku.isValid
                                  ? "text-green-600"
                                  : "text-yellow-600"
                              }`}
                            >
                              {validationState.sku.message}
                            </p>
                          )}
                      </div>

                      {/* Category */}
                      <div>
                        <label
                          htmlFor="category"
                          className="form-label required"
                        >
                          Category
                        </label>
                        <select
                          id="category"
                          className={`form-input ${
                            errors.category ? "error" : ""
                          }`}
                          value={formData.category}
                          onChange={(e) =>
                            handleInputChange("category", e.target.value)
                          }
                          required
                          disabled={isSubmitting}
                        >
                          <option value="">Select a category</option>
                          {categoriesData?.categories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                        {errors.category && (
                          <p className="form-error" role="alert">
                            {errors.category}
                          </p>
                        )}
                      </div>

                      {/* Description */}
                      <div className="md:col-span-2">
                        <label htmlFor="description" className="form-label">
                          Description
                          <span className="text-sm text-gray-500 ml-1">
                            (Optional)
                          </span>
                        </label>
                        <textarea
                          id="description"
                          className={`form-input ${
                            errors.description ? "error" : ""
                          }`}
                          value={formData.description}
                          onChange={(e) =>
                            handleInputChange("description", e.target.value)
                          }
                          placeholder="Enter product description"
                          rows={3}
                          maxLength={1000}
                          disabled={isSubmitting}
                        />
                        <div className="flex justify-between items-center mt-1">
                          {errors.description ? (
                            <p className="form-error" role="alert">
                              {errors.description}
                            </p>
                          ) : (
                            <div />
                          )}
                          <span className="text-sm text-gray-500">
                            {formData.description.length}/1000
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Section */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                      <DollarSign className="w-5 h-5 text-gray-600" />
                      <h3 className="text-lg font-medium text-gray-900">
                        Pricing
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Cost Price */}
                      <div>
                        <label
                          htmlFor="cost_price"
                          className="form-label required"
                        >
                          Cost Price
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            id="cost_price"
                            className={`form-input pl-7 ${
                              errors.cost_price ? "error" : ""
                            }`}
                            value={formData.cost_price}
                            onChange={(e) =>
                              handleInputChange("cost_price", e.target.value)
                            }
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            required
                            disabled={isSubmitting}
                          />
                        </div>
                        {errors.cost_price && (
                          <p className="form-error" role="alert">
                            {errors.cost_price}
                          </p>
                        )}
                      </div>

                      {/* Sale Price */}
                      <div>
                        <label
                          htmlFor="sale_price"
                          className="form-label required"
                        >
                          Sale Price
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            id="sale_price"
                            className={`form-input pl-7 ${
                              errors.sale_price ? "error" : ""
                            }`}
                            value={formData.sale_price}
                            onChange={(e) =>
                              handleInputChange("sale_price", e.target.value)
                            }
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            required
                            disabled={isSubmitting}
                          />
                        </div>
                        {errors.sale_price && (
                          <p className="form-error" role="alert">
                            {errors.sale_price}
                          </p>
                        )}
                      </div>

                      {/* Reorder Point */}
                      <div>
                        <label
                          htmlFor="reorder_point"
                          className="form-label required"
                        >
                          Reorder Point
                        </label>
                        <input
                          type="number"
                          id="reorder_point"
                          className={`form-input ${
                            errors.reorder_point ? "error" : ""
                          }`}
                          value={formData.reorder_point}
                          onChange={(e) =>
                            handleInputChange("reorder_point", e.target.value)
                          }
                          placeholder="50"
                          min="0"
                          step="1"
                          required
                          disabled={isSubmitting}
                        />
                        {errors.reorder_point && (
                          <p className="form-error" role="alert">
                            {errors.reorder_point}
                          </p>
                        )}
                        <p className="text-sm text-gray-500 mt-1">
                          Minimum stock level before reordering
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Stock Management Section - Only show in create mode */}
                  {!editMode && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                        <Building2 className="w-5 h-5 text-gray-600" />
                        <h3 className="text-lg font-medium text-gray-900">
                          Stock Management
                        </h3>
                      </div>

                      <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                          Set initial stock levels for each warehouse location.
                          You can leave quantities at 0 and add stock later.
                        </p>

                        {warehousesData?.warehouses &&
                        warehousesData.warehouses.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {warehousesData.warehouses.map((warehouse) => (
                              <div
                                key={warehouse.id}
                                className="card card-compact border border-gray-200"
                              >
                                <div className="space-y-3">
                                  <div>
                                    <h4 className="font-medium text-gray-900">
                                      {warehouse.name}
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                      {warehouse.address}
                                    </p>
                                  </div>

                                  <div>
                                    <label
                                      htmlFor={`warehouse-${warehouse.id}`}
                                      className="form-label"
                                    >
                                      Initial Quantity
                                    </label>
                                    <input
                                      type="number"
                                      id={`warehouse-${warehouse.id}`}
                                      className={`form-input ${
                                        errors.warehouse_stock?.[warehouse.id]
                                          ? "error"
                                          : ""
                                      }`}
                                      value={
                                        formData.warehouse_stock[
                                          warehouse.id
                                        ] || "0"
                                      }
                                      onChange={(e) =>
                                        handleWarehouseStockChange(
                                          warehouse.id,
                                          e.target.value
                                        )
                                      }
                                      placeholder="0"
                                      min="0"
                                      step="1"
                                      disabled={isSubmitting}
                                    />
                                    {errors.warehouse_stock?.[warehouse.id] && (
                                      <p className="form-error" role="alert">
                                        {errors.warehouse_stock[warehouse.id]}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p>No warehouses available</p>
                          </div>
                        )}

                        {/* Stock Summary */}
                        {warehousesData?.warehouses && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-700">
                                Total Initial Stock:
                              </span>
                              <span className="text-lg font-semibold text-gray-900">
                                {Object.values(formData.warehouse_stock)
                                  .reduce(
                                    (sum, qty) => sum + (parseInt(qty) || 0),
                                    0
                                  )
                                  .toLocaleString()}
                              </span>
                            </div>
                            {Object.values(formData.warehouse_stock).every(
                              (qty) => (parseInt(qty) || 0) === 0
                            ) && (
                              <p className="text-sm text-yellow-600 mt-2 flex items-center">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                Consider adding initial stock to at least one
                                warehouse
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Image Section */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                      <ImageIcon className="w-5 h-5 text-gray-600" />
                      <h3 className="text-lg font-medium text-gray-900">
                        Image
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="image_url" className="form-label">
                          Image URL
                          <span className="text-sm text-gray-500 ml-1">
                            (Optional)
                          </span>
                        </label>
                        <div className="relative">
                          <input
                            type="url"
                            id="image_url"
                            className={`form-input pr-10 ${
                              errors.image_url
                                ? "error"
                                : validationState.image.isValid === true
                                ? "success"
                                : ""
                            }`}
                            value={formData.image_url}
                            onChange={(e) =>
                              handleInputChange("image_url", e.target.value)
                            }
                            placeholder="https://example.com/image.jpg"
                            disabled={isSubmitting}
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            {validationState.image.isValidating ? (
                              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                            ) : validationState.image.isValid === true ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : validationState.image.isValid === false ? (
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            ) : null}
                          </div>
                        </div>
                        {errors.image_url && (
                          <p className="form-error" role="alert">
                            {errors.image_url}
                          </p>
                        )}
                      </div>

                      {/* Image Preview */}
                      <div>
                        <label className="form-label">Preview</label>
                        <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                          {validationState.image.previewUrl ? (
                            <img
                              src={validationState.image.previewUrl}
                              alt="Product preview"
                              className="max-w-full max-h-full object-contain rounded"
                            />
                          ) : (
                            <div className="text-center text-gray-400">
                              <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                              <p className="text-sm">
                                Image preview will appear here
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 sm:p-6 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {hasUnsavedChanges && (
                  <>
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                    <span>You have unsaved changes</span>
                  </>
                )}
              </div>

              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn btn-outline flex-1 sm:flex-none"
                  disabled={isSubmitting}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn btn-outline flex-1 sm:flex-none"
                  disabled={isSubmitting || !hasUnsavedChanges}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  className="btn btn-primary flex-1 sm:flex-none"
                  disabled={isSubmitting || isLoading || !hasUnsavedChanges}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {editMode ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {editMode ? "Update Product" : "Create Product"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Unsaved Changes Warning Modal */}
      {showUnsavedWarning && (
        <div className="fixed inset-0 z-60 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50" />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-yellow-500" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Unsaved Changes
                </h3>
              </div>
              <p className="text-gray-600 mb-6">
                You have unsaved changes. Are you sure you want to close without
                saving?
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={cancelClose} className="btn btn-outline">
                  Continue Editing
                </button>
                <button onClick={confirmClose} className="btn btn-primary">
                  Discard Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductForm;
