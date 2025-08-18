import { Suspense, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProvider } from "./contexts/AppContext";
import { WarehouseFilterProvider } from "./contexts/WarehouseFilterContext";
import {
  CriticalErrorBoundary,
  PageErrorBoundary,
  NetworkStatus,
} from "./components/ErrorBoundaries";
import { OfflineIndicator } from "./hooks/useOfflineDetection";
import NotificationSystem from "./components/NotificationSystem";
import Layout from "./components/Layout";
import {
  LazyDashboard,
  LazyProducts,
  ComponentLoadingFallback,
  preloadCriticalComponents,
} from "./components/LazyComponents";
import "./App.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Don't retry if offline
        if (!navigator.onLine) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry mutations on client errors or when offline
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        if (!navigator.onLine) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

function App() {
  // Preload critical components on app start
  useEffect(() => {
    preloadCriticalComponents();
  }, []);

  return (
    <CriticalErrorBoundary>
      <AppProvider>
        <QueryClientProvider client={queryClient}>
          <WarehouseFilterProvider>
            <Router>
              <NetworkStatus />
              <OfflineIndicator className="sticky top-0 z-50" />
              <Layout>
                <PageErrorBoundary>
                  <Suspense fallback={<ComponentLoadingFallback />}>
                    <Routes>
                      <Route path="/" element={<LazyDashboard.Component />} />
                      <Route
                        path="/products"
                        element={<LazyProducts.Component />}
                      />
                    </Routes>
                  </Suspense>
                </PageErrorBoundary>
              </Layout>
              <NotificationSystem />
            </Router>
          </WarehouseFilterProvider>
        </QueryClientProvider>
      </AppProvider>
    </CriticalErrorBoundary>
  );
}

export default App;
