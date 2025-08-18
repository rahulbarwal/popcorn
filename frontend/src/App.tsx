import { Suspense, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProvider } from "./contexts/AppContext";
import { WarehouseFilterProvider } from "./contexts/WarehouseFilterContext";
import ErrorBoundary from "./components/ErrorBoundary";
import NotificationSystem from "./components/NotificationSystem";
import Layout from "./components/Layout";
import {
  LazyDashboard,
  LazyProducts,
  ComponentLoadingFallback,
  ComponentErrorFallback,
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
        return failureCount < 3;
      },
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  // Preload critical components on app start
  useEffect(() => {
    preloadCriticalComponents();
  }, []);

  return (
    <ErrorBoundary
      fallback={
        <ComponentErrorFallback
          error={new Error("App error")}
          resetError={() => window.location.reload()}
        />
      }
    >
      <AppProvider>
        <QueryClientProvider client={queryClient}>
          <WarehouseFilterProvider>
            <Router>
              <Layout>
                <Suspense fallback={<ComponentLoadingFallback />}>
                  <Routes>
                    <Route path="/" element={<LazyDashboard.Component />} />
                    <Route
                      path="/products"
                      element={<LazyProducts.Component />}
                    />
                  </Routes>
                </Suspense>
              </Layout>
              <NotificationSystem />
            </Router>
          </WarehouseFilterProvider>
        </QueryClientProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
