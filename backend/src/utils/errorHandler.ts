import { Response } from "express";
import { WebSocket } from "ws";
import logger from "./logger";

// Error types
export enum ErrorType {
  VALIDATION = "VALIDATION_ERROR",
  AUTHENTICATION = "AUTHENTICATION_ERROR",
  AUTHORIZATION = "AUTHORIZATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  DATABASE = "DATABASE_ERROR",
  EXTERNAL_API = "EXTERNAL_API_ERROR",
  WEBSOCKET = "WEBSOCKET_ERROR",
  INTERNAL = "INTERNAL_SERVER_ERROR",
}

// Custom error class
export class AppError extends Error {
  constructor(
    public type: ErrorType,
    public message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true,
    public details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error response interface
interface ErrorResponse {
  success: false;
  error: {
    type: ErrorType;
    message: string;
    details?: any;
  };
}

/**
 * Centralized error handler for HTTP requests
 */
export function handleHttpError(error: unknown, res: Response): void {
  if (error instanceof AppError) {
    logger.error("Operational Error:", {
      type: error.type,
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
      stack: error.stack,
    });

    const response: ErrorResponse = {
      success: false,
      error: {
        type: error.type,
        message: error.message,
        ...(error.details && { details: error.details }),
      },
    };

    res.status(error.statusCode).json(response);
  } else if (error instanceof Error) {
    logger.error("Unexpected Error:", {
      message: error.message,
      stack: error.stack,
    });

    const response: ErrorResponse = {
      success: false,
      error: {
        type: ErrorType.INTERNAL,
        message: "An unexpected error occurred. Please try again later.",
      },
    };

    res.status(500).json(response);
  } else {
    logger.error("Unknown Error:", { error });

    const response: ErrorResponse = {
      success: false,
      error: {
        type: ErrorType.INTERNAL,
        message: "An unknown error occurred.",
      },
    };

    res.status(500).json(response);
  }
}

/**
 * Centralized error handler for WebSocket connections
 */
export function handleWebSocketError(
  error: unknown,
  ws: WebSocket,
  context?: string
): void {
  let errorMessage = "An error occurred";
  let errorType = ErrorType.WEBSOCKET;

  if (error instanceof AppError) {
    logger.error("WebSocket Operational Error:", {
      context,
      type: error.type,
      message: error.message,
      details: error.details,
      stack: error.stack,
    });

    errorMessage = error.message;
    errorType = error.type;
  } else if (error instanceof Error) {
    logger.error("WebSocket Unexpected Error:", {
      context,
      message: error.message,
      stack: error.stack,
    });

    errorMessage = error.message;
  } else {
    logger.error("WebSocket Unknown Error:", {
      context,
      error,
    });
  }

  // Send error message to client if connection is open
  if (ws.readyState === WebSocket.OPEN) {
    try {
      ws.send(
        JSON.stringify({
          type: "error",
          error: {
            type: errorType,
            message: errorMessage,
          },
        })
      );
    } catch (sendError) {
      logger.error("Failed to send error message to client:", sendError);
    }
  }
}

/**
 * Async error wrapper for HTTP route handlers
 */
export function asyncHandler(fn: Function) {
  return (req: any, res: Response, next?: Function) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      handleHttpError(error, res);
    });
  };
}

/**
 * Async error wrapper for async functions
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  context?: string
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    logger.error(`Error in ${context || "async operation"}:`, error);
    return null;
  }
}

/**
 * Log and rethrow error (useful for debugging)
 */
export function logAndThrow(error: unknown, context: string): never {
  logger.error(`Error in ${context}:`, error);
  throw error;
}

// Common error factories
export const ErrorFactory = {
  validation: (message: string, details?: any) =>
    new AppError(ErrorType.VALIDATION, message, 400, true, details),

  authentication: (message: string = "Authentication failed") =>
    new AppError(ErrorType.AUTHENTICATION, message, 401, true),

  authorization: (message: string = "Unauthorized access") =>
    new AppError(ErrorType.AUTHORIZATION, message, 403, true),

  notFound: (resource: string) =>
    new AppError(ErrorType.NOT_FOUND, `${resource} not found`, 404, true),

  database: (message: string, details?: any) =>
    new AppError(ErrorType.DATABASE, message, 500, true, details),

  externalAPI: (message: string, details?: any) =>
    new AppError(ErrorType.EXTERNAL_API, message, 502, true, details),

  internal: (message: string = "Internal server error", details?: any) =>
    new AppError(ErrorType.INTERNAL, message, 500, true, details),
};

export default {
  AppError,
  ErrorType,
  handleHttpError,
  handleWebSocketError,
  asyncHandler,
  safeAsync,
  logAndThrow,
  ErrorFactory,
};
