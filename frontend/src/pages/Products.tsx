import React, { useState } from "react";
import Breadcrumb from "../components/Breadcrumb";
import ProductsTable from "../components/ProductsTable";
import ProductSearchAndFilters from "../components/ProductSearchAndFilters";
import ProductDetailModal from "../components/ProductDetailModal";
import ProductDeleteConfirmation from "../components/ProductDeleteConfirmation";
import { Plus } from "lucide-react";
import { Product, ProductDetail, SearchFilters } from "../types/api";
import { useDeleteProduct, useProduct } from "../hooks/useApi";

const Products = () => {
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});

  // Hooks for delete functionality
  const deleteProductMutation = useDeleteProduct();
  const { data: productDetailForDelete } = useProduct(productToDelete?.id || 0);

  const breadcrumbItems = [
    { label: "Dashboard", href: "/" },
    { label: "Products", current: true },
  ];

  const handleAddProduct = () => {
    // TODO: Implement in task 24
    console.log("Add Product clicked - will be implemented in task 24");
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowProductDetail(true);
  };

  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;

    try {
      await deleteProductMutation.mutateAsync(productToDelete.id);
      setShowDeleteConfirm(false);
      setProductToDelete(null);
    } catch (error) {
      // Error is handled by the mutation hook
      console.error("Delete failed:", error);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setProductToDelete(null);
  };

  const handleFiltersChange = (filters: SearchFilters) => {
    setSearchFilters(filters);
  };

  const handleProductSelect = (product: Product) => {
    // When a product is selected from search suggestions, view it
    handleViewProduct(product);
  };

  const handleCloseProductDetail = () => {
    setShowProductDetail(false);
    setSelectedProduct(null);
  };

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
            onClick={handleAddProduct}
            className="btn btn-primary w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Add new product to inventory"
            aria-describedby="add-product-help"
          >
            <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
            <span className="hidden sm:inline">Add Product</span>
            <span className="sm:hidden">Add</span>
          </button>
          <div id="add-product-help" className="sr-only">
            Opens product creation form (will be implemented in task 24)
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
        <ProductSearchAndFilters
          onFiltersChange={handleFiltersChange}
          onProductSelect={handleProductSelect}
          showFilters={true}
        />
      </section>

      {/* Products Table */}
      <section aria-labelledby="products-table-heading">
        <h2 id="products-table-heading" className="sr-only">
          Products Table
        </h2>
        <ProductsTable
          onViewProduct={handleViewProduct}
          onDeleteProduct={handleDeleteProduct}
          searchFilters={searchFilters}
        />
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
            <li>• Product table with sorting and pagination (Task 21) ✓</li>
            <li>• Search and filtering functionality (Task 22) ✓</li>
            <li>• Product detail modal (Task 23) ✓</li>
            <li>• Add/Edit product form (Task 24)</li>
            <li>• Product deletion with confirmation (Task 26)</li>
            <li>• Supplier integration (Task 27)</li>
          </ul>
        </div>
      </section>

      {/* Product Detail Modal */}
      <ProductDetailModal
        productId={selectedProduct?.id || null}
        isOpen={showProductDetail}
        onClose={handleCloseProductDetail}
        onDeleteProduct={(product) => {
          setShowProductDetail(false);
          setSelectedProduct(null);
          handleDeleteProduct(product);
        }}
      />

      {/* Product Delete Confirmation Modal */}
      <ProductDeleteConfirmation
        product={productDetailForDelete || null}
        isOpen={showDeleteConfirm}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteProductMutation.isPending}
      />
    </main>
  );
};

export default Products;
