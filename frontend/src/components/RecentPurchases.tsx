import { useEffect, useState } from "react";
import {
  Package,
  Calendar,
  User,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
} from "lucide-react";
import { useRecentPurchases } from "../hooks/useApi";
import { useSelectedWarehouse } from "../contexts/WarehouseFilterContext";
import { PurchaseOrder } from "../types/api";
import LoadingSpinner from "./LoadingSpinner";

interface StatusBadgeProps {
  status: PurchaseOrder["status"];
  isOverdue?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, isOverdue }) => {
  const getStatusConfig = () => {
    if (isOverdue) {
      return {
        icon: <AlertCircle className="h-3 w-3" />,
        text: "Overdue",
        className: "bg-red-100 text-red-800 border-red-200",
      };
    }

    switch (status) {
      case "pending":
        return {
          icon: <Clock className="h-3 w-3" />,
          text: "Pending",
          className: "bg-yellow-100 text-yellow-800 border-yellow-200",
        };
      case "confirmed":
        return {
          icon: <CheckCircle className="h-3 w-3" />,
          text: "Confirmed",
          className: "bg-blue-100 text-blue-800 border-blue-200",
        };
      case "shipped":
        return {
          icon: <Truck className="h-3 w-3" />,
          text: "Shipped",
          className: "bg-purple-100 text-purple-800 border-purple-200",
        };
      case "delivered":
        return {
          icon: <CheckCircle className="h-3 w-3" />,
          text: "Delivered",
          className: "bg-green-100 text-green-800 border-green-200",
        };
      case "cancelled":
        return {
          icon: <XCircle className="h-3 w-3" />,
          text: "Cancelled",
          className: "bg-gray-100 text-gray-800 border-gray-200",
        };
      default:
        return {
          icon: <Clock className="h-3 w-3" />,
          text: status,
          className: "bg-gray-100 text-gray-800 border-gray-200",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${config.className}`}
    >
      {config.icon}
      {config.text}
    </span>
  );
};

interface PurchaseOrderRowProps {
  order: PurchaseOrder;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSupplierClick?: (supplierId: number) => void;
}

const PurchaseOrderRow: React.FC<PurchaseOrderRowProps> = ({
  order,
  isExpanded,
  onToggleExpand,
  onSupplierClick,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const isOverdue = () => {
    if (
      !order.expected_delivery_date ||
      order.status === "delivered" ||
      order.status === "cancelled"
    ) {
      return false;
    }
    const expectedDate = new Date(order.expected_delivery_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return expectedDate < today;
  };

  const overdue = isOverdue();

  return (
    <div
      className={`border rounded-lg transition-all duration-200 ${
        overdue
          ? "border-red-200 bg-red-50"
          : "border-gray-200 bg-white hover:bg-gray-50"
      }`}
    >
      {/* Main Order Row */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            {/* Order Number */}
            <div className="flex-shrink-0">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-gray-900 text-sm">
                  {order.po_number}
                </span>
              </div>
            </div>

            {/* Supplier */}
            <div className="flex-1 min-w-0">
              <button
                onClick={() => onSupplierClick?.(order.supplier.id)}
                className="flex items-center space-x-2 text-left hover:text-blue-600 transition-colors group"
                title={`View supplier: ${order.supplier.name}`}
              >
                <User className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
                <span className="text-sm text-gray-700 group-hover:text-blue-600 truncate">
                  {order.supplier.name}
                </span>
              </button>
            </div>

            {/* Order Date */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {formatDate(order.order_date)}
              </span>
            </div>

            {/* Status */}
            <div className="flex-shrink-0">
              <StatusBadge status={order.status} isOverdue={overdue} />
            </div>
          </div>

          {/* Expand Button */}
          <button
            onClick={onToggleExpand}
            className="ml-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title={isExpanded ? "Collapse details" : "Expand details"}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Quick Info Row */}
        <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>{order.product_count} products</span>
            <span className="font-medium">
              {formatCurrency(order.total_amount)}
            </span>
          </div>
          {order.expected_delivery_date && (
            <div className="flex items-center space-x-1">
              <span className="text-xs">Expected:</span>
              <span
                className={`text-xs ${
                  overdue ? "text-red-600 font-medium" : ""
                }`}
              >
                {formatDate(order.expected_delivery_date)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <div className="space-y-4">
            {/* Order Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Order Information
                </h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">PO Number:</span>{" "}
                    {order.po_number}
                  </div>
                  <div>
                    <span className="font-medium">Order Date:</span>{" "}
                    {formatDate(order.order_date)}
                  </div>
                  {order.expected_delivery_date && (
                    <div>
                      <span className="font-medium">Expected Delivery:</span>{" "}
                      <span
                        className={overdue ? "text-red-600 font-medium" : ""}
                      >
                        {formatDate(order.expected_delivery_date)}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Total Amount:</span>{" "}
                    {formatCurrency(order.total_amount)}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Supplier Information
                </h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Company:</span>{" "}
                    <button
                      onClick={() => onSupplierClick?.(order.supplier.id)}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {order.supplier.name}
                    </button>
                  </div>
                  {order.supplier.contact_name && (
                    <div>
                      <span className="font-medium">Contact:</span>{" "}
                      {order.supplier.contact_name}
                    </div>
                  )}
                  {order.supplier.email && (
                    <div>
                      <span className="font-medium">Email:</span>{" "}
                      <a
                        href={`mailto:${order.supplier.email}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {order.supplier.email}
                      </a>
                    </div>
                  )}
                  {order.supplier.phone && (
                    <div>
                      <span className="font-medium">Phone:</span>{" "}
                      <a
                        href={`tel:${order.supplier.phone}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {order.supplier.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Products List */}
            {order.products && order.products.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Products ({order.products.length})
                </h4>
                <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            SKU
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Qty
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Unit Price
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                          {order.products.some(
                            (p) => p.quantity_received !== undefined
                          ) && (
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Received
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {order.products.map((product, index) => (
                          <tr
                            key={`${product.product_id}-${index}`}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-3 py-2 text-sm text-gray-900">
                              {product.name}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-600">
                              {product.sku}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900 text-right">
                              {product.quantity}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900 text-right">
                              {formatCurrency(product.unit_price)}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900 text-right font-medium">
                              {formatCurrency(product.total_price)}
                            </td>
                            {order.products?.some(
                              (p) => p.quantity_received !== undefined
                            ) && (
                              <td className="px-3 py-2 text-sm text-gray-900 text-right">
                                {product.quantity_received ?? 0}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {order.notes && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Notes
                </h4>
                <p className="text-sm text-gray-600 bg-white p-3 rounded-md border border-gray-200">
                  {order.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface RecentPurchasesProps {
  maxItems?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onSupplierClick?: (supplierId: number) => void;
  showHeader?: boolean;
}

const RecentPurchases: React.FC<RecentPurchasesProps> = ({
  maxItems = 10,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
  onSupplierClick,
  showHeader = true,
}) => {
  const { selectedWarehouse, isAllWarehouses } = useSelectedWarehouse();
  const warehouseId = isAllWarehouses ? undefined : selectedWarehouse?.id;
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());

  const {
    data: purchasesData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useRecentPurchases(warehouseId);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetch();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refetch]);

  const toggleExpanded = (orderId: number) => {
    setExpandedOrders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const handleSupplierClick = (supplierId: number) => {
    if (onSupplierClick) {
      onSupplierClick(supplierId);
    }
  };

  const orders = purchasesData?.recent_orders?.slice(0, maxItems) || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {showHeader && (
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Purchases
            </h2>
          </div>
        )}
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner text="Loading recent purchases..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        {showHeader && (
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Purchases
            </h2>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              title="Retry loading"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        )}
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              Failed to load recent purchases
            </p>
            <p className="text-xs text-gray-500 mt-1">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Purchases
          </h2>
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
            title="Refresh purchases"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      )}

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="text-center py-8">
          <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">
            No recent purchase orders found
          </p>
          {!isAllWarehouses && selectedWarehouse && (
            <p className="text-xs text-gray-500 mt-1">
              for {selectedWarehouse.name}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <PurchaseOrderRow
              key={order.id}
              order={order}
              isExpanded={expandedOrders.has(order.id)}
              onToggleExpand={() => toggleExpanded(order.id)}
              onSupplierClick={handleSupplierClick}
            />
          ))}
        </div>
      )}

      {/* Footer Info */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div>
          {orders.length > 0 && (
            <span>
              Showing {orders.length} of{" "}
              {purchasesData?.recent_orders?.length || 0} recent orders
            </span>
          )}
        </div>
        {purchasesData?.warehouse_filter && (
          <div className="text-right">
            <span>Filtered by: {purchasesData.warehouse_filter.name}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentPurchases;
