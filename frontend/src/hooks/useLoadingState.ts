import { useState, useCallback } from "react";
import { useLoading } from "../contexts/AppContext";

interface UseLoadingStateOptions {
  component?: string;
  global?: boolean;
}

interface LoadingState {
  isLoading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  withLoading: <T>(promise: Promise<T>) => Promise<T>;
}

export const useLoadingState = (
  options: UseLoadingStateOptions = {}
): LoadingState => {
  const { component, global = false } = options;
  const { setGlobalLoading, setComponentLoading } = useLoading();

  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const setLoading = useCallback(
    (loading: boolean) => {
      if (global) {
        setGlobalLoading(loading);
      } else if (component) {
        setComponentLoading(component, loading);
      } else {
        setLocalLoading(loading);
      }
    },
    [global, component, setGlobalLoading, setComponentLoading]
  );

  const setError = useCallback((error: string | null) => {
    setLocalError(error);
  }, []);

  const clearError = useCallback(() => {
    setLocalError(null);
  }, []);

  const withLoading = useCallback(
    async <T>(promise: Promise<T>): Promise<T> => {
      setLoading(true);
      clearError();

      try {
        const result = await promise;
        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "An error occurred";
        setError(errorMessage);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, clearError]
  );

  return {
    isLoading: localLoading,
    error: localError,
    setLoading,
    setError,
    clearError,
    withLoading,
  };
};
