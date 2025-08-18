import React from "react";
import { ApiError } from "../services/api";

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
}

export interface RetryState {
  attempt: number;
  isRetrying: boolean;
  lastError: Error | null;
  canRetry: boolean;
}

// Default retry condition - retry on network errors and 5xx server errors
const defaultRetryCondition = (error: any): boolean => {
  if (error instanceof ApiError) {
    // Don't retry on client errors (4xx)
    if (error.status && error.status >= 400 && error.status < 500) {
      return false;
    }
    // Retry on server errors (5xx) and network errors
    return !error.status || error.status >= 500;
  }

  // Retry on network errors
  if (error.name === "NetworkError" || error.code === "NETWORK_ERROR") {
    return true;
  }

  // Don't retry on other errors by default
  return false;
};

// Calculate delay with exponential backoff and jitter
const calculateDelay = (
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  backoffFactor: number
): number => {
  const exponentialDelay = baseDelay * Math.pow(backoffFactor, attempt - 1);
  const jitter = Math.random() * 0.1 * exponentialDelay; // Add 10% jitter
  return Math.min(exponentialDelay + jitter, maxDelay);
};

// Generic retry function
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    retryCondition = defaultRetryCondition,
    onRetry,
  } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on last attempt or if retry condition fails
      if (attempt === maxAttempts || !retryCondition(error)) {
        throw error;
      }

      // Call onRetry callback
      if (onRetry) {
        onRetry(attempt, error);
      }

      // Wait before retrying
      const delay = calculateDelay(attempt, baseDelay, maxDelay, backoffFactor);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

// React hook for retry functionality
export function useRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): [() => Promise<T>, RetryState, () => void] {
  const [state, setState] = React.useState<RetryState>({
    attempt: 0,
    isRetrying: false,
    lastError: null,
    canRetry: true,
  });

  const { maxAttempts = 3, retryCondition = defaultRetryCondition } = options;

  const executeWithRetry = React.useCallback(async (): Promise<T> => {
    setState((prev) => ({
      ...prev,
      isRetrying: true,
      lastError: null,
    }));

    try {
      const result = await withRetry(fn, {
        ...options,
        onRetry: (attempt, error) => {
          setState((prev) => ({
            ...prev,
            attempt,
            lastError: error,
          }));
          options.onRetry?.(attempt, error);
        },
      });

      setState((prev) => ({
        ...prev,
        isRetrying: false,
        attempt: 0,
        canRetry: true,
      }));

      return result;
    } catch (error) {
      const canRetry = retryCondition(error) && state.attempt < maxAttempts;

      setState((prev) => ({
        ...prev,
        isRetrying: false,
        lastError: error as Error,
        canRetry,
      }));

      throw error;
    }
  }, [fn, options, maxAttempts, retryCondition, state.attempt]);

  const reset = React.useCallback(() => {
    setState({
      attempt: 0,
      isRetrying: false,
      lastError: null,
      canRetry: true,
    });
  }, []);

  return [executeWithRetry, state, reset];
}

// Specialized retry hooks for common scenarios
export function useApiRetry<T>(
  apiCall: () => Promise<T>,
  options: Omit<RetryOptions, "retryCondition"> = {}
) {
  return useRetry(apiCall, {
    ...options,
    retryCondition: defaultRetryCondition,
  });
}

export function useNetworkRetry<T>(
  networkCall: () => Promise<T>,
  options: Omit<RetryOptions, "retryCondition"> = {}
) {
  return useRetry(networkCall, {
    maxAttempts: 5,
    baseDelay: 2000,
    ...options,
    retryCondition: (error) => {
      // Retry on any network-related error
      return (
        error.name === "NetworkError" ||
        error.code === "NETWORK_ERROR" ||
        error.message?.includes("network") ||
        error.message?.includes("fetch")
      );
    },
  });
}

// Retry component for manual retry UI
interface RetryComponentProps {
  onRetry: () => void;
  isRetrying: boolean;
  error?: Error | null;
  canRetry?: boolean;
  className?: string;
}

export const RetryComponent: React.FC<RetryComponentProps> = ({
  onRetry,
  isRetrying,
  error,
  canRetry = true,
  className = "",
}) => {
  if (!error) {
    return null;
  }

  return (
    <div className={`text-center p-4 ${className}`}>
      <p className="text-sm text-gray-600 mb-3">
        {error.message || "Something went wrong"}
      </p>
      {canRetry && (
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRetrying ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
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
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Retrying...
            </>
          ) : (
            "Try Again"
          )}
        </button>
      )}
    </div>
  );
};
