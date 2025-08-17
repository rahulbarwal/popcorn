import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Initialize accessibility development tools
if (process.env.NODE_ENV === "development") {
  import("./utils/devA11y").then(({ initA11yDevTools }) => {
    initA11yDevTools();
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
