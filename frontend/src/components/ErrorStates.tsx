import React from "react";
import {
  AlertTriangle,
  RefreshCw,
  Wifi,
  WifiOff,
  Database,
  Search,
  Package,
  ShoppingCart,
  Users,
  Warehouse,
  TrendingUp,
  FileX,
  Clock,
  AlertCircle,
  Info,
} from "lucide-react";

export interface ErrorStateProps {
  type?: "error" | "warning" | "info";
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary";
    loading?: boolean;
  }>;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  type = "error",
  title,
  message,
  icon,
  actions = [],
  className = "",
}) => {
  const getTypeStyles = () => {
    switch (type) {
      case "warning":
        return {
          container: "bg-yellow-50 border-yellow-200",
          icon: "text-yellow-400",
          title: "text-yellow-800",
          message: "text-yellow-700",
        };
      case "info":
        return {
          container: "bg-blue-50 border-blue-200",
          icon: "text-blue-400",
          title: "text-blue-800",
          message: "text-blue-700",
        };
      default:
        return {
          container: "bg-red-50 border-red-200",
          icon: "text-red-400",
          title: "text-red-800",
          message: "text-red-700",
        };
    }
  };

  const styles = getTypeStyles();
  const defaultIcon =
    type === "warning" ? (
      <AlertTriangle />
    ) : type === "info" ? (
      <Info />
    ) : (
      <AlertCircle />
    );

  return (
    <div className={`rounded-md border p-4 ${styles.container} ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <div className={`h-5 w-5 ${styles.icon}`}>{icon || defaultIcon}</div>
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={`text-sm font-medium ${styles.title}`}>{title}</h3>
          )}
          {message && (
            <div className={`${title ? "mt-2" : ""} text-sm ${styles.message}`}>
              <p>{message}</p>
            </div>
          )}
          {actions.length > 0 && (
            <div className="mt-4">
              <div className="-mx-2 -my-1.5 flex flex-wrap gap-2">
                {actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.onClick}
                    disabled={action.loading}
                    className={`
                      inline-flex items-center rounded-md px-2 py-1.5 text-sm font-medium
                      focus:outline-none focus:ring-2 focus:ring-offset-2
                      ${
                        action.variant === "secondary"
                          ? `bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500`
                          : type === "warning"
                          ? `bg-yellow-100 text-yellow-800 hover:bg-yellow-200 focus:ring-yellow-600`
                          : type === "info"
                          ? `bg-blue-100 text-blue-800 hover:bg-blue-200 focus:ring-blue-600`
                          : `bg-red-100 text-red-800 hover:bg-red-200 focus:ring-red-600`
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    {action.loading && (
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    )}
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Specialized error components for common scenarios
export const NetworkError: React.FC<{
  onRetry?: () => void;
  isRetrying?: boolean;
}> = ({ onRetry, isRetrying = false }) => (
  <ErrorState
    type="error"
    title="Connection Error"
    message="Unable to connect to the server. Please check your internet connection and try again."
    icon={<WifiOff />}
    actions={
      onRetry
        ? [
            {
              label: "Try Again",
              onClick: onRetry,
              loading: isRetrying,
            },
          ]
        : []
    }
  />
);

export const DatabaseError: React.FC<{
  onRetry?: () => void;
  isRetrying?: boolean;
}> = ({ onRetry, isRetrying = false }) => (
  <ErrorState
    type="error"
    title="Database Error"
    message="There was a problem accessing the database. Please try again in a moment."
    icon={<Database />}
    actions={
      onRetry
        ? [
            {
              label: "Retry",
              onClick: onRetry,
              loading: isRetrying,
            },
          ]
        : []
    }
  />
);

export const TimeoutError: React.FC<{
  onRetry?: () => void;
  isRetrying?: boolean;
}> = ({ onRetry, isRetrying = false }) => (
  <ErrorState
    type="warning"
    title="Request Timeout"
    message="The request is taking longer than expected. Please try again."
    icon={<Clock />}
    actions={
      onRetry
        ? [
            {
              label: "Try Again",
              onClick: onRetry,
              loading: isRetrying,
            },
          ]
        : []
    }
  />
);

export const NotFoundError: React.FC<{
  resource?: string;
  onGoBack?: () => void;
  onRetry?: () => void;
}> = ({ resource = "resource", onGoBack, onRetry }) => (
  <ErrorState
    type="info"
    title="Not Found"
    message={`The ${resource} you're looking for doesn't exist or may have been removed.`}
    icon={<FileX />}
    actions={[
      ...(onGoBack
        ? [
            {
              label: "Go Back",
              onClick: onGoBack,
              variant: "secondary" as const,
            },
          ]
        : []),
      ...(onRetry
        ? [
            {
              label: "Refresh",
              onClick: onRetry,
            },
          ]
        : []),
    ]}
  />
);

// Empty state components
export interface EmptyStateProps {
  title: string;
  message: string;
  icon?: React.ReactNode;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary";
  }>;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  icon,
  actions = [],
  className = "",
}) => (
  <div className={`text-center py-12 ${className}`}>
    <div className="mx-auto h-12 w-12 text-gray-400 mb-4">{icon}</div>
    <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
    <p className="mt-1 text-sm text-gray-500">{message}</p>
    {actions.length > 0 && (
      <div className="mt-6 flex justify-center gap-3">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className={`
              inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md
              focus:outline-none focus:ring-2 focus:ring-offset-2
              ${
                action.variant === "secondary"
                  ? "border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500"
                  : "border-transparent text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
              }
            `}
          >
            {action.label}
          </button>
        ))}
      </div>
    )}
  </div>
);

