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
    <div>
      <Breadcrumb items={breadcrumbItems} />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <button className="btn btn-primary inline-flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search products by name, SKU, or category..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                disabled
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              className="btn btn-secondary inline-flex items-center"
              disabled
            >
              <Filter className="w-4 h-4 mr-2" />
              Category
            </button>
            <button
              className="btn btn-secondary inline-flex items-center"
              disabled
            >
              <Filter className="w-4 h-4 mr-2" />
              Stock Status
            </button>
          </div>
        </div>
      </div>

      {/* Products Table Placeholder */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sale Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Warehouses
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <LoadingSpinner text="Products table will be implemented in task 21" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Products Management Features (Coming Soon)
          </h2>
          <div className="space-y-2 text-gray-600">
            <p>• Product table with sorting and pagination (Task 21)</p>
            <p>• Search and filtering functionality (Task 22)</p>
            <p>• Product detail modal (Task 23)</p>
            <p>• Add/Edit product form (Task 24)</p>
            <p>• Product deletion with confirmation (Task 26)</p>
            <p>• Supplier integration (Task 27)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
