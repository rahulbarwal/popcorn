import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { v4 as uuidv4 } from "uuid";

// Extend Request interface to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      startTime?: number;
    }
  }
}

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Generate unique request ID
  req.requestId = uuidv4();
  req.startTime = Date.now();

  // Add request ID to response headers
  res.set("X-Request-ID", req.requestId);

  // Log incoming request
  logger.info("Incoming Request", {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    contentType: req.get("Content-Type"),
    contentLength: req.get("Content-Length"),
    referer: req.get("Referer"),
  });

  // Log request body for non-GET requests (excluding sensitive data)
  if (req.method !== "GET" && req.body) {
    const sanitizedBody = sanitizeLogData(req.body);
    logger.debug("Request Body", {
      requestId: req.requestId,
      body: sanitizedBody,
    });
  }

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function (chunk?: any, encoding?: any) {
    const responseTime = Date.now() - (req.startTime || 0);

    // Log response details
    logger.info("Response Sent", {
      requestId: req.requestId,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentLength: res.get("Content-Length"),
      contentType: res.get("Content-Type"),
    });

    // Log slow requests
    if (responseTime > 1000) {
      logger.warn("Slow Request Detected", {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        responseTime: `${responseTime}ms`,
        statusCode: res.statusCode,
      });
    }

    // Log error responses
    if (res.statusCode >= 400) {
      logger.warn("Error Response", {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
      });
    }

    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Sanitize sensitive data from logs
const sanitizeLogData = (data: any): any => {
  if (!data || typeof data !== "object") {
    return data;
  }

  const sensitiveFields = [
    "password",
    "token",
    "authorization",
    "auth",
    "secret",
    "key",
    "api_key",
    "apikey",
    "access_token",
    "refresh_token",
  ];

  const sanitized = { ...data };

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = "[REDACTED]";
    }
  }

  // Recursively sanitize nested objects
  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeLogData(value);
    }
  }

  return sanitized;
};

// Performance monitoring middleware
export const performanceMonitor = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = process.hrtime.bigint();

  res.on("finish", () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

    // Log performance metrics
    logger.logPerformance(`${req.method} ${req.url}`, duration);

    // Log memory usage for slow requests
    if (duration > 1000) {
      const memUsage = process.memoryUsage();
      logger.warn("High Memory Usage on Slow Request", {
        requestId: req.requestId,
        duration: `${duration}ms`,
        memoryUsage: {
          rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
          external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
        },
      });
    }
  });

  next();
};
