import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { RateLimitError } from "./errorHandler";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

class RateLimiter {
  private store: RateLimitStore = {};
  private options: Required<RateLimitOptions>;

  constructor(options: RateLimitOptions) {
    this.options = {
      windowMs: options.windowMs,
      maxRequests: options.maxRequests,
      message: options.message || "Too many requests, please try again later",
      skipSuccessfulRequests: options.skipSuccessfulRequests || false,
      skipFailedRequests: options.skipFailedRequests || false,
      keyGenerator: options.keyGenerator || this.defaultKeyGenerator,
    };

    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  private defaultKeyGenerator(req: Request): string {
    return req.ip || "unknown";
  }

  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach((key) => {
      if (this.store[key].resetTime <= now) {
        delete this.store[key];
      }
    });
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const key = this.options.keyGenerator(req);
      const now = Date.now();

      // Initialize or reset if window expired
      if (!this.store[key] || this.store[key].resetTime <= now) {
        this.store[key] = {
          count: 0,
          resetTime: now + this.options.windowMs,
        };
      }

      const current = this.store[key];

      // Check if limit exceeded
      if (current.count >= this.options.maxRequests) {
        const resetTime = new Date(current.resetTime);

        logger.warn("Rate limit exceeded", {
          key,
          count: current.count,
          limit: this.options.maxRequests,
          resetTime: resetTime.toISOString(),
          url: req.url,
          method: req.method,
        });

        // Set rate limit headers
        res.set({
          "X-RateLimit-Limit": this.options.maxRequests.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": Math.ceil(current.resetTime / 1000).toString(),
          "Retry-After": Math.ceil((current.resetTime - now) / 1000).toString(),
        });

        throw new RateLimitError(this.options.message);
      }

      // Increment counter
      current.count++;

      // Set rate limit headers
      res.set({
        "X-RateLimit-Limit": this.options.maxRequests.toString(),
        "X-RateLimit-Remaining": (
          this.options.maxRequests - current.count
        ).toString(),
        "X-RateLimit-Reset": Math.ceil(current.resetTime / 1000).toString(),
      });

      // Handle response to potentially skip counting
      const originalSend = res.send;
      const rateLimiterOptions = this.options;
      res.send = function (body: any) {
        const statusCode = res.statusCode;

        // Decrement if we should skip this request
        if (
          (statusCode < 400 && rateLimiterOptions.skipSuccessfulRequests) ||
          (statusCode >= 400 && rateLimiterOptions.skipFailedRequests)
        ) {
          current.count--;
        }

        return originalSend.call(this, body);
      };

      next();
    };
  }
}

// Predefined rate limiters
export const createRateLimiter = (options: RateLimitOptions) =>
  new RateLimiter(options);

// General API rate limiter - 100 requests per 15 minutes
export const generalRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  message: "Too many API requests, please try again later",
});

// Strict rate limiter for sensitive operations - 10 requests per 15 minutes
export const strictRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10,
  message: "Too many requests for this operation, please try again later",
});

// Dashboard rate limiter - 60 requests per 5 minutes (more lenient for dashboard)
export const dashboardRateLimit = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 60,
  message: "Too many dashboard requests, please try again later",
});

// Search rate limiter - 30 requests per minute
export const searchRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30,
  message: "Too many search requests, please try again later",
  skipSuccessfulRequests: true, // Don't count successful searches against limit
});
