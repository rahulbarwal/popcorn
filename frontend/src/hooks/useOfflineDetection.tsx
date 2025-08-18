import React, { useState, useEffect, useCallback } from "react";
import { useNotifications } from "../contexts/AppContext";

export interface OfflineState {
  isOnline: boolean;
  isOffline: boolean;
  wasOffline: boolean;
  offlineDuration: number;
  lastOnlineTime: Date | null;
  lastOfflineTime: Date | null;
}

export interface OfflineOptions {
  checkInterval?: number;
  pingUrl?: string;
  pingTimeout?: number;
  showNotifications?: boolean;
  onOnline?: () => void;
  onOffline?: () => void;
}

export function useOfflineDetection(options: OfflineOptions = {}) {
  const {
    checkInterval = 30000, // 30 seconds
    pingUrl = "/api/health",
    pingTimeout = 5000,
    showNotifications = true,
    onOnline,
    onOffline,
  } = options;

  const { addNotification } = useNotifications();

  const [state, setState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    isOffline: !navigator.onLine,
    wasOffline: false,
    offlineDuration: 0,
    lastOnlineTime: navigator.onLine ? new Date() : null,
    lastOfflineTime: !navigator.onLine ? new Date() : null,
  });

  // Check network connectivity by pinging the server
  const checkConnectivity = useCallback(async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), pingTimeout);

      const response = await fetch(pingUrl, {
        method: "HEAD",
        cache: "no-cache",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }, [pingUrl, pingTimeout]);

  // Handle online/offline state changes
  const handleOnline = useCallback(() => {
    setState((prev) => {
      const now = new Date();
      const offlineDuration = prev.lastOfflineTime
        ? now.getTime() - prev.lastOfflineTime.getTime()
        : 0;

      return {
        ...prev,
        isOnline: true,
        isOffline: false,
        wasOffline: prev.isOffline,
        offlineDuration,
        lastOnlineTime: now,
      };
    });

    if (showNotifications && state.wasOffline) {
      addNotification({
        type: "success",
        message: "Connection restored",
        autoClose: true,
      });
    }

    onOnline?.();
  }, [showNotifications, state.wasOffline, addNotification, onOnline]);

  const handleOffline = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isOnline: false,
      isOffline: true,
      lastOfflineTime: new Date(),
    }));

    if (showNotifications) {
      addNotification({
        type: "warning",
        message: "You are offline. Some features may not work properly.",
        autoClose: false,
      });
    }

    onOffline?.();
  }, [showNotifications, addNotification, onOffline]);

  // Enhanced connectivity check that combines navigator.onLine with server ping
  const performConnectivityCheck = useCallback(async () => {
    const navigatorOnline = navigator.onLine;

    if (!navigatorOnline) {
      if (state.isOnline) {
        handleOffline();
      }
      return;
    }

    // If navigator says we're online, verify with server ping
    const serverReachable = await checkConnectivity();

    if (serverReachable && !state.isOnline) {
      handleOnline();
    } else if (!serverReachable && state.isOnline) {
      handleOffline();
    }
  }, [state.isOnline, checkConnectivity, handleOnline, handleOffline]);

  // Set up event listeners and periodic checks
  useEffect(() => {
    const handleWindowOnline = () => {
      // Don't immediately assume we're online, check server connectivity
      performConnectivityCheck();
    };

    const handleWindowOffline = () => {
      handleOffline();
    };

    // Listen to browser online/offline events
    window.addEventListener("online", handleWindowOnline);
    window.addEventListener("offline", handleWindowOffline);

    // Set up periodic connectivity checks
    const intervalId = setInterval(performConnectivityCheck, checkInterval);

    // Initial check
    performConnectivityCheck();

    return () => {
      window.removeEventListener("online", handleWindowOnline);
      window.removeEventListener("offline", handleWindowOffline);
      clearInterval(intervalId);
    };
  }, [performConnectivityCheck, handleOffline, checkInterval]);

  // Manual connectivity check
  const checkNow = useCallback(() => {
    return performConnectivityCheck();
  }, [performConnectivityCheck]);

  // Get formatted offline duration
  const getOfflineDurationText = useCallback(() => {
    if (!state.isOffline || !state.lastOfflineTime) {
      return "";
    }

    const duration = Date.now() - state.lastOfflineTime.getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }, [state.isOffline, state.lastOfflineTime]);

  return {
    ...state,
    checkNow,
    getOfflineDurationText,
  };
}

// Hook for handling offline-specific behavior
export function useOfflineBehavior() {
  const { isOffline } = useOfflineDetection();
  const [queuedActions, setQueuedActions] = useState<
    Array<() => Promise<void>>
  >([]);

  // Queue an action to be executed when back online
  const queueAction = useCallback(
    (action: () => Promise<void>) => {
      if (isOffline) {
        setQueuedActions((prev) => [...prev, action]);
        return false; // Action was queued
      }
      return true; // Action can be executed immediately
    },
    [isOffline]
  );

  // Execute all queued actions when back online
  useEffect(() => {
    if (!isOffline && queuedActions.length > 0) {
      const executeQueuedActions = async () => {
        for (const action of queuedActions) {
          try {
            await action();
          } catch (error) {
            console.error("Failed to execute queued action:", error);
          }
        }
        setQueuedActions([]);
      };

      executeQueuedActions();
    }
  }, [isOffline, queuedActions]);

  // Clear queued actions
  const clearQueue = useCallback(() => {
    setQueuedActions([]);
  }, []);

  return {
    isOffline,
    queuedActionsCount: queuedActions.length,
    queueAction,
    clearQueue,
  };
}

// Component for displaying offline status
export const OfflineIndicator: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  const { isOffline, getOfflineDurationText } = useOfflineDetection();

  if (!isOffline) {
    return null;
  }

  return (
    <div
      className={`bg-yellow-50 border-l-4 border-yellow-400 p-4 ${className}`}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-yellow-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-700">
            You're currently offline.{" "}
            {getOfflineDurationText() && `(${getOfflineDurationText()})`}
          </p>
        </div>
      </div>
    </div>
  );
};
