import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Filter, RotateCcw } from "lucide-react";
import ProductSearch from "./ProductSearch";
import ProductFilters from "./ProductFilters";
import { SearchFilters, Product } from "../types/api";
import { useDebouncedSearch } from "../hooks/useDebounce";

interface ProductSearchAndFiltersProps {
  onFiltersChange: (filters: SearchFilters) => void;
  onProductSelect?: (product: Product) => void;
  className?: string;
  showFilters?: boolean;
}

const ProductSearchAndFilters: React.FC<ProductSearchAndFiltersProps> = ({
  onFiltersChange,
  onProductSelect,
  className = "",
  showFilters = true,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Initialize filters from URL parameters
  const [filters, setFilters] = useState<SearchFilters>(() => {
    const initialFilters: SearchFilters = {};

    // Extract filters from URL parameters
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const stockFilter = searchParams.get("stock_filter");
    const priceMin = searchParams.get("price_min");
    const priceMax = searchParams.get("price_max");
    const sortBy = searchParams.get("sort_by");
    const sortOrder = searchParams.get("sort_order");
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");

    if (search) initialFilters.search = search;
    if (category) initialFilters.category = category;
    if (stockFilter) initialFilters.stock_filter = stockFilter as any;
    if (priceMin) initialFilters.price_min = parseFloat(priceMin);
    if (priceMax) initialFilters.price_max = parseFloat(priceMax);
    if (sortBy) initialFilters.sort_by = sortBy;
    if (sortOrder) initialFilters.sort_order = sortOrder as "asc" | "desc";
    if (page) initialFilters.page = parseInt(page);
    if (limit) initialFilters.limit = parseInt(limit);

    return initialFilters;
  });

  const [searchValue, setSearchValue] = useState(filters.search || "");
  const { debouncedSearchValue } = useDebouncedSearch(searchValue, 500);

  // Update search filter when debounced value changes
  useEffect(() => {
    if (debouncedSearchValue !== filters.search) {
      handleFiltersChange({
        ...filters,
        search: debouncedSearchValue || undefined,
        page: 1, // Reset to first page when searching
      });
    }
  }, [debouncedSearchValue]);

  // Sync URL parameters with filters
  const updateUrlParams = useCallback(
    (newFilters: SearchFilters) => {
      const params = new URLSearchParams();

      Object.entries(newFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.set(key, value.toString());
        }
      });

      // Only update URL if parameters have changed
      const currentParams = searchParams.toString();
      const newParams = params.toString();

      if (currentParams !== newParams) {
        setSearchParams(params, { replace: true });
      }
    },
    [searchParams, setSearchParams]
  );

  const handleFiltersChange = useCallback(
    (newFilters: SearchFilters) => {
      setFilters(newFilters);
      updateUrlParams(newFilters);
      onFiltersChange(newFilters);
    },
    [onFiltersChange, updateUrlParams]
  );

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };

  const handleClearAll = () => {
    const clearedFilters: SearchFilters = {
      sort_by: filters.sort_by || "name",
      sort_order: filters.sort_order || "asc",
      limit: filters.limit || 20,
      page: 1,
    };

    setSearchValue("");
    setFilters(clearedFilters);
    updateUrlParams(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.category) count++;
    if (filters.stock_filter && filters.stock_filter !== "all") count++;
    if (filters.price_min !== undefined) count++;
    if (filters.price_max !== undefined) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Filter Header */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1">
          <ProductSearch
            value={searchValue}
            onChange={handleSearchChange}
            onProductSelect={onProductSelect}
            placeholder="Search products by name, SKU, or category..."
            showSuggestions={true}
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-2 lg:flex-shrink-0">
          {showFilters && (
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`btn btn-outline w-full sm:w-auto ${
                showFilterPanel ? "bg-blue-50 border-blue-300" : ""
              }`}
              aria-expanded={showFilterPanel}
              aria-controls="filter-panel"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-blue-600 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}

          {activeFilterCount > 0 && (
            <button
              onClick={handleClearAll}
              className="btn btn-outline w-full sm:w-auto text-red-600 hover:text-red-700 hover:border-red-300"
              aria-label="Clear all filters and search"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && showFilterPanel && (
        <div
          id="filter-panel"
          className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
        >
          <ProductFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </div>
      )}

      {/* Active Filters Summary (Mobile) */}
      {activeFilterCount > 0 && (
        <div className="lg:hidden">
          <div className="text-sm text-gray-600 mb-2">
            Active filters ({activeFilterCount}):
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.search && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Search: "{filters.search}"
              </span>
            )}
            {filters.category && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Category: {filters.category}
              </span>
            )}
            {filters.stock_filter && filters.stock_filter !== "all" && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Stock: {filters.stock_filter.replace("_", " ")}
              </span>
            )}
            {(filters.price_min !== undefined ||
              filters.price_max !== undefined) && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Price: ${filters.price_min || "0"} - ${filters.price_max || "∞"}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="text-sm text-gray-600">
        {activeFilterCount > 0 ? (
          <span>
            Showing filtered results
            {filters.search && ` for "${filters.search}"`}
          </span>
        ) : (
          <span>Showing all products</span>
        )}
      </div>
    </div>
  );
};

export default ProductSearchAndFilters;
