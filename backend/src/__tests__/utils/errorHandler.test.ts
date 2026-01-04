import {
  AppError,
  ErrorType,
  handleWebSocketError,
  ErrorFactory,
} from "../../utils/errorHandler";

describe("Error Handler Utilities", () => {
  describe("AppError", () => {
    it("should create an AppError with all properties", () => {
      const error = new AppError(
        ErrorType.VALIDATION,
        "Validation failed",
        400,
        true,
        { field: "email" }
      );

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.message).toBe("Validation failed");
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
      expect(error.details).toEqual({ field: "email" });
      expect(error.name).toBe("AppError");
    });

    it("should create an AppError with default values", () => {
      const error = new AppError(ErrorType.INTERNAL, "Internal error");

      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error.details).toBeUndefined();
    });
  });

  describe("ErrorFactory", () => {
    it("should create validation error", () => {
      const error = ErrorFactory.validation("Invalid input", { field: "name" });

      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.message).toBe("Invalid input");
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ field: "name" });
    });

    it("should create authentication error", () => {
      const error = ErrorFactory.authentication("Login failed");

      expect(error.type).toBe(ErrorType.AUTHENTICATION);
      expect(error.message).toBe("Login failed");
      expect(error.statusCode).toBe(401);
    });

    it("should create authentication error with default message", () => {
      const error = ErrorFactory.authentication();

      expect(error.message).toBe("Authentication failed");
    });

    it("should create authorization error", () => {
      const error = ErrorFactory.authorization("Access denied");

      expect(error.type).toBe(ErrorType.AUTHORIZATION);
      expect(error.message).toBe("Access denied");
      expect(error.statusCode).toBe(403);
    });

    it("should create not found error", () => {
      const error = ErrorFactory.notFound("User");

      expect(error.type).toBe(ErrorType.NOT_FOUND);
      expect(error.message).toBe("User not found");
      expect(error.statusCode).toBe(404);
    });

    it("should create database error", () => {
      const error = ErrorFactory.database("Connection failed", {
        code: "CONN_TIMEOUT",
      });

      expect(error.type).toBe(ErrorType.DATABASE);
      expect(error.message).toBe("Connection failed");
      expect(error.statusCode).toBe(500);
      expect(error.details).toEqual({ code: "CONN_TIMEOUT" });
    });

    it("should create external API error", () => {
      const error = ErrorFactory.externalAPI("API timeout", {
        service: "GROQ",
      });

      expect(error.type).toBe(ErrorType.EXTERNAL_API);
      expect(error.message).toBe("API timeout");
      expect(error.statusCode).toBe(502);
      expect(error.details).toEqual({ service: "GROQ" });
    });

    it("should create internal error", () => {
      const error = ErrorFactory.internal("Unexpected error", { trace: "123" });

      expect(error.type).toBe(ErrorType.INTERNAL);
      expect(error.message).toBe("Unexpected error");
      expect(error.statusCode).toBe(500);
      expect(error.details).toEqual({ trace: "123" });
    });

    it("should create internal error with default message", () => {
      const error = ErrorFactory.internal();

      expect(error.message).toBe("Internal server error");
    });
  });

  describe("handleWebSocketError", () => {
    let mockWs: any;
    let sentMessages: any[];

    beforeEach(() => {
      sentMessages = [];
      mockWs = {
        send: jest.fn((data: string) => {
          sentMessages.push(JSON.parse(data));
        }),
        readyState: 1, // WebSocket.OPEN
      };
    });

    it("should send AppError to WebSocket", () => {
      const error = new AppError(
        ErrorType.VALIDATION,
        "Invalid data",
        400,
        true
      );

      handleWebSocketError(error, mockWs, "testContext");

      expect(sentMessages).toHaveLength(1);
      expect(sentMessages[0]).toEqual({
        type: "error",
        error: {
          type: ErrorType.VALIDATION,
          message: "Invalid data",
        },
      });
    });

    it("should send regular Error to WebSocket", () => {
      const error = new Error("Something went wrong");

      handleWebSocketError(error, mockWs, "testContext");

      expect(sentMessages).toHaveLength(1);
      expect(sentMessages[0]).toEqual({
        type: "error",
        error: {
          type: ErrorType.WEBSOCKET,
          message: "Something went wrong",
        },
      });
    });

    it("should send unknown error to WebSocket", () => {
      const error = "String error";

      handleWebSocketError(error, mockWs, "testContext");

      expect(sentMessages).toHaveLength(1);
      expect(sentMessages[0]).toEqual({
        type: "error",
        error: {
          type: ErrorType.WEBSOCKET,
          message: "An error occurred",
        },
      });
    });

    it("should not send error if WebSocket is not open", () => {
      mockWs.readyState = 0; // WebSocket.CONNECTING

      const error = new Error("Test error");
      handleWebSocketError(error, mockWs, "testContext");

      expect(mockWs.send).not.toHaveBeenCalled();
      expect(sentMessages).toHaveLength(0);
    });

    it("should handle send failure gracefully", () => {
      mockWs.send = jest.fn(() => {
        throw new Error("Send failed");
      });

      const error = new Error("Test error");

      // Should not throw
      expect(() => {
        handleWebSocketError(error, mockWs, "testContext");
      }).not.toThrow();
    });

    it("should work without context parameter", () => {
      const error = new Error("Test error");

      handleWebSocketError(error, mockWs);

      expect(sentMessages).toHaveLength(1);
      expect(sentMessages[0].type).toBe("error");
    });
  });

  describe("ErrorType enum", () => {
    it("should have all expected error types", () => {
      expect(ErrorType.VALIDATION).toBe("VALIDATION_ERROR");
      expect(ErrorType.AUTHENTICATION).toBe("AUTHENTICATION_ERROR");
      expect(ErrorType.AUTHORIZATION).toBe("AUTHORIZATION_ERROR");
      expect(ErrorType.NOT_FOUND).toBe("NOT_FOUND");
      expect(ErrorType.DATABASE).toBe("DATABASE_ERROR");
      expect(ErrorType.EXTERNAL_API).toBe("EXTERNAL_API_ERROR");
      expect(ErrorType.WEBSOCKET).toBe("WEBSOCKET_ERROR");
      expect(ErrorType.INTERNAL).toBe("INTERNAL_SERVER_ERROR");
    });
  });
});
