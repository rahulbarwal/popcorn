import { useNavigate } from "react-router-dom";
import Breadcrumb from "../components/Breadcrumb";
import LoadingSpinner from "../components/LoadingSpinner";
import WarehouseFilter from "../components/WarehouseFilter";
import SummaryMetrics from "../components/SummaryMetrics";
import StockLevels from "../components/StockLevels";
import RecentPurchases from "../components/RecentPurchases";
import WarehouseDistribution from "../components/WarehouseDistribution";
import StockVisualization from "../components/StockVisualization";
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

      <div className="flex-responsive mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
            Dashboard
          </h1>
          {!isAllWarehouses && selectedWarehouse && (
            <p className="text-sm text-gray-600 mt-1 truncate">
              Showing data for:{" "}
              <span className="font-medium">{selectedWarehouse.name}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="md:hidden">
            <WarehouseFilter size="sm" showLabel={false} />
          </div>
          <button
            onClick={testNotification}
            className="btn btn-secondary btn-sm"
            aria-label="Test notification system"
          >
            <span className="hidden sm:inline">Test Notification</span>
            <span className="sm:hidden">Test</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="space-responsive">
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
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
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
          <RecentPurchases
            maxItems={5}
            onSupplierClick={(supplierId) => {
              console.log("Supplier clicked:", supplierId);
              // TODO: Navigate to supplier details or open modal
            }}
            showHeader={true}
          />
        </div>

        <div className="card xl:col-span-1">
          <WarehouseDistribution
            maxItems={3}
            onWarehouseClick={(warehouseId) => {
              console.log("Warehouse clicked:", warehouseId);
              // TODO: Navigate to warehouse details or apply warehouse filter
            }}
            onProductClick={(productId) => {
              console.log("Product clicked:", productId);
              // TODO: Navigate to product details or open modal
            }}
          />
        </div>

        <div className="card xl:col-span-1">
          <StockVisualization height={300} />
        </div>
      </div>

      <div className="space-responsive">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            ✅ Frontend Foundation Complete
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-600">
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
