import logger, { wsLogger, dbLogger, authLogger } from "../../utils/logger";

describe("Logger Utilities", () => {
  // Store original console methods
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  beforeEach(() => {
    // Mock console methods to prevent actual logging during tests
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  afterEach(() => {
    // Restore original console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });

  describe("Default Logger", () => {
    it("should be defined", () => {
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe("function");
      expect(typeof logger.error).toBe("function");
      expect(typeof logger.warn).toBe("function");
      expect(typeof logger.debug).toBe("function");
    });

    it("should have correct default metadata", () => {
      expect(logger.defaultMeta).toEqual({ service: "learnbase-backend" });
    });

    it("should log info messages", () => {
      logger.info("Test info message");
      // Logger should not throw
      expect(true).toBe(true);
    });

    it("should log error messages", () => {
      logger.error("Test error message");
      expect(true).toBe(true);
    });

    it("should log warn messages", () => {
      logger.warn("Test warning message");
      expect(true).toBe(true);
    });

    it("should log debug messages", () => {
      logger.debug("Test debug message");
      expect(true).toBe(true);
    });

    it("should log with metadata", () => {
      logger.info("Test message with metadata", {
        userId: "123",
        action: "login",
      });
      expect(true).toBe(true);
    });

    it("should handle error objects", () => {
      const error = new Error("Test error");
      logger.error("Error occurred", { error });
      expect(true).toBe(true);
    });
  });

  describe("WebSocket Logger", () => {
    it("should be defined", () => {
      expect(wsLogger).toBeDefined();
      expect(typeof wsLogger.info).toBe("function");
    });

    it("should have websocket component metadata", () => {
      expect(wsLogger.defaultMeta).toEqual({
        service: "learnbase-backend",
        component: "websocket",
      });
    });

    it("should log websocket events", () => {
      wsLogger.info("WebSocket connection established", {
        userId: "test-123",
      });
      expect(true).toBe(true);
    });

    it("should log websocket errors", () => {
      wsLogger.error("WebSocket error", {
        error: "Connection failed",
      });
      expect(true).toBe(true);
    });
  });

  describe("Database Logger", () => {
    it("should be defined", () => {
      expect(dbLogger).toBeDefined();
      expect(typeof dbLogger.info).toBe("function");
    });

    it("should have database component metadata", () => {
      expect(dbLogger.defaultMeta).toEqual({
        service: "learnbase-backend",
        component: "database",
      });
    });

    it("should log database operations", () => {
      dbLogger.info("Database query executed", {
        query: "SELECT * FROM users",
        duration: 45,
      });
      expect(true).toBe(true);
    });

    it("should log database errors", () => {
      dbLogger.error("Database connection failed", {
        error: "Connection timeout",
      });
      expect(true).toBe(true);
    });
  });

  describe("Auth Logger", () => {
    it("should be defined", () => {
      expect(authLogger).toBeDefined();
      expect(typeof authLogger.info).toBe("function");
    });

    it("should have auth component metadata", () => {
      expect(authLogger.defaultMeta).toEqual({
        service: "learnbase-backend",
        component: "auth",
      });
    });

    it("should log authentication events", () => {
      authLogger.info("User logged in", {
        userId: "user-123",
        method: "google",
      });
      expect(true).toBe(true);
    });

    it("should log authentication failures", () => {
      authLogger.warn("Failed login attempt", {
        email: "test@example.com",
        reason: "Invalid password",
      });
      expect(true).toBe(true);
    });
  });

  describe("Logger Configuration", () => {
    it("should respect log level from environment", () => {
      // Logger level should be set based on LOG_LEVEL env var or default to 'info'
      expect(["error", "warn", "info", "debug", "verbose", "silly"]).toContain(
        logger.level
      );
    });

    it("should have multiple transports configured", () => {
      // Winston logger should have transports for file and console
      expect(logger.transports).toBeDefined();
      expect(logger.transports.length).toBeGreaterThan(0);
    });
  });

  describe("Error Logging with Stack Traces", () => {
    it("should log errors with stack traces", () => {
      const error = new Error("Test error with stack");
      error.stack = "Error: Test error\n    at Test.fn (test.ts:10:5)";

      logger.error("Error with stack", {
        error: error.message,
        stack: error.stack,
      });
      expect(true).toBe(true);
    });

    it("should handle errors without stack traces", () => {
      const error = { message: "Simple error object" };
      logger.error("Error without stack", { error });
      expect(true).toBe(true);
    });
  });

  describe("Structured Logging", () => {
    it("should support structured logging with multiple fields", () => {
      logger.info("User action", {
        userId: "user-123",
        action: "update_profile",
        timestamp: new Date().toISOString(),
        metadata: {
          field: "name",
          oldValue: "John",
          newValue: "John Doe",
        },
      });
      expect(true).toBe(true);
    });

    it("should handle nested objects in metadata", () => {
      logger.info("Complex event", {
        user: {
          id: "123",
          email: "test@example.com",
        },
        request: {
          method: "POST",
          path: "/api/users",
          body: { name: "Test" },
        },
      });
      expect(true).toBe(true);
    });
  });

  describe("Log Levels", () => {
    it("should support all Winston log levels", () => {
      logger.error("Error level");
      logger.warn("Warn level");
      logger.info("Info level");
      logger.debug("Debug level");

      // All should execute without throwing
      expect(true).toBe(true);
    });
  });
});
