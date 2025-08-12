const Products = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <button className="btn btn-primary">Add Product</button>
      </div>
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Products management will be implemented in future tasks
        </h2>
        <p className="text-gray-600">
          This is the foundation structure. The products table, search,
          filtering, and CRUD operations will be added in subsequent tasks.
        </p>
      </div>
    </div>
  );
};

export default Products;
