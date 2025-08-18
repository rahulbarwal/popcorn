import React, { useState, useEffect } from "react";
import { Filter, X, ChevronDown, DollarSign, Package } from "lucide-react";
import { SearchFilters } from "../types/api";
import { useProducts, useCategories } from "../hooks/useApi";

interface ProductFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  className?: string;
}

interface FilterCounts {
  all: number;
  in_stock: number;
  low_stock: number;
  out_of_stock: number;
}

interface PriceRange {
  min: string;
  max: string;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({
  filters,
  onFiltersChange,
  className = "",
}) => {
  const [categories, setCategories] = useState<string[]>([]);
  const [filterCounts, setFilterCounts] = useState<FilterCounts>({
    all: 0,
    in_stock: 0,
    low_stock: 0,
    out_of_stock: 0,
  });
  const [priceRange, setPriceRange] = useState<PriceRange>({
    min: filters.price_min?.toString() || "",
    max: filters.price_max?.toString() || "",
  });
  const [showPriceFilter, setShowPriceFilter] = useState(false);

  // Fetch categories and all products for counts
  const { data: categoriesData } = useCategories();
  const { data: allProductsData } = useProducts({
    limit: 1000, // Get a large number to capture all products for counts
  });

  // Set categories and calculate filter counts
  useEffect(() => {
    if (categoriesData?.categories) {
      setCategories(categoriesData.categories);
    }
  }, [categoriesData]);

  useEffect(() => {
    if (allProductsData?.products) {
      // Calculate filter counts
      const counts = allProductsData.products.reduce(
        (acc, product) => {
          acc.all++;
          switch (product.stock_status) {
            case "adequate":
              acc.in_stock++;
              break;
            case "low_stock":
              acc.low_stock++;
              break;
            case "out_of_stock":
              acc.out_of_stock++;
              break;
          }
          return acc;
        },
        { all: 0, in_stock: 0, low_stock: 0, out_of_stock: 0 }
      );
      setFilterCounts(counts);
    }
  }, [allProductsData]);

  const handleCategoryChange = (category: string) => {
    onFiltersChange({
      ...filters,
      category: category === "all" ? undefined : category,
    });
  };

  const handleStockFilterChange = (stockFilter: string) => {
    onFiltersChange({
      ...filters,
      stock_filter: stockFilter === "all" ? undefined : (stockFilter as any),
    });
  };

  const handlePriceRangeChange = (field: "min" | "max", value: string) => {
    const newPriceRange = { ...priceRange, [field]: value };
    setPriceRange(newPriceRange);

    // Only update filters if the value is a valid number or empty
    const numValue = value === "" ? undefined : parseFloat(value);
    if (value === "" || (!isNaN(numValue!) && numValue! >= 0)) {
      onFiltersChange({
        ...filters,
        [field === "min" ? "price_min" : "price_max"]: numValue,
      });
    }
  };

  const clearAllFilters = () => {
    setPriceRange({ min: "", max: "" });
    onFiltersChange({
      search: filters.search, // Keep search term
      warehouse_id: filters.warehouse_id, // Keep warehouse filter
      sort_by: filters.sort_by, // Keep sorting
      sort_order: filters.sort_order,
      page: filters.page,
      limit: filters.limit,
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.category) count++;
    if (filters.stock_filter && filters.stock_filter !== "all") count++;
    if (filters.price_min !== undefined) count++;
    if (filters.price_max !== undefined) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  const stockFilterOptions = [
    { value: "all", label: "All Products", count: filterCounts.all },
    { value: "in_stock", label: "In Stock", count: filterCounts.in_stock },
    { value: "low_stock", label: "Low Stock", count: filterCounts.low_stock },
    {
      value: "out_of_stock",
      label: "Out of Stock",
      count: filterCounts.out_of_stock,
    },
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {activeFilterCount} active
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none focus:underline"
            aria-label="Clear all filters"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Category Filter */}
        <div className="space-y-2">
          <label
            htmlFor="category-filter"
            className="block text-sm font-medium text-gray-700"
          >
            Category
          </label>
          <div className="relative">
            <select
              id="category-filter"
              value={filters.category || "all"}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="form-select appearance-none pr-10"
              aria-describedby="category-help"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <p id="category-help" className="sr-only">
            Filter products by category
          </p>
        </div>

        {/* Stock Status Filter */}
        <div className="space-y-2">
          <label
            htmlFor="stock-filter"
            className="block text-sm font-medium text-gray-700"
          >
            Stock Status
          </label>
          <div className="relative">
            <select
              id="stock-filter"
              value={filters.stock_filter || "all"}
              onChange={(e) => handleStockFilterChange(e.target.value)}
              className="form-select appearance-none pr-10"
              aria-describedby="stock-help"
            >
              {stockFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} ({option.count})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <p id="stock-help" className="sr-only">
            Filter products by stock status
          </p>
        </div>

        {/* Price Range Filter Toggle */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Price Range
          </label>
          <button
            onClick={() => setShowPriceFilter(!showPriceFilter)}
            className={`w-full btn btn-outline text-left justify-between ${
              showPriceFilter ? "bg-blue-50 border-blue-300" : ""
            }`}
            aria-expanded={showPriceFilter}
            aria-controls="price-range-controls"
          >
            <span className="flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              {filters.price_min !== undefined ||
              filters.price_max !== undefined
                ? `$${filters.price_min || "0"} - $${filters.price_max || "∞"}`
                : "Any Price"}
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                showPriceFilter ? "transform rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {/* Active Filters Summary */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Active Filters
          </label>
          <div className="flex flex-wrap gap-2">
            {filters.category && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Category: {filters.category}
                <button
                  onClick={() => handleCategoryChange("all")}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-600 focus:outline-none focus:bg-blue-200 focus:text-blue-600"
                  aria-label={`Remove category filter: ${filters.category}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.stock_filter && filters.stock_filter !== "all" && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Stock:{" "}
                {
                  stockFilterOptions.find(
                    (opt) => opt.value === filters.stock_filter
                  )?.label
                }
                <button
                  onClick={() => handleStockFilterChange("all")}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-green-400 hover:bg-green-200 hover:text-green-600 focus:outline-none focus:bg-green-200 focus:text-green-600"
                  aria-label="Remove stock status filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {(filters.price_min !== undefined ||
              filters.price_max !== undefined) && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Price: ${filters.price_min || "0"} - ${filters.price_max || "∞"}
                <button
                  onClick={() => {
                    setPriceRange({ min: "", max: "" });
                    onFiltersChange({
                      ...filters,
                      price_min: undefined,
                      price_max: undefined,
                    });
                  }}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-purple-400 hover:bg-purple-200 hover:text-purple-600 focus:outline-none focus:bg-purple-200 focus:text-purple-600"
                  aria-label="Remove price range filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {activeFilterCount === 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                <Package className="w-3 h-3 mr-1" />
                No filters applied
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Price Range Controls */}
      {showPriceFilter && (
        <div
          id="price-range-controls"
          className="bg-gray-50 p-4 rounded-lg border border-gray-200"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="price-min"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Minimum Price
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="price-min"
                  type="number"
                  min="0"
                  step="0.01"
                  value={priceRange.min}
                  onChange={(e) =>
                    handlePriceRangeChange("min", e.target.value)
                  }
                  placeholder="0.00"
                  className="form-input pl-10"
                  aria-describedby="price-min-help"
                />
              </div>
              <p id="price-min-help" className="sr-only">
                Enter minimum price to filter products
              </p>
            </div>
            <div>
              <label
                htmlFor="price-max"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Maximum Price
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="price-max"
                  type="number"
                  min="0"
                  step="0.01"
                  value={priceRange.max}
                  onChange={(e) =>
                    handlePriceRangeChange("max", e.target.value)
                  }
                  placeholder="No limit"
                  className="form-input pl-10"
                  aria-describedby="price-max-help"
                />
              </div>
              <p id="price-max-help" className="sr-only">
                Enter maximum price to filter products
              </p>
            </div>
          </div>
          <div className="mt-3 flex justify-end space-x-2">
            <button
              onClick={() => {
                setPriceRange({ min: "", max: "" });
                onFiltersChange({
                  ...filters,
                  price_min: undefined,
                  price_max: undefined,
                });
              }}
              className="btn btn-sm btn-outline"
            >
              Clear Price Filter
            </button>
            <button
              onClick={() => setShowPriceFilter(false)}
              className="btn btn-sm btn-primary"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductFilters;
