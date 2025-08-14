import { useEffect } from "react";
import {
  Package,
  AlertTriangle,
  XCircle,
  Users,
  DollarSign,
  RefreshCw,
} from "lucide-react";
import { useSummaryMetrics } from "../hooks/useApi";
import { useSelectedWarehouse } from "../contexts/WarehouseFilterContext";
import { MetricValue, StockValueMetric } from "../types/api";
import LoadingSpinner from "./LoadingSpinner";

interface MetricCardProps {
  title: string;
  value: number | string;
  status: "normal" | "warning" | "critical";
  icon: React.ReactNode;
  loading?: boolean;
  error?: string;
  subtitle?: string;
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  status,
  icon,
  loading = false,
  error,
  subtitle,
  onClick,
}) => {
  const getStatusStyles = () => {
    switch (status) {
      case "critical":
        return {
          iconColor: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          textColor: "text-red-900",
        };
      case "warning":
        return {
          iconColor: "text-yellow-600",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          textColor: "text-yellow-900",
        };
      default:
        return {
          iconColor: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          textColor: "text-blue-900",
        };
    }
  };

  const styles = getStatusStyles();

  return (
    <div
      className={`card transition-all duration-200 hover:shadow-lg hover:shadow-gray-200/50 ${
        onClick ? "cursor-pointer hover:scale-[1.02] active:scale-[0.98]" : ""
      } ${styles.bgColor} ${
        styles.borderColor
      } border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`${styles.iconColor}`}>{icon}</div>
        </div>
        <div className="ml-3 sm:ml-4 flex-1 min-w-0">
          <h3 className="text-xs sm:text-sm font-medium text-gray-500 truncate">
            {title}
          </h3>
          {loading ? (
            <div className="flex items-center mt-1">
              <LoadingSpinner size="sm" />
              <span className="ml-2 text-xs sm:text-sm text-gray-500">
                Loading...
              </span>
            </div>
          ) : error ? (
            <div className="mt-1">
              <p className="text-xl sm:text-2xl font-bold text-red-600">-</p>
              <p className="text-xs sm:text-sm text-red-500 truncate">
                {error}
              </p>
            </div>
          ) : (
            <div className="mt-1">
              <p
                className={`text-xl sm:text-2xl font-bold ${styles.textColor} truncate`}
              >
                {value}
              </p>
              {subtitle && (
                <p className="text-xs sm:text-sm text-gray-500 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface SummaryMetricsProps {
  onMetricClick?: (metric: string) => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableNavigation?: boolean;
}

const SummaryMetrics: React.FC<SummaryMetricsProps> = ({
  onMetricClick,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
  enableNavigation = true,
}) => {
  const { selectedWarehouse, isAllWarehouses } = useSelectedWarehouse();
  const warehouseId = isAllWarehouses ? undefined : selectedWarehouse?.id;

  const {
    data: metricsData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useSummaryMetrics(warehouseId);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetch();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refetch]);

  const formatCurrency = (value: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-US").format(value);
  };

  const getMetricSubtitle = (metric: MetricValue, type: string) => {
    if (type === "low_stock" && metric.threshold) {
      return `Threshold: ${metric.threshold}`;
    }
    return undefined;
  };

  const getStockValueSubtitle = (metric: StockValueMetric) => {
    const parts = [];
    if (metric.excluded_products && metric.excluded_products > 0) {
      parts.push(`${metric.excluded_products} products excluded`);
    }
    return parts.length > 0 ? parts.join(", ") : undefined;
  };

  const handleMetricClick = (metricType: string) => {
    if (onMetricClick) {
      onMetricClick(metricType);
    }
  };

  const getNavigationProps = (metricType: string) => {
    if (!enableNavigation) return {};

    return {
      onClick: () => handleMetricClick(metricType),
      role: "button",
      tabIndex: 0,
      "aria-label": `View details for ${metricType.replace("_", " ")}`,
      title: `Click to view ${metricType.replace("_", " ")} details`,
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleMetricClick(metricType);
        }
      },
    };
  };

  const metrics = metricsData?.metrics;

  return (
    <div className="space-y-4">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Summary Metrics</h2>
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          title="Refresh metrics"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
        <MetricCard
          title="Total Products"
          value={
            metrics?.total_products
              ? formatNumber(metrics.total_products.value)
              : "-"
          }
          status={metrics?.total_products?.status || "normal"}
          icon={<Package className="h-6 w-6 sm:h-8 sm:w-8" />}
          loading={isLoading}
          error={error?.message}
          {...getNavigationProps("total_products")}
        />

        <MetricCard
          title="Low Stock"
          value={
            metrics?.low_stock ? formatNumber(metrics.low_stock.value) : "-"
          }
          status={metrics?.low_stock?.status || "normal"}
          icon={<AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8" />}
          loading={isLoading}
          error={error?.message}
          subtitle={
            metrics?.low_stock
              ? getMetricSubtitle(metrics.low_stock, "low_stock")
              : undefined
          }
          {...getNavigationProps("low_stock")}
        />

        <MetricCard
          title="Out of Stock"
          value={
            metrics?.out_of_stock
              ? formatNumber(metrics.out_of_stock.value)
              : "-"
          }
          status={metrics?.out_of_stock?.status || "normal"}
          icon={<XCircle className="h-6 w-6 sm:h-8 sm:w-8" />}
          loading={isLoading}
          error={error?.message}
          {...getNavigationProps("out_of_stock")}
        />

        <MetricCard
          title="Suppliers"
          value={
            metrics?.suppliers ? formatNumber(metrics.suppliers.value) : "-"
          }
          status={metrics?.suppliers?.status || "normal"}
          icon={<Users className="h-6 w-6 sm:h-8 sm:w-8" />}
          loading={isLoading}
          error={error?.message}
          {...getNavigationProps("suppliers")}
        />

        <MetricCard
          title="Total Stock Value"
          value={
            metrics?.total_stock_value
              ? formatCurrency(
                  metrics.total_stock_value.value,
                  metrics.total_stock_value.currency
                )
              : "-"
          }
          status={metrics?.total_stock_value?.status || "normal"}
          icon={<DollarSign className="h-6 w-6 sm:h-8 sm:w-8" />}
          loading={isLoading}
          error={error?.message}
          subtitle={
            metrics?.total_stock_value
              ? getStockValueSubtitle(metrics.total_stock_value)
              : undefined
          }
          {...getNavigationProps("total_stock_value")}
        />
      </div>

      {/* Last Updated Info */}
      {metricsData?.last_updated && (
        <div className="text-xs text-gray-500 text-center">
          Last updated: {new Date(metricsData.last_updated).toLocaleString()}
        </div>
      )}

      {/* Warehouse Filter Info */}
      {metricsData?.warehouse_filter && (
        <div className="text-xs text-gray-600 text-center bg-blue-50 px-3 py-2 rounded-md">
          Showing metrics for: {metricsData.warehouse_filter.name}
        </div>
      )}

      {/* Navigation Hint */}
      {enableNavigation && !isLoading && !error && (
        <div className="text-xs text-gray-400 text-center">
          Click on any metric card to view detailed information
        </div>
      )}
    </div>
  );
};

export default SummaryMetrics;
