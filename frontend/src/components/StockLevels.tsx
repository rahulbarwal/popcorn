import React, { useState, useMemo } from "react";
import {
  Package,
  AlertTriangle,
  XCircle,
  ChevronUp,
  ChevronDown,
  Search,
  Filter,
  RefreshCw,
} from "lucide-react";
import { useStockLevels } from "../hooks/useApi";
import { useSelectedWarehouse } from "../contexts/WarehouseFilterContext";
import { Product, SearchFilters } from "../types/api";
import LoadingSpinner from "./LoadingSpinner";

// Types for sorting
type SortField =
  | "sku"
  | "name"
  | "category"
  | "total_quantity"
  | "stock_status";
type SortOrder = "asc" | "desc";

interface SortConfig {
  field: SortField;
  order: SortOrder;
}

// Stock status badge component
const StockStatusBadge: React.FC<{ product: Product }> = ({ product }) => {
  const getStatusConfig = () => {
    switch (product.stock_status) {
      case "out_of_stock":
        return {
          icon: <XCircle className="h-3 w-3" />,
          text: "Out of Stock",
          className: "bg-red-100 text-red-800 border-red-200",
        };
      case "low_stock":
        return {
          icon: <AlertTriangle className="h-3 w-3" />,
          text: "Low Stock",
          className: "bg-yellow-100 text-yellow-800 border-yellow-200",
        };
      default:
        return {
          icon: <Package className="h-3 w-3" />,
          text: "In Stock",
          className: "bg-green-100 text-green-800 border-green-200",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${config.className}`}
    >
      {config.icon}
      {config.text}
    </span>
  );
};

// Product image component with lazy loading
const ProductImage: React.FC<{ product: Product }> = ({ product }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
  };

  return (
    <div className="relative w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="sm" />
        </div>
      )}

      {product.image_url && !imageError ? (
        <img
          src={product.image_url}
          alt={product.name}
          className={`w-full h-full object-cover transition-opacity duration-200 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-200">
          <Package
            className="h-6 w-6 text-gray-400"
            data-testid="package-icon"
          />
        </div>
      )}
    </div>
  );
};

// Sortable table header component
const SortableHeader: React.FC<{
  field: SortField;
  label: string;
  sortConfig: SortConfig | null;
  onSort: (field: SortField) => void;
}> = ({ field, label, sortConfig, onSort }) => {
  const isActive = sortConfig?.field === field;
  const isAsc = isActive && sortConfig?.order === "asc";

  const getSortAriaLabel = () => {
    if (isActive) {
      return `${label}, currently sorted ${
        isAsc ? "ascending" : "descending"
      }. Click to sort ${isAsc ? "descending" : "ascending"}.`;
    }
    return `${label}, not sorted. Click to sort ascending.`;
  };

  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 text-left font-medium text-gray-900 hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
      aria-label={getSortAriaLabel()}
    >
      {label}
      <div className="flex flex-col" aria-hidden="true">
        <ChevronUp
          className={`h-3 w-3 ${
            isActive && isAsc ? "text-blue-600" : "text-gray-400"
          }`}
        />
        <ChevronDown
          className={`h-3 w-3 -mt-1 ${
            isActive && !isAsc ? "text-blue-600" : "text-gray-400"
          }`}
        />
      </div>
    </button>
  );
};

// Main StockLevels component
interface StockLevelsProps {
  showSearch?: boolean;
  showFilters?: boolean;
  maxItems?: number;
  onProductClick?: (product: Product) => void;
  className?: string;
}

