import React, { Component, ErrorInfo, ReactNode } from "react";
import {
  AlertTriangle,
  RefreshCw,
  Home,
  Bug,
  Wifi,
  WifiOff,
} from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: "page" | "component" | "critical";
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

// Enhanced Error Boundary with better error reporting and recovery
export class EnhancedErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: "",
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Report error to external service in production
    this.reportError(error, errorInfo);

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error details
    console.error("ErrorBoundary caught an error:", {
      error,
      errorInfo,
      errorId: this.state.errorId,
      level: this.props.level,
      timestamp: new Date().toISOString(),
    });
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetKeys?.some((key, idx) => prevProps.resetKeys?.[idx] !== key)) {
        this.resetErrorBoundary();
      }
    }

    if (
      hasError &&
      resetOnPropsChange &&
      prevProps.children !== this.props.children
    ) {
      this.resetErrorBoundary();
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // In production, send error to monitoring service
    if (import.meta.env.PROD) {
      // Example: Send to error tracking service
      // errorTrackingService.captureException(error, {
      //   extra: errorInfo,
      //   tags: { level: this.props.level }
      // });
    }
  };

  private resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: "",
    });
  };

  private handleRetry = () => {
    this.resetErrorBoundary();
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  private handleReportBug = () => {
    const { error, errorInfo, errorId } = this.state;
    const errorReport = {
      errorId,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Copy error report to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2));
    alert("Error report copied to clipboard. Please share this with support.");
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { level = "component" } = this.props;
      const { error, errorInfo, errorId } = this.state;

      // Different UI based on error level
      if (level === "critical") {
        return (
          <div className="min-h-screen flex items-center justify-center bg-red-50">
            <div className="max-w-lg w-full bg-white rounded-lg shadow-xl p-8 border border-red-200">
              <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <div className="mt-6 text-center">
                <h1 className="text-2xl font-bold text-gray-900">
                  Critical Error
                </h1>
                <p className="mt-3 text-gray-600">
                  The application has encountered a critical error and cannot
                  continue. Please refresh the page or contact support if the
                  problem persists.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={this.handleReload}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reload Application
                  </button>
                  <button
                    onClick={this.handleReportBug}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <Bug className="w-4 h-4 mr-2" />
                    Report Bug
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      }

      if (level === "page") {
        return (
          <div className="min-h-96 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Page Error
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  This page encountered an error. You can try refreshing or go
                  back to the dashboard.
                </p>
                <div className="mt-6 flex justify-center space-x-3">
                  <button
                    onClick={this.handleRetry}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </button>
                  <button
                    onClick={this.handleGoHome}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Go to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      }

      // Component level error
      return (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                Component Error
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>This component failed to load properly.</p>
              </div>
              <div className="mt-4">
                <div className="-mx-2 -my-1.5 flex">
                  <button
                    onClick={this.handleRetry}
                    className="bg-red-50 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          </div>
          {import.meta.env.DEV && error && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-red-700">
                Error Details (Development)
              </summary>
              <pre className="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded overflow-auto max-h-40">
                {error.toString()}
                {errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Specialized error boundaries for different use cases
export const CriticalErrorBoundary: React.FC<{ children: ReactNode }> = ({
  children,
}) => (
  <EnhancedErrorBoundary level="critical">{children}</EnhancedErrorBoundary>
);

export const PageErrorBoundary: React.FC<{ children: ReactNode }> = ({
  children,
}) => <EnhancedErrorBoundary level="page">{children}</EnhancedErrorBoundary>;

export const ComponentErrorBoundary: React.FC<{
  children: ReactNode;
  componentName?: string;
}> = ({ children, componentName }) => (
  <EnhancedErrorBoundary
    level="component"
    onError={(error, errorInfo) => {
      console.error(
        `Error in ${componentName || "component"}:`,
        error,
        errorInfo
      );
    }}
  >
    {children}
  </EnhancedErrorBoundary>
);

// Network status component
export const NetworkStatus: React.FC = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-2 text-center z-50">
      <div className="flex items-center justify-center">
        <WifiOff className="w-4 h-4 mr-2" />
        <span className="text-sm font-medium">
          You're offline. Some features may not work properly.
        </span>
      </div>
    </div>
  );
};

export default EnhancedErrorBoundary;
