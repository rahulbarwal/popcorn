import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "./utils/serviceWorker";

// Initialize accessibility development tools
if (process.env.NODE_ENV === "development") {
  import("./utils/devA11y").then(({ initA11yDevTools }) => {
    initA11yDevTools();
  });
}

// Register service worker for caching and offline support
registerServiceWorker({
  onSuccess: () => {
    console.log("Service worker registered successfully");
  },
  onUpdate: () => {
    console.log("New service worker version available");
  },
  onOfflineReady: () => {
    console.log("App is ready for offline use");
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
