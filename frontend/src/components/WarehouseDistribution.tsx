import React, { useState, useMemo } from "react";
import {
  MapPin,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Building,
  Users,
  DollarSign,
  BarChart3,
  ArrowUpDown,
  Target,
  Zap,
  Info,
} from "lucide-react";
import { useWarehouseDistribution } from "../hooks/useApi";
import { useSelectedWarehouse } from "../contexts/WarehouseFilterContext";
import LoadingSpinner from "./LoadingSpinner";
import {
  WarehouseDistribution as WarehouseDistributionType,
  ProductLocation,
} from "../types/api";

interface WarehouseDistributionProps {
  className?: string;
  maxItems?: number;
  showHeader?: boolean;
  showAnalysis?: boolean;
  showTransferSuggestions?: boolean;
  onWarehouseClick?: (warehouseId: number) => void;
  onProductClick?: (productId: number) => void;
  onTransferSuggestion?: (
    fromWarehouseId: number,
    toWarehouseId: number,
    productCount: number
  ) => void;
}

interface TransferSuggestion {
  fromWarehouse: WarehouseDistributionType;
  toWarehouse: WarehouseDistributionType;
  suggestedProducts: number;
  reason: string;
  priority: "low" | "medium" | "high";
}

interface CapacityInfo {
  warehouseId: number;
  utilizationPercentage: number;
  capacityStatus: "low" | "optimal" | "high" | "critical";
  recommendedAction?: string;
}

