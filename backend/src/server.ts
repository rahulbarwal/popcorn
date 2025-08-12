import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import dotenv from "dotenv";
import {
  checkDatabaseConnection,
  closeDatabaseConnection,
} from "./config/database";
import apiRoutes from "./routes";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint with database status
app.get("/health", async (req, res) => {
  try {
    const dbConnected = await checkDatabaseConnection();
    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      database: dbConnected ? "connected" : "disconnected",
    });
  } catch (error) {
    res.status(503).json({
      status: "ERROR",
      timestamp: new Date().toISOString(),
      database: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// API routes
app.use("/api", apiRoutes);

// Error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
  }
);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  await closeDatabaseConnection();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully");
  await closeDatabaseConnection();
  process.exit(0);
});

// Start server with database connection check
async function startServer() {
  try {
    console.log("🚀 Starting server...");

    // Check database connection on startup
    const dbConnected = await checkDatabaseConnection();
    if (!dbConnected) {
      console.error(
        "❌ Failed to connect to database. Server will still start but may not function properly."
      );
    }

    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;
