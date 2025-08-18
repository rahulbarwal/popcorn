import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import dotenv from "dotenv";
import {
  checkDatabaseConnection,
  closeDatabaseConnection,
} from "./config/database";
import apiRoutes from "./routes";
import {
  errorHandler,
  notFoundHandler,
  asyncHandler,
} from "./middleware/errorHandler";
import { requestLogger, performanceMonitor } from "./middleware/requestLogger";
import { sanitizeInputs } from "./middleware/validation";
import { generalRateLimit } from "./middleware/rateLimiter";
import { logger } from "./utils/logger";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security and basic middleware
app.use(helmet());
app.use(cors());
app.use(compression());

// Request logging and monitoring
app.use(requestLogger);
app.use(performanceMonitor);

// Rate limiting
app.use("/api", generalRateLimit.middleware());

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Input sanitization
app.use(sanitizeInputs);

// Health check endpoint with database status
app.get(
  "/health",
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const dbConnected = await checkDatabaseConnection();
    const memUsage = process.memoryUsage();

    const healthData = {
      status: "OK",
      timestamp: new Date().toISOString(),
      database: dbConnected ? "connected" : "disconnected",
      uptime: process.uptime(),
      memory: {
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      },
      environment: process.env.NODE_ENV || "development",
    };

    if (!dbConnected) {
      logger.error("Health check failed - database disconnected");
      res.status(503).json({
        ...healthData,
        status: "ERROR",
      });
      return;
    }

    res.json(healthData);
  })
);

// API routes
app.use("/api", apiRoutes);

// 404 handler (must be before error handler)
app.use("*", notFoundHandler);

// Global error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully");
  await closeDatabaseConnection();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down gracefully");
  await closeDatabaseConnection();
  process.exit(0);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception", {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection", { reason, promise });
  process.exit(1);
});

// Start server with database connection check
async function startServer() {
  try {
    logger.info("🚀 Starting server...");

    // Check database connection on startup
    const dbConnected = await checkDatabaseConnection();
    if (!dbConnected) {
      logger.error(
        "❌ Failed to connect to database. Server will still start but may not function properly."
      );
    }

    app.listen(PORT, () => {
      logger.info(`✅ Server running on port ${PORT}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
      logger.info(`📝 Log level: ${process.env.LOG_LEVEL || "INFO"}`);
    });
  } catch (error) {
    logger.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;