const WarehouseDistribution: React.FC<WarehouseDistributionProps> = ({
  className = "",
  maxItems,
  showHeader = true,
  showAnalysis = true,
  showTransferSuggestions = true,
  onWarehouseClick,
  onProductClick,
  onTransferSuggestion,
}) => {
  const { selectedWarehouse, isAllWarehouses } = useSelectedWarehouse();
  const [selectedDistribution, setSelectedDistribution] = useState<
    number | null
  >(null);
  const [viewMode, setViewMode] = useState<
    "distribution" | "comparison" | "analysis"
  >("distribution");

  const {
    data: distributionData,
    isLoading,
    error,
  } = useWarehouseDistribution(
    isAllWarehouses ? undefined : selectedWarehouse?.id
  );

  // Calculate stock imbalance indicators
  const calculateImbalanceScore = (
    distributions: WarehouseDistributionType[]
  ) => {
    if (distributions.length < 2) return 0;

    const totalProducts = distributions.reduce(
      (sum, dist) => sum + dist.total_products,
      0
    );
    const avgProducts = totalProducts / distributions.length;

    return distributions.reduce((maxDeviation, dist) => {
      const deviation =
        Math.abs(dist.total_products - avgProducts) / avgProducts;
      return Math.max(maxDeviation, deviation);
    }, 0);
  };

  const getImbalanceLevel = (score: number): "low" | "medium" | "high" => {
    if (score < 0.2) return "low";
    if (score < 0.5) return "medium";
    return "high";
  };

  const getImbalanceColor = (level: "low" | "medium" | "high") => {
    switch (level) {
      case "low":
        return "text-green-600 bg-green-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "high":
        return "text-red-600 bg-red-50";
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  // Calculate transfer suggestions based on distribution analysis
  const calculateTransferSuggestions = useMemo((): TransferSuggestion[] => {
    if (
      !distributionData?.distributions ||
      distributionData.distributions.length < 2
    ) {
      return [];
    }

    const distributions = distributionData.distributions;
    const suggestions: TransferSuggestion[] = [];

    // Find warehouses with high stock and low stock
    const avgProducts =
      distributions.reduce((sum, d) => sum + d.total_products, 0) /
      distributions.length;

    const highStockWarehouses = distributions.filter(
      (d) => d.total_products > avgProducts * 1.3
    );
    const lowStockWarehouses = distributions.filter(
      (d) => d.total_products < avgProducts * 0.7
    );

    // Generate suggestions
    highStockWarehouses.forEach((highStock) => {
      lowStockWarehouses.forEach((lowStock) => {
        const productDifference =
          highStock.total_products - lowStock.total_products;
        const suggestedTransfer = Math.floor(productDifference * 0.2); // Suggest transferring 20% of difference

        if (suggestedTransfer > 10) {
          // Only suggest if meaningful transfer
          let priority: "low" | "medium" | "high" = "low";
          let reason = "Balance stock distribution";

          if (lowStock.out_of_stock_count > 5) {
            priority = "high";
            reason = `Critical: ${lowStock.out_of_stock_count} products out of stock`;
          } else if (lowStock.low_stock_count > 10) {
            priority = "medium";
            reason = `${lowStock.low_stock_count} products running low`;
          }

          suggestions.push({
            fromWarehouse: highStock,
            toWarehouse: lowStock,
            suggestedProducts: suggestedTransfer,
            reason,
            priority,
          });
        }
      });
    });

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [distributionData]);

  // Calculate warehouse capacity and utilization
  const calculateCapacityInfo = useMemo((): CapacityInfo[] => {
    if (!distributionData?.distributions) return [];

    const distributions = distributionData.distributions;
    const maxProducts = Math.max(...distributions.map((d) => d.total_products));

    return distributions.map((dist) => {
      const utilizationPercentage =
        maxProducts > 0 ? (dist.total_products / maxProducts) * 100 : 0;

      let capacityStatus: "low" | "optimal" | "high" | "critical";
      let recommendedAction: string | undefined;

      if (utilizationPercentage < 30) {
        capacityStatus = "low";
        recommendedAction =
          "Consider consolidating inventory or increasing stock";
      } else if (utilizationPercentage < 70) {
        capacityStatus = "optimal";
      } else if (utilizationPercentage < 90) {
        capacityStatus = "high";
        recommendedAction = "Monitor capacity, consider expansion";
      } else {
        capacityStatus = "critical";
        recommendedAction = "Urgent: Redistribute stock or expand capacity";
      }

      return {
        warehouseId: dist.warehouse.id,
        utilizationPercentage,
        capacityStatus,
        recommendedAction,
      };
    });
  }, [distributionData]);

  const getCapacityColor = (
    status: "low" | "optimal" | "high" | "critical"
  ) => {
    switch (status) {
      case "low":
        return "text-blue-600 bg-blue-50";
      case "optimal":
        return "text-green-600 bg-green-50";
      case "high":
        return "text-yellow-600 bg-yellow-50";
      case "critical":
        return "text-red-600 bg-red-50";
    }
  };

  const getPriorityColor = (priority: "low" | "medium" | "high") => {
    switch (priority) {
      case "low":
        return "text-gray-600 bg-gray-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "high":
        return "text-red-600 bg-red-50";
    }
  };

  if (isLoading) {
    return (
      <div className={`${className}`}>
        {showHeader && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Building className="w-5 h-5 mr-2 text-gray-500" />
              Warehouse Distribution
            </h2>
          </div>
        )}
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner text="Loading warehouse distribution..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        {showHeader && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Building className="w-5 h-5 mr-2 text-gray-500" />
              Warehouse Distribution
            </h2>
          </div>
        )}
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-500">Failed to load warehouse distribution</p>
          <p className="text-sm text-gray-400 mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  const distributions = distributionData?.distributions || [];
  const displayDistributions = maxItems
    ? distributions.slice(0, maxItems)
    : distributions;

  // Calculate overall imbalance
  const imbalanceScore = calculateImbalanceScore(distributions);
  const imbalanceLevel = getImbalanceLevel(imbalanceScore);

  if (distributions.length === 0) {
    return (
      <div className={`${className}`}>
        {showHeader && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Building className="w-5 h-5 mr-2 text-gray-500" />
              Warehouse Distribution
            </h2>
          </div>
        )}
        <div className="text-center py-8">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No warehouse data available</p>
          <p className="text-sm text-gray-400 mt-1">
            {isAllWarehouses
              ? "No warehouses found in the system"
              : `No data for ${selectedWarehouse?.name}`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {showHeader && (
        <div className="space-y-4 mb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Building className="w-5 h-5 mr-2 text-gray-500" />
              Warehouse Distribution
            </h2>
            {distributions.length > 1 && (
              <div
                className={`px-2 py-1 rounded-full text-xs font-medium ${getImbalanceColor(
                  imbalanceLevel
                )}`}
              >
                {imbalanceLevel === "low" && "Balanced"}
                {imbalanceLevel === "medium" && "Moderate Imbalance"}
                {imbalanceLevel === "high" && "High Imbalance"}
              </div>
            )}
          </div>

          {/* View Mode Controls */}
          {showAnalysis && distributions.length > 1 && (
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("distribution")}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === "distribution"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Package className="w-4 h-4 mr-1 inline" />
                Distribution
              </button>
              <button
                onClick={() => setViewMode("comparison")}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === "comparison"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <BarChart3 className="w-4 h-4 mr-1 inline" />
                Comparison
              </button>
              <button
                onClick={() => setViewMode("analysis")}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === "analysis"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Target className="w-4 h-4 mr-1 inline" />
                Analysis
              </button>
            </div>
          )}
        </div>
      )}

      {/* Render based on view mode */}
      {viewMode === "distribution" && (
        <div className="space-y-4">
          {displayDistributions.map((distribution) => (
            <div
              key={distribution.warehouse.id}
              className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-md cursor-pointer ${
                selectedDistribution === distribution.warehouse.id
                  ? "border-blue-300 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => {
                setSelectedDistribution(
                  selectedDistribution === distribution.warehouse.id
                    ? null
                    : distribution.warehouse.id
                );
                onWarehouseClick?.(distribution.warehouse.id);
              }}
            >
              {/* Warehouse Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {distribution.warehouse.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {distribution.warehouse.address}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {distribution.low_stock_count > 0 && (
                    <div className="flex items-center text-yellow-600">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      <span className="text-xs font-medium">
                        {distribution.low_stock_count}
                      </span>
                    </div>
                  )}
                  {distribution.out_of_stock_count > 0 && (
                    <div className="flex items-center text-red-600">
                      <Package className="w-4 h-4 mr-1" />
                      <span className="text-xs font-medium">
                        {distribution.out_of_stock_count}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Warehouse Metrics */}
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div className="text-center">
                  <div className="flex items-center justify-center text-gray-400 mb-1">
                    <Package className="w-4 h-4 mr-1" />
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {distribution.total_products.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">Products</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center text-gray-400 mb-1">
                    <DollarSign className="w-4 h-4 mr-1" />
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatCurrency(distribution.total_value)}
                  </div>
                  <div className="text-xs text-gray-500">Value</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center text-gray-400 mb-1">
                    <Users className="w-4 h-4 mr-1" />
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {(
                      (distribution.total_products /
                        distributions.reduce(
                          (sum, d) => sum + d.total_products,
                          0
                        )) *
                      100
                    ).toFixed(1)}
                    %
                  </div>
                  <div className="text-xs text-gray-500">Share</div>
                </div>
              </div>

              {/* Stock Status Indicators */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-xs">
                      {distribution.total_products -
                        distribution.low_stock_count -
                        distribution.out_of_stock_count}{" "}
                      Adequate
                    </span>
                  </div>
                  {distribution.low_stock_count > 0 && (
                    <div className="flex items-center text-yellow-600">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                      <span className="text-xs">
                        {distribution.low_stock_count} Low
                      </span>
                    </div>
                  )}
                  {distribution.out_of_stock_count > 0 && (
                    <div className="flex items-center text-red-600">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                      <span className="text-xs">
                        {distribution.out_of_stock_count} Out
                      </span>
                    </div>
                  )}
                </div>

                {/* Expand/Collapse Indicator */}
                <div className="text-gray-400">
                  {selectedDistribution === distribution.warehouse.id ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                </div>
              </div>

              {/* Expanded Product Details */}
              {selectedDistribution === distribution.warehouse.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Product Breakdown ({distribution.products.length} items)
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {distribution.products.slice(0, 10).map((product) => (
                      <div
                        key={`${product.location_id}-${product.location_name}`}
                        className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Note: We don't have product_id in ProductLocation type,
                          // this would need to be added to the API response
                          // onProductClick?.(product.product_id);
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {product.location_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            Qty: {product.quantity.toLocaleString()} • Value:{" "}
                            {formatCurrency(product.value)}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {product.quantity === 0 && (
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          )}
                          {product.quantity > 0 && product.quantity < 50 && (
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          )}
                          {product.quantity >= 50 && (
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    ))}
                    {distribution.products.length > 10 && (
                      <div className="text-center py-2">
                        <span className="text-xs text-gray-500">
                          +{distribution.products.length - 10} more products
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Comparison View */}
      {viewMode === "comparison" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayDistributions.map((distribution) => {
              const capacityInfo = calculateCapacityInfo.find(
                (c) => c.warehouseId === distribution.warehouse.id
              );
              return (
                <div
                  key={distribution.warehouse.id}
                  className="border rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900 truncate">
                      {distribution.warehouse.name}
                    </h3>
                    {capacityInfo && (
                      <div
                        className={`px-2 py-1 rounded text-xs font-medium ${getCapacityColor(
                          capacityInfo.capacityStatus
                        )}`}
                      >
                        {capacityInfo.utilizationPercentage.toFixed(0)}%
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Products:</span>
                      <span className="font-medium">
                        {distribution.total_products.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Value:</span>
                      <span className="font-medium">
                        {formatCurrency(distribution.total_value)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Low Stock:</span>
                      <span
                        className={`font-medium ${
                          distribution.low_stock_count > 0
                            ? "text-yellow-600"
                            : "text-gray-900"
                        }`}
                      >
                        {distribution.low_stock_count}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Out of Stock:</span>
                      <span
                        className={`font-medium ${
                          distribution.out_of_stock_count > 0
                            ? "text-red-600"
                            : "text-gray-900"
                        }`}
                      >
                        {distribution.out_of_stock_count}
                      </span>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  {capacityInfo && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Capacity</span>
                        <span>
                          {capacityInfo.utilizationPercentage.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            capacityInfo.capacityStatus === "low"
                              ? "bg-blue-500"
                              : capacityInfo.capacityStatus === "optimal"
                              ? "bg-green-500"
                              : capacityInfo.capacityStatus === "high"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{
                            width: `${Math.min(
                              capacityInfo.utilizationPercentage,
                              100
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Analysis View */}
      {viewMode === "analysis" && (
        <div className="space-y-6">
          {/* Transfer Suggestions */}
          {showTransferSuggestions &&
            calculateTransferSuggestions.length > 0 && (
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                  <ArrowRightLeft className="w-4 h-4 mr-2 text-gray-500" />
                  Transfer Suggestions
                </h3>
                <div className="space-y-3">
                  {calculateTransferSuggestions
                    .slice(0, 5)
                    .map((suggestion, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-medium text-gray-900">
                                {suggestion.fromWarehouse.warehouse.name}
                              </span>
                              <ArrowRightLeft className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-900">
                                {suggestion.toWarehouse.warehouse.name}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600">
                              {suggestion.reason}
                            </p>
                          </div>
                          <div
                            className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(
                              suggestion.priority
                            )}`}
                          >
                            {suggestion.priority.toUpperCase()}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            Suggested transfer: {suggestion.suggestedProducts}{" "}
                            products
                          </span>
                          <button
                            onClick={() =>
                              onTransferSuggestion?.(
                                suggestion.fromWarehouse.warehouse.id,
                                suggestion.toWarehouse.warehouse.id,
                                suggestion.suggestedProducts
                              )
                            }
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Apply Suggestion
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

          {/* Capacity Analysis */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center">
              <BarChart3 className="w-4 h-4 mr-2 text-gray-500" />
              Capacity Analysis
            </h3>
            <div className="space-y-3">
              {calculateCapacityInfo.map((capacity) => {
                const warehouse = distributions.find(
                  (d) => d.warehouse.id === capacity.warehouseId
                );
                if (!warehouse) return null;

                return (
                  <div
                    key={capacity.warehouseId}
                    className="border rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">
                        {warehouse.warehouse.name}
                      </span>
                      <div
                        className={`px-2 py-1 rounded text-xs font-medium ${getCapacityColor(
                          capacity.capacityStatus
                        )}`}
                      >
                        {capacity.capacityStatus.toUpperCase()}
                      </div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>
                        Utilization: {capacity.utilizationPercentage.toFixed(1)}
                        %
                      </span>
                      <span>
                        {warehouse.total_products.toLocaleString()} products
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          capacity.capacityStatus === "low"
                            ? "bg-blue-500"
                            : capacity.capacityStatus === "optimal"
                            ? "bg-green-500"
                            : capacity.capacityStatus === "high"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{
                          width: `${Math.min(
                            capacity.utilizationPercentage,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                    {capacity.recommendedAction && (
                      <div className="flex items-start space-x-2">
                        <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-gray-600">
                          {capacity.recommendedAction}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Performance Metrics */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center">
              <Zap className="w-4 h-4 mr-2 text-gray-500" />
              Performance Metrics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-900">
                  {distributions
                    .reduce((sum, d) => sum + d.total_products, 0)
                    .toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Products</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(
                    distributions.reduce((sum, d) => sum + d.total_value, 0)
                  )}
                </div>
                <div className="text-sm text-gray-600">Total Value</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-900">
                  {(imbalanceScore * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Imbalance Score</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Suggestions Footer */}
      {distributions.length > 1 && imbalanceLevel !== "low" && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <ArrowRightLeft className="w-4 h-4 text-blue-600 mr-2" />
            <span className="text-sm text-blue-800 font-medium">
              Stock Rebalancing Suggested
            </span>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            Consider transferring stock between warehouses to optimize
            distribution
          </p>
        </div>
      )}

      {maxItems && distributions.length > maxItems && (
        <div className="mt-4 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View All {distributions.length} Warehouses
          </button>
        </div>
      )}
    </div>
  );
};

export default WarehouseDistribution;
