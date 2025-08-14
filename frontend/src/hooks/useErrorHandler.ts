import { useCallback } from "react";
import { useNotifications, useErrors } from "../contexts/AppContext";
import { ApiError } from "../services/api";

interface ErrorHandlerOptions {
  component?: string;
  showNotification?: boolean;
  notificationType?: "error" | "warning";
  fallbackMessage?: string;
}

export const useErrorHandler = (options: ErrorHandlerOptions = {}) => {
  const { addNotification } = useNotifications();
  const { setComponentError, setGlobalError } = useErrors();

  const {
    component,
    showNotification = true,
    notificationType = "error",
    fallbackMessage = "An unexpected error occurred",
  } = options;

  const handleError = useCallback(
    (error: unknown, customMessage?: string) => {
      let errorMessage = fallbackMessage;
      let errorDetails: any = null;

      // Extract error message based on error type
      if (error instanceof ApiError) {
        errorMessage = error.message;
        errorDetails = error.data;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      // Use custom message if provided
      if (customMessage) {
        errorMessage = customMessage;
      }

      // Set error in context
      if (component) {
        setComponentError(component, errorMessage);
      } else {
        setGlobalError(errorMessage);
      }

      // Show notification if enabled
      if (showNotification) {
        addNotification({
          type: notificationType,
          message: errorMessage,
          autoClose: notificationType === "error" ? false : true, // Keep error notifications visible
        });
      }

      // Log error in development
      if (import.meta.env.DEV) {
        console.error("Error handled:", {
          message: errorMessage,
          originalError: error,
          details: errorDetails,
          component,
        });
      }

      return errorMessage;
    },
    [
      component,
      showNotification,
      notificationType,
      fallbackMessage,
      addNotification,
      setComponentError,
      setGlobalError,
    ]
  );

  const clearError = useCallback(() => {
    if (component) {
      setComponentError(component, null);
    } else {
      setGlobalError(null);
    }
  }, [component, setComponentError, setGlobalError]);

  const handleAsyncError = useCallback(
    async <T>(
      asyncFn: () => Promise<T>,
      customMessage?: string
    ): Promise<T | null> => {
      try {
        return await asyncFn();
      } catch (error) {
        handleError(error, customMessage);
        return null;
      }
    },
    [handleError]
  );

  return {
    handleError,
    clearError,
    handleAsyncError,
  };
};
