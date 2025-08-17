import React from "react";
import Breadcrumb from "../components/Breadcrumb";
import LoadingSpinner from "../components/LoadingSpinner";
import { Plus, Search, Filter } from "lucide-react";

const Products = () => {
  const breadcrumbItems = [
    { label: "Dashboard", href: "/" },
    { label: "Products", current: true },
  ];

  return (
    <main>
      <Breadcrumb items={breadcrumbItems} />

      <header className="flex-responsive mb-6">
        <div className="flex-1 min-w-0">
          <h1
            id="products-page-heading"
            className="text-2xl sm:text-3xl font-bold text-gray-900 truncate"
          >
            Products
          </h1>
        </div>
        <div className="flex-shrink-0">
          <button
            className="btn btn-primary w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Add new product to inventory"
            disabled
            aria-describedby="add-product-help"
          >
            <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
            <span className="hidden sm:inline">Add Product</span>
            <span className="sm:hidden">Add</span>
          </button>
          <div id="add-product-help" className="sr-only">
            This feature will be available in task 24
          </div>
        </div>
      </header>

      {/* Search and Filter Bar */}
      <section
        className="card space-responsive"
        aria-labelledby="search-filters-heading"
      >
        <h2 id="search-filters-heading" className="sr-only">
          Search and Filter Products
        </h2>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="product-search" className="sr-only">
              Search products by name, SKU, or category
            </label>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"
                aria-hidden="true"
              />
              <input
                id="product-search"
                type="text"
                placeholder="Search products by name, SKU, or category..."
                className="form-input pl-10"
                disabled
                aria-describedby="search-help"
              />
            </div>
            <p id="search-help" className="sr-only">
              Search functionality will be implemented in task 22. Enter product
              name, SKU, or category to filter results.
            </p>
          </div>
          <div
            className="flex flex-col sm:flex-row gap-2 lg:flex-shrink-0"
            role="group"
            aria-label="Filter options"
          >
            <button
              className="btn btn-outline w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              disabled
              aria-label="Filter products by category (coming soon)"
              aria-describedby="category-filter-help"
            >
              <Filter className="w-4 h-4 mr-2" aria-hidden="true" />
              Category
            </button>
            <div id="category-filter-help" className="sr-only">
              Category filtering will be available in task 22
            </div>
            <button
              className="btn btn-outline w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              disabled
              aria-label="Filter products by stock status (coming soon)"
              aria-describedby="stock-filter-help"
            >
              <Filter className="w-4 h-4 mr-2" aria-hidden="true" />
              Stock Status
            </button>
            <div id="stock-filter-help" className="sr-only">
              Stock status filtering will be available in task 22
            </div>
          </div>
        </div>
      </section>

      {/* Products Table Placeholder */}
      <section className="card" aria-labelledby="products-table-heading">
        <h2 id="products-table-heading" className="sr-only">
          Products Table
        </h2>
        <div className="table-responsive">
          <table
            className="min-w-full divide-y divide-gray-200"
            role="table"
            aria-label="Products inventory table"
            aria-describedby="products-page-heading"
          >
            <caption className="sr-only">
              Products inventory table showing product details including images,
              names, categories, pricing, stock levels, and warehouse
              distribution. This table will be fully implemented in task 21.
            </caption>
            <thead className="bg-gray-50">
              <tr role="row">
                <th
                  className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  scope="col"
                  id="image-col"
                >
                  Image
                </th>
                <th
                  className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  scope="col"
                  id="name-col"
                >
                  Name
                </th>
                <th
                  className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  scope="col"
                  id="category-col"
                >
                  Category
                </th>
                <th
                  className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  scope="col"
                  id="sale-price-col"
                >
                  Sale Price
                </th>
                <th
                  className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  scope="col"
                  id="cost-price-col"
                >
                  Cost Price
                </th>
                <th
                  className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  scope="col"
                  id="stock-col"
                >
                  Stock
                </th>
                <th
                  className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  scope="col"
                  id="warehouses-col"
                >
                  Warehouses
                </th>
                <th
                  className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  scope="col"
                  id="actions-col"
                >
                  <span className="sr-only">Actions</span>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td colSpan={8} className="px-3 sm:px-6 py-12 text-center">
                  <div role="status" aria-live="polite">
                    <LoadingSpinner text="Products table will be implemented in task 21" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section
        className="space-responsive"
        aria-labelledby="upcoming-features-heading"
      >
        <div className="card">
          <h2
            id="upcoming-features-heading"
            className="text-xl font-semibold text-gray-900 mb-4"
          >
            Products Management Features (Coming Soon)
          </h2>
          <ul
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-600"
            role="list"
            aria-label="Upcoming product management features"
          >
            <li>• Product table with sorting and pagination (Task 21)</li>
            <li>• Search and filtering functionality (Task 22)</li>
            <li>• Product detail modal (Task 23)</li>
            <li>• Add/Edit product form (Task 24)</li>
            <li>• Product deletion with confirmation (Task 26)</li>
            <li>• Supplier integration (Task 27)</li>
          </ul>
        </div>
      </section>
    </main>
  );
};

export default Products;
