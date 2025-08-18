import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { api } from "../services/api";
import { StockVisualizationResponse } from "../types/api";
import { useSelectedWarehouse } from "../contexts/WarehouseFilterContext";
import LoadingSpinner from "./LoadingSpinner";
import { ErrorState } from "./ErrorStates";

interface StockVisualizationProps {
  className?: string;
  height?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface ChartDataPoint {
  productName: string;
  sku: string;
  [key: string]: string | number; // Dynamic warehouse data
}

const StockVisualization: React.FC<StockVisualizationProps> = ({
  className = "",
  height = 400,
  autoRefresh = false,
  refreshInterval = 30000, // 30 seconds
}) => {
  const [data, setData] = useState<StockVisualizationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { selectedWarehouse, isAllWarehouses } = useSelectedWarehouse();

  // Fetch stock visualization data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const warehouseId = isAllWarehouses ? undefined : selectedWarehouse?.id;
      const params = new URLSearchParams();

      if (warehouseId) {
        params.append("warehouse_id", warehouseId.toString());
      }

      const url = `/api/dashboard/stock-visualization${
        params.toString() ? "?" + params.toString() : ""
      }`;

      const response = await api.get<StockVisualizationResponse>(url);
      setData(response);
    } catch (err) {
      console.error("Error fetching stock visualization data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load chart data"
      );
    } finally {
      setLoading(false);
    }
  }, [selectedWarehouse, isAllWarehouses]);

  // Fetch data on component mount and when warehouse filter changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchData]);

  // Transform API data into format suitable for Recharts
  const transformDataForChart = (
    apiData: StockVisualizationResponse
  ): { chartData: ChartDataPoint[]; warehouses: string[] } => {
    const chartData: ChartDataPoint[] = [];
    const warehouseSet = new Set<string>();

    // Process each product
    apiData.chart_data.products.forEach((product) => {
      const dataPoint: ChartDataPoint = {
        productName: product.product_name,
        sku: product.sku,
      };

      // Add warehouse data to the product
      product.warehouses.forEach((warehouse) => {
        const warehouseKey = warehouse.warehouse_name;
        dataPoint[warehouseKey] = warehouse.quantity;
        warehouseSet.add(warehouseKey);
      });

      chartData.push(dataPoint);
    });

    return {
      chartData,
      warehouses: Array.from(warehouseSet).sort(),
    };
  };

  // Enhanced custom tooltip component with detailed information
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const product = data?.chart_data.products.find(
        (p) => p.product_name === label
      );

      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg max-w-xs">
          <div className="border-b border-gray-100 pb-2 mb-2">
            <p className="font-semibold text-gray-900 text-sm">{label}</p>
            {product && (
              <p className="text-xs text-gray-600">SKU: {product.sku}</p>
            )}
          </div>

          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-3 h-3 rounded flex-shrink-0"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs text-gray-700 truncate">
                    {entry.dataKey}
                  </span>
                </div>
                <span className="text-xs font-medium text-gray-900">
                  {entry.value.toLocaleString()} units
                </span>
              </div>
            ))}
          </div>

          {product && (
            <div className="border-t border-gray-100 pt-2 mt-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Total Stock:</span>
                <span className="font-medium text-gray-900">
                  {product.warehouses
                    .reduce((sum, w) => sum + w.quantity, 0)
                    .toLocaleString()}{" "}
                  units
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Warehouses:</span>
                <span className="font-medium text-gray-900">
                  {product.warehouses.length}
                </span>
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Loading state with brand styling
  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="mb-4">
          <div className="h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3"></div>
        </div>
        <div
          className="flex items-center justify-center bg-gray-50 rounded-lg"
          style={{ height }}
        >
          <LoadingSpinner text="Loading stock visualization..." />
        </div>
      </div>
    );
  }

  // Error state with retry functionality
  if (error) {
    return (
      <div className={`${className}`}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Stock Visualization
          </h3>
        </div>
        <ErrorState
          type="error"
          title="Failed to Load Chart"
          message={error}
          actions={[
            {
              label: "Retry",
              onClick: fetchData,
              variant: "primary",
            },
          ]}
        />
      </div>
    );
  }

  // Empty state with contextual messaging
  if (!data || data.chart_data.products.length === 0) {
    const emptyMessage = isAllWarehouses
      ? "No stock data available for visualization. Products may not have inventory or may be inactive."
      : `No stock data available for ${
          selectedWarehouse?.name || "selected warehouse"
        }. Try selecting a different warehouse or check if products have inventory.`;

    return (
      <div className={`${className}`}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Stock Visualization
          </h3>
          <p className="text-sm text-gray-600">
            {data?.filters.warehouse_name || "Loading..."}
          </p>
        </div>
        <ErrorState
          type="info"
          title="No Data Available"
          message={emptyMessage}
          actions={[
            {
              label: "Refresh",
              onClick: fetchData,
              variant: "secondary",
            },
          ]}
        />
      </div>
    );
  }

  const { chartData, warehouses } = transformDataForChart(data);

  return (
    <div className={`${className}`}>
      {/* Header with title and filter info */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">
            {data.chart_data.chart_config.title}
          </h3>
          <button
            onClick={fetchData}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200"
            title="Refresh chart data"
          >
            Refresh
          </button>
        </div>

        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-600">
            Showing data for:{" "}
            <span className="font-medium">{data.filters.warehouse_name}</span>
          </p>
          <p className="text-gray-500">
            {chartData.length} product{chartData.length !== 1 ? "s" : ""} •{" "}
            {warehouses.length} warehouse{warehouses.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Chart container with responsive design */}
      <div
        className="bg-white rounded-lg border border-gray-200 p-4"
        style={{ width: "100%", height }}
      >
        <ResponsiveContainer>
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 80,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f3f4f6"
              vertical={false}
            />
            <XAxis
              dataKey="productName"
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
              tick={{
                fontSize: 11,
                fill: "#6b7280",
                fontFamily: "Inter, system-ui, sans-serif",
              }}
              stroke="#d1d5db"
              tickLine={{ stroke: "#d1d5db" }}
            />
            <YAxis
              label={{
                value: data.chart_data.chart_config.y_axis_label,
                angle: -90,
                position: "insideLeft",
                style: {
                  textAnchor: "middle",
                  fill: "#6b7280",
                  fontSize: "12px",
                  fontFamily: "Inter, system-ui, sans-serif",
                },
              }}
              tick={{
                fontSize: 11,
                fill: "#6b7280",
                fontFamily: "Inter, system-ui, sans-serif",
              }}
              stroke="#d1d5db"
              tickLine={{ stroke: "#d1d5db" }}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
            />
            {warehouses.length > 1 && (
              <Legend
                wrapperStyle={{
                  paddingTop: "20px",
                  fontSize: "12px",
                  fontFamily: "Inter, system-ui, sans-serif",
                }}
              />
            )}

            {warehouses.map((warehouse, index) => {
              const color =
                data.chart_data.chart_config.color_palette[
                  index % data.chart_data.chart_config.color_palette.length
                ];

              return (
                <Bar
                  key={warehouse}
                  dataKey={warehouse}
                  fill={color}
                  name={warehouse}
                  radius={[3, 3, 0, 0]}
                />
              );
            })}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Footer with metadata */}
      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <span>
          Last updated: {new Date(data.last_updated).toLocaleString()}
        </span>
        {autoRefresh && (
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            Auto-refreshing every {Math.floor(refreshInterval / 1000)}s
          </span>
        )}
      </div>
    </div>
  );
};

export default StockVisualization;
