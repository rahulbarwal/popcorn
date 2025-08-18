import fs from "fs";
import path from "path";

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  data?: any;
  requestId?: string;
  userId?: string;
}

class Logger {
  private logLevel: LogLevel;
  private logDir: string;

  constructor() {
    this.logLevel = this.getLogLevel();
    this.logDir = path.join(process.cwd(), "logs");
    this.ensureLogDirectory();
  }

  private getLogLevel(): LogLevel {
    const level = process.env.LOG_LEVEL?.toUpperCase() || "INFO";
    switch (level) {
      case "ERROR":
        return LogLevel.ERROR;
      case "WARN":
        return LogLevel.WARN;
      case "INFO":
        return LogLevel.INFO;
      case "DEBUG":
        return LogLevel.DEBUG;
      default:
        return LogLevel.INFO;
    }
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private formatLogEntry(
    level: string,
    message: string,
    data?: any,
    context?: any
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(data && { data }),
      ...(context?.requestId && { requestId: context.requestId }),
      ...(context?.userId && { userId: context.userId }),
    };
  }

  private writeToFile(logEntry: LogEntry): void {
    const date = new Date().toISOString().split("T")[0];
    const filename = `${date}.log`;
    const filepath = path.join(this.logDir, filename);

    const logLine = JSON.stringify(logEntry) + "\n";

    try {
      fs.appendFileSync(filepath, logLine);
    } catch (error) {
      console.error("Failed to write to log file:", error);
    }
  }

  private log(
    level: LogLevel,
    levelName: string,
    message: string,
    data?: any,
    context?: any
  ): void {
    if (level > this.logLevel) {
      return;
    }

    const logEntry = this.formatLogEntry(levelName, message, data, context);

    // Console output with colors
    const colors = {
      ERROR: "\x1b[31m", // Red
      WARN: "\x1b[33m", // Yellow
      INFO: "\x1b[36m", // Cyan
      DEBUG: "\x1b[35m", // Magenta
      RESET: "\x1b[0m",
    };

    const color = colors[levelName as keyof typeof colors] || colors.RESET;
    const timestamp = logEntry.timestamp;

    console.log(
      `${color}[${timestamp}] ${levelName}:${colors.RESET} ${message}`,
      data ? JSON.stringify(data, null, 2) : ""
    );

    // Write to file in production or when LOG_TO_FILE is enabled
    if (
      process.env.NODE_ENV === "production" ||
      process.env.LOG_TO_FILE === "true"
    ) {
      this.writeToFile(logEntry);
    }
  }

  error(message: string, data?: any, context?: any): void {
    this.log(LogLevel.ERROR, "ERROR", message, data, context);
  }

  warn(message: string, data?: any, context?: any): void {
    this.log(LogLevel.WARN, "WARN", message, data, context);
  }

  info(message: string, data?: any, context?: any): void {
    this.log(LogLevel.INFO, "INFO", message, data, context);
  }

  debug(message: string, data?: any, context?: any): void {
    this.log(LogLevel.DEBUG, "DEBUG", message, data, context);
  }

  // Request logging helper
  logRequest(req: any, res: any, responseTime?: number): void {
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      ...(responseTime && { responseTime: `${responseTime}ms` }),
    };

    if (res.statusCode >= 400) {
      this.warn("HTTP Request", logData);
    } else {
      this.info("HTTP Request", logData);
    }
  }

  // Database operation logging
  logDatabaseOperation(
    operation: string,
    table: string,
    duration?: number,
    error?: Error
  ): void {
    const logData = {
      operation,
      table,
      ...(duration && { duration: `${duration}ms` }),
      ...(error && { error: error.message }),
    };

    if (error) {
      this.error("Database Operation Failed", logData);
    } else {
      this.debug("Database Operation", logData);
    }
  }

  // Performance logging
  logPerformance(
    operation: string,
    duration: number,
    threshold: number = 1000
  ): void {
    const logData = {
      operation,
      duration: `${duration}ms`,
      threshold: `${threshold}ms`,
    };

    if (duration > threshold) {
      this.warn("Slow Operation Detected", logData);
    } else {
      this.debug("Performance Metric", logData);
    }
  }
}

export const logger = new Logger();