// Specialized empty states
export const NoProductsFound: React.FC<{
  onAddProduct?: () => void;
  onClearFilters?: () => void;
  hasFilters?: boolean;
}> = ({ onAddProduct, onClearFilters, hasFilters = false }) => (
  <EmptyState
    title={hasFilters ? "No products match your filters" : "No products found"}
    message={
      hasFilters
        ? "Try adjusting your search criteria or filters to find what you're looking for."
        : "Get started by adding your first product to the inventory."
    }
    icon={<Package className="h-12 w-12" />}
    actions={[
      ...(hasFilters && onClearFilters
        ? [
            {
              label: "Clear Filters",
              onClick: onClearFilters,
              variant: "secondary" as const,
            },
          ]
        : []),
      ...(onAddProduct
        ? [
            {
              label: "Add Product",
              onClick: onAddProduct,
            },
          ]
        : []),
    ]}
  />
);

export const NoPurchaseOrdersFound: React.FC<{
  onCreateOrder?: () => void;
  hasFilters?: boolean;
}> = ({ onCreateOrder, hasFilters = false }) => (
  <EmptyState
    title={
      hasFilters ? "No orders match your criteria" : "No purchase orders found"
    }
    message={
      hasFilters
        ? "Try adjusting your date range or status filters."
        : "No recent purchase orders to display."
    }
    icon={<ShoppingCart className="h-12 w-12" />}
    actions={
      onCreateOrder
        ? [
            {
              label: "Create Order",
              onClick: onCreateOrder,
            },
          ]
        : []
    }
  />
);

export const NoSuppliersFound: React.FC<{ onAddSupplier?: () => void }> = ({
  onAddSupplier,
}) => (
  <EmptyState
    title="No suppliers found"
    message="Add suppliers to manage your procurement relationships."
    icon={<Users className="h-12 w-12" />}
    actions={
      onAddSupplier
        ? [
            {
              label: "Add Supplier",
              onClick: onAddSupplier,
            },
          ]
        : []
    }
  />
);

export const NoWarehousesFound: React.FC<{ onAddWarehouse?: () => void }> = ({
  onAddWarehouse,
}) => (
  <EmptyState
    title="No warehouses configured"
    message="Set up warehouse locations to track inventory distribution."
    icon={<Warehouse className="h-12 w-12" />}
    actions={
      onAddWarehouse
        ? [
            {
              label: "Add Warehouse",
              onClick: onAddWarehouse,
            },
          ]
        : []
    }
  />
);

export const NoSearchResults: React.FC<{
  searchTerm: string;
  onClearSearch?: () => void;
}> = ({ searchTerm, onClearSearch }) => (
  <EmptyState
    title="No results found"
    message={`No items match "${searchTerm}". Try a different search term.`}
    icon={<Search className="h-12 w-12" />}
    actions={
      onClearSearch
        ? [
            {
              label: "Clear Search",
              onClick: onClearSearch,
              variant: "secondary",
            },
          ]
        : []
    }
  />
);

export const NoDataAvailable: React.FC<{
  dataType?: string;
  onRefresh?: () => void;
}> = ({ dataType = "data", onRefresh }) => (
  <EmptyState
    title={`No ${dataType} available`}
    message={`There is currently no ${dataType} to display.`}
    icon={<TrendingUp className="h-12 w-12" />}
    actions={
      onRefresh
        ? [
            {
              label: "Refresh",
              onClick: onRefresh,
            },
          ]
        : []
    }
  />
);