const StockLevels: React.FC<StockLevelsProps> = ({
  showSearch = true,
  showFilters = true,
  maxItems,
  onProductClick,
  className = "",
}) => {
  const { selectedWarehouse, isAllWarehouses } = useSelectedWarehouse();

  // Local state for filters and sorting
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockFilter, setStockFilter] = useState<
    "all" | "low_stock" | "out_of_stock"
  >("all");
  const [quantityMin, setQuantityMin] = useState<string>("");
  const [quantityMax, setQuantityMax] = useState<string>("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({
    field: "name",
    order: "asc",
  });

  // Build filters for API call
  const filters: SearchFilters = useMemo(() => {
    const baseFilters: SearchFilters = {
      warehouse_id: isAllWarehouses ? undefined : selectedWarehouse?.id,
      limit: maxItems || 50,
      page: 1,
    };

    if (searchTerm.trim()) {
      baseFilters.search = searchTerm.trim();
    }

    if (categoryFilter) {
      baseFilters.category = categoryFilter;
    }

    if (stockFilter !== "all") {
      baseFilters.stock_filter = stockFilter;
    }

    if (quantityMin.trim() && !isNaN(Number(quantityMin))) {
      baseFilters.price_min = Number(quantityMin);
    }

    if (quantityMax.trim() && !isNaN(Number(quantityMax))) {
      baseFilters.price_max = Number(quantityMax);
    }

    if (sortConfig) {
      baseFilters.sort_by = sortConfig.field;
      baseFilters.sort_order = sortConfig.order;
    }

    return baseFilters;
  }, [
    searchTerm,
    categoryFilter,
    stockFilter,
    quantityMin,
    quantityMax,
    sortConfig,
    isAllWarehouses,
    selectedWarehouse?.id,
    maxItems,
  ]);

  // Fetch data
  const {
    data: stockData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useStockLevels(filters);

  // Handle sorting
  const handleSort = (field: SortField) => {
    setSortConfig((current) => {
      if (current?.field === field) {
        return {
          field,
          order: current.order === "asc" ? "desc" : "asc",
        };
      }
      return { field, order: "asc" };
    });
  };

  // Get unique categories for filter dropdown
  const categories = useMemo(() => {
    if (!stockData?.products) return [];
    const uniqueCategories = Array.from(
      new Set(stockData.products.map((p) => p.category))
    ).sort();
    return uniqueCategories;
  }, [stockData?.products]);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format number
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-US").format(value);
  };

  const products = stockData?.products || [];
  const hasProducts = products.length > 0;

  return (
    <section
      className={`space-y-4 ${className}`}
      aria-labelledby="stock-levels-heading"
    >
      {/* Header with search and filters */}
      {(showSearch || showFilters) && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Search input */}
            {showSearch && (
              <div className="relative flex-1 max-w-md">
                <label htmlFor="stock-search" className="sr-only">
                  Search products by SKU or name
                </label>
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
                  aria-hidden="true"
                />
                <input
                  id="stock-search"
                  type="text"
                  placeholder="Search by SKU or product name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  aria-describedby="search-help"
                />
                <div id="search-help" className="sr-only">
                  Enter product name or SKU to filter the stock levels table
                </div>
              </div>
            )}

            {/* Filters */}
            {showFilters && (
              <div
                className="flex gap-3"
                role="group"
                aria-label="Stock filters"
              >
                {/* Category filter */}
                <div>
                  <label htmlFor="category-filter" className="sr-only">
                    Filter by category
                  </label>
                  <select
                    id="category-filter"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    aria-describedby="category-filter-help"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <div id="category-filter-help" className="sr-only">
                    Filter products by their category
                  </div>
                </div>

                {/* Stock status filter */}
                <div>
                  <label htmlFor="stock-status-filter" className="sr-only">
                    Filter by stock status
                  </label>
                  <select
                    id="stock-status-filter"
                    value={stockFilter}
                    onChange={(e) =>
                      setStockFilter(
                        e.target.value as "all" | "low_stock" | "out_of_stock"
                      )
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    aria-describedby="stock-status-filter-help"
                  >
                    <option value="all">All Stock</option>
                    <option value="low_stock">Low Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                  <div id="stock-status-filter-help" className="sr-only">
                    Filter products by their current stock status
                  </div>
                </div>

                {/* Advanced filters toggle */}
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-expanded={showAdvancedFilters}
                  aria-controls="advanced-filters"
                  aria-label={`${
                    showAdvancedFilters ? "Hide" : "Show"
                  } advanced filters`}
                >
                  <Filter className="h-4 w-4" aria-hidden="true" />
                  Advanced
                </button>
              </div>
            )}
          </div>

          {/* Refresh button */}
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label={
              isRefetching
                ? "Refreshing stock levels..."
                : "Refresh stock levels"
            }
            title="Refresh stock levels"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            <span className="sr-only sm:not-sr-only">Refresh</span>
          </button>
        </div>
      )}

      {/* Advanced filters */}
      {showAdvancedFilters && showFilters && (
        <div
          id="advanced-filters"
          className="bg-gray-50 border border-gray-200 rounded-lg p-4"
          role="region"
          aria-labelledby="advanced-filters-heading"
        >
          <h4
            id="advanced-filters-heading"
            className="text-sm font-medium text-gray-900 mb-3"
          >
            Advanced Filters
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Quantity range filters */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Min Quantity
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={quantityMin}
                onChange={(e) => setQuantityMin(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Max Quantity
              </label>
              <input
                type="number"
                min="0"
                placeholder="∞"
                value={quantityMax}
                onChange={(e) => setQuantityMax(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
              />
            </div>

            {/* Clear advanced filters */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setQuantityMin("");
                  setQuantityMax("");
                }}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Clear Advanced
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner text="Loading stock levels..." />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <XCircle className="h-5 w-5" />
            <span className="font-medium">Error loading stock levels</span>
          </div>
          <p className="text-red-600 text-sm mt-1">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Stock levels table */}
      {!isLoading && !error && (
        <>
          {hasProducts ? (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table
                  className="w-full"
                  role="table"
                  aria-label="Stock levels table"
                  aria-describedby="stock-levels-heading"
                >
                  <caption className="sr-only">
                    Stock levels for {products.length} products.
                    {sortConfig &&
                      `Sorted by ${sortConfig.field} in ${sortConfig.order}ending order.`}
                    Use arrow keys to navigate and Enter to sort columns.
                  </caption>
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr role="row">
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        scope="col"
                        id="product-header"
                      >
                        Product
                      </th>
                      <th
                        className="px-6 py-3 text-left"
                        scope="col"
                        aria-sort={
                          sortConfig?.field === "sku"
                            ? sortConfig.order === "asc"
                              ? "ascending"
                              : "descending"
                            : "none"
                        }
                      >
                        <SortableHeader
                          field="sku"
                          label="SKU"
                          sortConfig={sortConfig}
                          onSort={handleSort}
                        />
                      </th>
                      <th
                        className="px-6 py-3 text-left"
                        scope="col"
                        aria-sort={
                          sortConfig?.field === "category"
                            ? sortConfig.order === "asc"
                              ? "ascending"
                              : "descending"
                            : "none"
                        }
                      >
                        <SortableHeader
                          field="category"
                          label="Category"
                          sortConfig={sortConfig}
                          onSort={handleSort}
                        />
                      </th>
                      <th
                        className="px-6 py-3 text-left"
                        scope="col"
                        aria-sort={
                          sortConfig?.field === "total_quantity"
                            ? sortConfig.order === "asc"
                              ? "ascending"
                              : "descending"
                            : "none"
                        }
                      >
                        <SortableHeader
                          field="total_quantity"
                          label="Quantity"
                          sortConfig={sortConfig}
                          onSort={handleSort}
                        />
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        scope="col"
                        id="value-header"
                      >
                        Value
                      </th>
                      <th
                        className="px-6 py-3 text-left"
                        scope="col"
                        aria-sort={
                          sortConfig?.field === "stock_status"
                            ? sortConfig.order === "asc"
                              ? "ascending"
                              : "descending"
                            : "none"
                        }
                      >
                        <SortableHeader
                          field="stock_status"
                          label="Status"
                          sortConfig={sortConfig}
                          onSort={handleSort}
                        />
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        scope="col"
                        id="locations-header"
                      >
                        Locations
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product, index) => (
                      <tr
                        key={product.id}
                        className={`hover:bg-gray-50 transition-colors ${
                          onProductClick
                            ? "cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                            : ""
                        } ${
                          product.stock_status === "out_of_stock"
                            ? "bg-red-50"
                            : product.stock_status === "low_stock"
                            ? "bg-yellow-50"
                            : ""
                        }`}
                        onClick={() => onProductClick?.(product)}
                        role={onProductClick ? "button" : "row"}
                        tabIndex={onProductClick ? 0 : undefined}
                        aria-label={
                          onProductClick
                            ? `View details for ${product.name}`
                            : undefined
                        }
                        aria-rowindex={index + 2} // +2 because header is row 1
                        onKeyDown={
                          onProductClick
                            ? (e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  onProductClick(product);
                                }
                              }
                            : undefined
                        }
                      >
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          headers="product-header"
                        >
                          <div className="flex items-center gap-3">
                            <ProductImage product={product} />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {product.name}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.sku}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <span
                            aria-label={`Quantity: ${formatNumber(
                              product.total_quantity
                            )} units`}
                          >
                            {formatNumber(product.total_quantity)}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                          headers="value-header"
                        >
                          <span
                            aria-label={`Value: ${formatCurrency(
                              product.total_value
                            )}`}
                          >
                            {formatCurrency(product.total_value)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StockStatusBadge product={product} />
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                          headers="locations-header"
                        >
                          <span
                            aria-label={`Available in ${
                              product.warehouse_count
                            } warehouse${
                              product.warehouse_count !== 1 ? "s" : ""
                            }`}
                          >
                            {product.warehouse_count} location
                            {product.warehouse_count !== 1 ? "s" : ""}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div
                className="md:hidden divide-y divide-gray-200"
                role="list"
                aria-label="Stock levels"
              >
                {products.map((product, index) => (
                  <div
                    key={product.id}
                    className={`p-4 ${
                      onProductClick
                        ? "cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                        : ""
                    } ${
                      product.stock_status === "out_of_stock"
                        ? "bg-red-50"
                        : product.stock_status === "low_stock"
                        ? "bg-yellow-50"
                        : "hover:bg-gray-50"
                    } transition-colors`}
                    onClick={() => onProductClick?.(product)}
                    role={onProductClick ? "button" : "listitem"}
                    tabIndex={onProductClick ? 0 : undefined}
                    aria-label={
                      onProductClick
                        ? `View details for ${product.name}`
                        : `Product ${index + 1}: ${product.name}`
                    }
                    onKeyDown={
                      onProductClick
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onProductClick(product);
                            }
                          }
                        : undefined
                    }
                  >
                    <div className="flex items-start gap-3">
                      <ProductImage product={product} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {product.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              SKU: {product.sku}
                            </p>
                          </div>
                          <StockStatusBadge product={product} />
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">Category:</span>
                            <span className="ml-1 text-gray-900">
                              {product.category}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Quantity:</span>
                            <span className="ml-1 font-medium text-gray-900">
                              {formatNumber(product.total_quantity)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Value:</span>
                            <span className="ml-1 text-gray-900">
                              {formatCurrency(product.total_value)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Locations:</span>
                            <span className="ml-1 text-gray-900">
                              {product.warehouse_count}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Empty state */
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No products found
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || categoryFilter || stockFilter !== "all"
                  ? "Try adjusting your search or filters to find products."
                  : "No products are currently in the inventory."}
              </p>
              {(searchTerm ||
                categoryFilter ||
                stockFilter !== "all" ||
                quantityMin ||
                quantityMax) && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setCategoryFilter("");
                    setStockFilter("all");
                    setQuantityMin("");
                    setQuantityMax("");
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {/* Results summary */}
          {hasProducts && stockData && (
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>
                Showing {products.length} of {stockData.pagination.total}{" "}
                products
              </span>
              {stockData.filters.warehouse_id && (
                <span>Filtered by warehouse: {selectedWarehouse?.name}</span>
              )}
            </div>
          )}
        </>
      )}

      {/* Live region for status updates */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {isLoading && "Loading stock levels..."}
        {error && `Error loading stock levels: ${error.message}`}
        {!isLoading &&
          !error &&
          hasProducts &&
          `Showing ${products.length} products`}
      </div>
    </section>
  );
};

export default StockLevels;
