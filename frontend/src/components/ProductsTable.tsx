import React, { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, Eye, Trash2, Package } from "lucide-react";
import { Product, SearchFilters } from "../types/api";
import { useProducts } from "../hooks/useApi";
import { useWarehouseFilter } from "../contexts/WarehouseFilterContext";
import LoadingSpinner from "./LoadingSpinner";
import { OptimizedImage } from "./OptimizedImage";

interface ProductsTableProps {
  onViewProduct?: (product: Product) => void;
  onDeleteProduct?: (product: Product) => void;
  searchFilters?: SearchFilters;
}

type SortField =
  | "name"
  | "category"
  | "sale_price"
  | "cost_price"
  | "total_quantity"
  | "warehouse_count";
type SortOrder = "asc" | "desc";

const ProductsTable: React.FC<ProductsTableProps> = ({
  onViewProduct,
  onDeleteProduct,
  searchFilters = {},
}) => {
  const { state } = useWarehouseFilter();
  const selectedWarehouse = state.selectedWarehouse;
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Combine filters with warehouse filter and pagination
  const filters = useMemo(
    () => ({
      ...searchFilters,
      warehouse_id: selectedWarehouse?.id,
      sort_by: sortField,
      sort_order: sortOrder,
      page: currentPage,
      limit: itemsPerPage,
    }),
    [searchFilters, selectedWarehouse, sortField, sortOrder, currentPage]
  );

  const { data, isLoading, error } = useProducts(filters);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronUp className="w-4 h-4 text-gray-400" />;
    }
    return sortOrder === "asc" ? (
      <ChevronUp className="w-4 h-4 text-blue-600" />
    ) : (
      <ChevronDown className="w-4 h-4 text-blue-600" />
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case "out_of_stock":
        return "text-red-600 bg-red-50";
      case "low_stock":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-green-600 bg-green-50";
    }
  };

  const getStockStatusText = (status: string) => {
    switch (status) {
      case "out_of_stock":
        return "Out of Stock";
      case "low_stock":
        return "Low Stock";
      default:
        return "In Stock";
    }
  };

  if (isLoading) {
    return (
      <div className="card">
        <LoadingSpinner text="Loading products..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div role="alert" className="error">
          <h3 className="font-semibold text-red-800 mb-2">
            Error Loading Products
          </h3>
          <p>{error.message}</p>
        </div>
      </div>
    );
  }

  if (!data?.products || data.products.length === 0) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Products Found
          </h3>
          <p className="text-gray-600 mb-4">
            {searchFilters.search ||
            searchFilters.category ||
            searchFilters.stock_filter !== "all"
              ? "No products match your current filters. Try adjusting your search criteria."
              : "Get started by adding your first product to the inventory."}
          </p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil((data.pagination?.total || 0) / itemsPerPage);

  return (
    <div className="card">
      {/* Table Header with Results Count */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Products</h2>
          <p className="text-sm text-gray-600">
            Showing {data.products.length} of {data.pagination?.total || 0}{" "}
            products
            {selectedWarehouse && ` in ${selectedWarehouse.name}`}
          </p>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="table-responsive">
        <table
          className="min-w-full divide-y divide-gray-200 table-mobile-stack"
          role="table"
          aria-label="Products inventory table"
        >
          <caption className="sr-only">
            Products inventory table showing product details including images,
            names, categories, pricing, stock levels, and warehouse
            distribution. Use column headers to sort data.
          </caption>

          <thead className="bg-gray-50">
            <tr role="row">
              <th
                className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                scope="col"
              >
                Image
              </th>

              <th
                className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                scope="col"
                onClick={() => handleSort("name")}
                onKeyDown={(e) => e.key === "Enter" && handleSort("name")}
                tabIndex={0}
                role="button"
                aria-label={`Sort by name ${
                  sortField === "name"
                    ? sortOrder === "asc"
                      ? "descending"
                      : "ascending"
                    : "ascending"
                }`}
              >
                <div className="flex items-center space-x-1">
                  <span>Name</span>
                  {getSortIcon("name")}
                </div>
              </th>

              <th
                className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                scope="col"
                onClick={() => handleSort("category")}
                onKeyDown={(e) => e.key === "Enter" && handleSort("category")}
                tabIndex={0}
                role="button"
                aria-label={`Sort by category ${
                  sortField === "category"
                    ? sortOrder === "asc"
                      ? "descending"
                      : "ascending"
                    : "ascending"
                }`}
              >
                <div className="flex items-center space-x-1">
                  <span>Category</span>
                  {getSortIcon("category")}
                </div>
              </th>

              <th
                className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                scope="col"
                onClick={() => handleSort("sale_price")}
                onKeyDown={(e) => e.key === "Enter" && handleSort("sale_price")}
                tabIndex={0}
                role="button"
                aria-label={`Sort by sale price ${
                  sortField === "sale_price"
                    ? sortOrder === "asc"
                      ? "descending"
                      : "ascending"
                    : "ascending"
                }`}
              >
                <div className="flex items-center space-x-1">
                  <span>Sale Price</span>
                  {getSortIcon("sale_price")}
                </div>
              </th>

              <th
                className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                scope="col"
                onClick={() => handleSort("cost_price")}
                onKeyDown={(e) => e.key === "Enter" && handleSort("cost_price")}
                tabIndex={0}
                role="button"
                aria-label={`Sort by cost price ${
                  sortField === "cost_price"
                    ? sortOrder === "asc"
                      ? "descending"
                      : "ascending"
                    : "ascending"
                }`}
              >
                <div className="flex items-center space-x-1">
                  <span>Cost Price</span>
                  {getSortIcon("cost_price")}
                </div>
              </th>

              <th
                className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                scope="col"
                onClick={() => handleSort("total_quantity")}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleSort("total_quantity")
                }
                tabIndex={0}
                role="button"
                aria-label={`Sort by stock ${
                  sortField === "total_quantity"
                    ? sortOrder === "asc"
                      ? "descending"
                      : "ascending"
                    : "ascending"
                }`}
              >
                <div className="flex items-center space-x-1">
                  <span>Stock</span>
                  {getSortIcon("total_quantity")}
                </div>
              </th>

              <th
                className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                scope="col"
                onClick={() => handleSort("warehouse_count")}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleSort("warehouse_count")
                }
                tabIndex={0}
                role="button"
                aria-label={`Sort by warehouses ${
                  sortField === "warehouse_count"
                    ? sortOrder === "asc"
                      ? "descending"
                      : "ascending"
                    : "ascending"
                }`}
              >
                <div className="flex items-center space-x-1">
                  <span>Warehouses</span>
                  {getSortIcon("warehouse_count")}
                </div>
              </th>

              <th
                className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                scope="col"
              >
                <span className="sr-only">Actions</span>
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {data.products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                {/* Product Image */}
                <td
                  className="px-3 sm:px-6 py-4 whitespace-nowrap"
                  data-label="Image"
                >
                  <div className="w-12 h-12 flex-shrink-0">
                    <OptimizedImage
                      src={product.image_url || ""}
                      alt={`${product.name} product image`}
                      className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                      fallbackClassName="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200"
                      fallbackContent={
                        <Package className="w-6 h-6 text-gray-400" />
                      }
                    />
                  </div>
                </td>

                {/* Product Name & SKU */}
                <td className="px-3 sm:px-6 py-4" data-label="Name">
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                      {product.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      SKU: {product.sku}
                    </div>
                  </div>
                </td>

                {/* Category */}
                <td
                  className="px-3 sm:px-6 py-4 whitespace-nowrap"
                  data-label="Category"
                >
                  <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                    {product.category}
                  </span>
                </td>

                {/* Sale Price */}
                <td
                  className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  data-label="Sale Price"
                >
                  {formatCurrency(product.sale_price)}
                </td>

                {/* Cost Price */}
                <td
                  className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  data-label="Cost Price"
                >
                  {formatCurrency(product.cost_price)}
                </td>

                {/* Stock */}
                <td
                  className="px-3 sm:px-6 py-4 whitespace-nowrap"
                  data-label="Stock"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      {product.total_quantity.toLocaleString()}
                    </span>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStockStatusColor(
                        product.stock_status
                      )}`}
                    >
                      {getStockStatusText(product.stock_status)}
                    </span>
                  </div>
                </td>

                {/* Warehouse Count */}
                <td
                  className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  data-label="Warehouses"
                >
                  {product.warehouse_count}{" "}
                  {product.warehouse_count === 1 ? "location" : "locations"}
                </td>

                {/* Actions */}
                <td
                  className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                  data-label="Actions"
                >
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    {onViewProduct && (
                      <button
                        onClick={() => onViewProduct(product)}
                        className="btn btn-sm btn-outline touch-target w-full sm:w-auto"
                        aria-label={`View details for ${product.name}`}
                      >
                        <Eye className="w-4 h-4" />
                        <span className="ml-1">View</span>
                      </button>
                    )}

                    {onDeleteProduct && (
                      <button
                        onClick={() => onDeleteProduct(product)}
                        className="btn btn-sm btn-outline text-red-600 hover:text-red-700 hover:border-red-300 touch-target w-full sm:w-auto"
                        aria-label={`Delete ${product.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="ml-1">Delete</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
          <div className="flex justify-between flex-1 sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="btn btn-outline"
              aria-label="Go to previous page"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700 flex items-center">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="btn btn-outline"
              aria-label="Go to next page"
            >
              Next
            </button>
          </div>

          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(
                    currentPage * itemsPerPage,
                    data.pagination?.total || 0
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium">
                  {data.pagination?.total || 0}
                </span>{" "}
                results
              </p>
            </div>

            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Go to previous page"
                >
                  Previous
                </button>

                {/* Page Numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === pageNum
                          ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                      }`}
                      aria-label={`Go to page ${pageNum}`}
                      aria-current={
                        currentPage === pageNum ? "page" : undefined
                      }
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Go to next page"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsTable;
