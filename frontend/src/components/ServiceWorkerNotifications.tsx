import React from "react";
import {
  useOnlineStatus,
  ServiceWorkerUpdateProps,
} from "../utils/serviceWorker";

/**
 * Service worker update notification component
 */
export function ServiceWorkerUpdateNotification({
  registration,
  onUpdate,
  onDismiss,
}: ServiceWorkerUpdateProps) {
  const handleUpdate = () => {
    if (registration.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
      window.location.reload();
    }
    onUpdate();
  };

  return (
    <div className="sw-update-notification">
      <div className="sw-update-content">
        <p>A new version of the app is available!</p>
        <div className="sw-update-actions">
          <button onClick={handleUpdate} className="sw-update-button">
            Update Now
          </button>
          <button onClick={onDismiss} className="sw-dismiss-button">
            Later
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Offline notification component
 */
export function OfflineNotification() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="offline-notification">
      <div className="offline-content">
        <span className="offline-icon">📡</span>
        <p>You're currently offline. Some features may be limited.</p>
      </div>
    </div>
  );
}
