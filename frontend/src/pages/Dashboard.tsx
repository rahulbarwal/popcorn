const Dashboard = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Total Products
          </h3>
          <p className="text-3xl font-bold text-blue-600">-</p>
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Low Stock</h3>
          <p className="text-3xl font-bold text-yellow-600">-</p>
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Out of Stock
          </h3>
          <p className="text-3xl font-bold text-red-600">-</p>
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Suppliers</h3>
          <p className="text-3xl font-bold text-green-600">-</p>
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
      <div className="mt-8">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Dashboard components will be implemented in future tasks
          </h2>
          <p className="text-gray-600">
            This is the foundation structure. Components like stock levels,
            recent purchases, and warehouse distribution will be added in
            subsequent tasks.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
