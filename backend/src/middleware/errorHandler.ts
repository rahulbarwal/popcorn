import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { ApiResponse } from "../types";

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
}

export class CustomError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends CustomError {
  constructor(message: string, field?: string) {
    super(message, 400, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export class NotFoundError extends CustomError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class DatabaseError extends CustomError {
  constructor(message: string, originalError?: Error) {
    super(message, 500, "DATABASE_ERROR");
    this.name = "DatabaseError";
    if (originalError) {
      this.stack = originalError.stack;
    }
  }
}

export class RateLimitError extends CustomError {
  constructor(message: string = "Too many requests") {
    super(message, 429, "RATE_LIMIT_EXCEEDED");
    this.name = "RateLimitError";
  }
}

// Error handling middleware
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Set default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let code = err.code || "INTERNAL_ERROR";

  // Log error details
  const errorDetails = {
    message: err.message,
    statusCode,
    code,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    timestamp: new Date().toISOString(),
  };

  // Log based on severity
  if (statusCode >= 500) {
    logger.error("Server Error", errorDetails);
  } else if (statusCode >= 400) {
    logger.warn("Client Error", errorDetails);
  }

  // Handle specific error types
  if (err.name === "ValidationError") {
    statusCode = 400;
    code = "VALIDATION_ERROR";
  } else if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format";
    code = "INVALID_ID";
  } else if (err.code === "23505") {
    // PostgreSQL unique violation
    statusCode = 409;
    message = "Resource already exists";
    code = "DUPLICATE_RESOURCE";
  } else if (err.code === "23503") {
    // PostgreSQL foreign key violation
    statusCode = 400;
    message = "Referenced resource does not exist";
    code = "INVALID_REFERENCE";
  }

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === "development";

  const errorResponse: ApiResponse = {
    success: false,
    error: message,
    code,
    ...(isDevelopment && {
      stack: err.stack,
      details: errorDetails,
    }),
  };

  res.status(statusCode).json(errorResponse);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response): void => {
  const message = `Route ${req.originalUrl} not found`;
  logger.warn("Route Not Found", {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });

  res.status(404).json({
    success: false,
    error: message,
    code: "ROUTE_NOT_FOUND",
  } as ApiResponse);
};
