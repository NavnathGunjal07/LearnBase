// Error types
export enum ErrorType {
  VALIDATION = "VALIDATION_ERROR",
  AUTHENTICATION = "AUTHENTICATION_ERROR",
  AUTHORIZATION = "AUTHORIZATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  NETWORK = "NETWORK_ERROR",
  WEBSOCKET = "WEBSOCKET_ERROR",
  API = "API_ERROR",
  INTERNAL = "INTERNAL_ERROR",
}

// Custom error class
export class AppError extends Error {
  constructor(
    public type: ErrorType,
    public message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

// Error response interface
interface ErrorResponse {
  type: ErrorType;
  message: string;
  details?: any;
}

/**
 * Centralized error handler for frontend
 */
export function handleError(error: unknown, context?: string): ErrorResponse {
  console.error(`[Error Handler] ${context || "Error"}:`, error);

  if (error instanceof AppError) {
    return {
      type: error.type,
      message: error.message,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    // Network errors
    if (error.message.includes("fetch") || error.message.includes("network")) {
      return {
        type: ErrorType.NETWORK,
        message: "Network error. Please check your connection.",
      };
    }

    return {
      type: ErrorType.INTERNAL,
      message: error.message || "An unexpected error occurred",
    };
  }

  // Handle axios errors
  if (typeof error === "object" && error !== null && "response" in error) {
    const axiosError = error as any;

    if (axiosError.response) {
      const status = axiosError.response.status;
      const data = axiosError.response.data;

      if (status === 401) {
        return {
          type: ErrorType.AUTHENTICATION,
          message:
            data?.error?.message ||
            "Authentication failed. Please login again.",
        };
      }

      if (status === 403) {
        return {
          type: ErrorType.AUTHORIZATION,
          message:
            data?.error?.message ||
            "You are not authorized to perform this action.",
        };
      }

      if (status === 404) {
        return {
          type: ErrorType.NOT_FOUND,
          message: data?.error?.message || "Resource not found.",
        };
      }

      if (status >= 500) {
        return {
          type: ErrorType.API,
          message:
            data?.error?.message || "Server error. Please try again later.",
        };
      }

      return {
        type: ErrorType.API,
        message:
          data?.error?.message ||
          "An error occurred while processing your request.",
        details: data?.error?.details,
      };
    }

    if (axiosError.request) {
      return {
        type: ErrorType.NETWORK,
        message: "No response from server. Please check your connection.",
      };
    }
  }

  return {
    type: ErrorType.INTERNAL,
    message: "An unknown error occurred.",
  };
}

/**
 * Display error to user (can be integrated with toast notifications)
 */
export function displayError(
  error: unknown,
  context?: string,
  showToast?: (message: string) => void
): void {
  const errorResponse = handleError(error, context);

  console.error(`[Display Error] ${context}:`, errorResponse);

  if (showToast) {
    showToast(errorResponse.message);
  }
}

/**
 * Async error wrapper for async functions
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  fallback?: T,
  context?: string
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    handleError(error, context);
    return fallback;
  }
}

/**
 * WebSocket error handler
 */
export function handleWebSocketError(error: unknown, context?: string): void {
  const errorResponse = handleError(error, context);

  console.error("[WebSocket Error]:", errorResponse);

  // You can dispatch this to a global error state or toast system
}

/**
 * Retry async operation with exponential backoff
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000,
  context?: string
): Promise<T> {
  let lastError: unknown;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.warn(`[Retry ${i + 1}/${maxRetries}] ${context}:`, error);

      if (i < maxRetries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, delayMs * Math.pow(2, i))
        );
      }
    }
  }

  throw lastError;
}

// Error factories
export const ErrorFactory = {
  validation: (message: string, details?: any) =>
    new AppError(ErrorType.VALIDATION, message, 400, details),

  authentication: (message: string = "Authentication failed") =>
    new AppError(ErrorType.AUTHENTICATION, message, 401),

  authorization: (message: string = "Unauthorized access") =>
    new AppError(ErrorType.AUTHORIZATION, message, 403),

  notFound: (resource: string) =>
    new AppError(ErrorType.NOT_FOUND, `${resource} not found`, 404),

  network: (message: string = "Network error") =>
    new AppError(ErrorType.NETWORK, message),

  api: (message: string, details?: any) =>
    new AppError(ErrorType.API, message, 500, details),

  internal: (message: string = "Internal error", details?: any) =>
    new AppError(ErrorType.INTERNAL, message, 500, details),
};

export default {
  AppError,
  ErrorType,
  handleError,
  displayError,
  safeAsync,
  handleWebSocketError,
  retryAsync,
  ErrorFactory,
};
