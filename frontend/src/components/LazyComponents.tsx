import { createLazyComponent } from "../utils/lazyLoading";

// Lazy load page components
export const LazyDashboard = createLazyComponent(
  () => import("../pages/Dashboard")
);

export const LazyProducts = createLazyComponent(
  () => import("../pages/Products")
);

// Lazy load heavy components
export const LazySummaryMetrics = createLazyComponent(
  () => import("./SummaryMetrics")
);

export const LazyStockLevels = createLazyComponent(
  () => import("./StockLevels")
);

export const LazyRecentPurchases = createLazyComponent(
  () => import("./RecentPurchases")
);

export const LazyWarehouseDistribution = createLazyComponent(
  () => import("./WarehouseDistribution")
);

// Preload critical components on app start
export function preloadCriticalComponents() {
  // Preload dashboard components since they're likely to be used first
  LazyDashboard.preload();
  LazySummaryMetrics.preload();

  // Preload other components after a short delay
  setTimeout(() => {
    LazyStockLevels.preload();
    LazyRecentPurchases.preload();
  }, 1000);

  // Preload remaining components after user interaction
  setTimeout(() => {
    LazyWarehouseDistribution.preload();
    LazyProducts.preload();
  }, 3000);
}

// Component loading fallback
export function ComponentLoadingFallback() {
  return (
    <div className="component-loading">
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
      <p>Loading component...</p>
    </div>
  );
}

// Component error fallback
export function ComponentErrorFallback({
  error,
  resetError,
}: {
  error: Error;
  resetError: () => void;
}) {
  return (
    <div className="component-error">
      <h3>Something went wrong</h3>
      <p>{error.message}</p>
      <button onClick={resetError} className="retry-button">
        Try Again
      </button>
    </div>
  );
}
