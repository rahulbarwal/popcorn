import { useNavigate } from "react-router-dom";
import Breadcrumb from "../components/Breadcrumb";
import LoadingSpinner from "../components/LoadingSpinner";
import WarehouseFilter from "../components/WarehouseFilter";
import SummaryMetrics from "../components/SummaryMetrics";
import StockLevels from "../components/StockLevels";
import { useNotifications } from "../contexts/AppContext";
import { useSelectedWarehouse } from "../contexts/WarehouseFilterContext";
import { navigateToMetricDetails } from "../utils/navigation";

const Dashboard = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const { selectedWarehouse, isAllWarehouses } = useSelectedWarehouse();

  // Demo function to test notifications
  const testNotification = () => {
    addNotification({
      type: "success",
      message: "Dashboard loaded successfully!",
    });
  };

  const breadcrumbItems = [{ label: "Dashboard", current: true }];

  return (
    <div>
      <Breadcrumb items={breadcrumbItems} />

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          {!isAllWarehouses && selectedWarehouse && (
            <p className="text-sm text-gray-600 mt-1">
              Showing data for:{" "}
              <span className="font-medium">{selectedWarehouse.name}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="sm:hidden">
            <WarehouseFilter size="sm" showLabel={false} />
          </div>
          <button
            onClick={testNotification}
            className="btn btn-secondary text-sm"
          >
            Test Notification
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="mb-8">
        <SummaryMetrics
          onMetricClick={(metric) => {
            const warehouseId = isAllWarehouses
              ? undefined
              : selectedWarehouse?.id;
            navigateToMetricDetails(navigate, metric, {
              warehouse_id: warehouseId,
            });
          }}
        />
      </div>

      {/* Dashboard Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Stock Levels
          </h2>
          <StockLevels
            maxItems={10}
            onProductClick={(product) => {
              console.log("Product clicked:", product);
              // TODO: Navigate to product details or open modal
            }}
          />
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Purchases
          </h2>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner text="Recent purchases component will be implemented in task 12" />
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Warehouse Distribution
          </h2>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner text="Warehouse distribution component will be implemented in task 13" />
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Stock Visualization
          </h2>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner text="Stock visualization component will be implemented in task 19" />
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            ✅ Frontend Foundation Complete
          </h2>
          <div className="space-y-2 text-gray-600">
            <p>• React application with TypeScript configured</p>
            <p>• React Router for navigation</p>
            <p>• Context API for global state management</p>
            <p>• Error boundary and notification system</p>
            <p>• Responsive layout with mobile navigation</p>
            <p>• Loading states and error handling utilities</p>
            <p>• Base component structure ready for dashboard features</p>
            <p>
              • <strong>Global warehouse filter with persistent state</strong>
            </p>
            <p>
              • <strong>API client with retry logic and error handling</strong>
            </p>
            <p>
              •{" "}
              <strong>
                Custom hooks for data fetching and state management
              </strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
