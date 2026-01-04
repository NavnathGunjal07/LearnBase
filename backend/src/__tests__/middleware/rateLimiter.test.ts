import {
  apiLimiter,
  authLimiter,
  chatLimiter,
  executeLimiter,
  createLimiter,
} from "../../middleware/rateLimiter";

describe("Rate Limiter Middleware", () => {
  describe("apiLimiter", () => {
    it("should be defined", () => {
      expect(apiLimiter).toBeDefined();
      expect(typeof apiLimiter).toBe("function");
    });

    it("should have correct configuration", () => {
      // Access the options from the rate limiter
      const options = (apiLimiter as any).options;

      expect(options.windowMs).toBe(15 * 60 * 1000); // 15 minutes
      expect(options.max).toBe(1999); // Max requests
      expect(options.standardHeaders).toBe(true);
      expect(options.legacyHeaders).toBe(false);
      expect(options.skipSuccessfulRequests).toBe(false);
    });

    it("should have correct error message", () => {
      const options = (apiLimiter as any).options;
      expect(options.message).toEqual({
        error: "Too many requests from this IP, please try again later.",
      });
    });
  });

  describe("authLimiter", () => {
    it("should be defined", () => {
      expect(authLimiter).toBeDefined();
      expect(typeof authLimiter).toBe("function");
    });

    it("should have stricter limits than apiLimiter", () => {
      const options = (authLimiter as any).options;

      expect(options.windowMs).toBe(15 * 60 * 1000); // 15 minutes
      expect(options.max).toBe(5); // Only 5 requests
      expect(options.skipSuccessfulRequests).toBe(true);
    });

    it("should have correct error message", () => {
      const options = (authLimiter as any).options;
      expect(options.message).toEqual({
        error:
          "Too many authentication attempts, please try again after 15 minutes.",
      });
    });
  });

  describe("chatLimiter", () => {
    it("should be defined", () => {
      expect(chatLimiter).toBeDefined();
      expect(typeof chatLimiter).toBe("function");
    });

    it("should have per-minute limits", () => {
      const options = (chatLimiter as any).options;

      expect(options.windowMs).toBe(60 * 1000); // 1 minute
      expect(options.max).toBe(30); // 30 requests per minute
    });

    it("should have correct error message", () => {
      const options = (chatLimiter as any).options;
      expect(options.message).toEqual({
        error: "Too many messages sent, please slow down.",
      });
    });
  });

  describe("executeLimiter", () => {
    it("should be defined", () => {
      expect(executeLimiter).toBeDefined();
      expect(typeof executeLimiter).toBe("function");
    });

    it("should have restrictive limits for code execution", () => {
      const options = (executeLimiter as any).options;

      expect(options.windowMs).toBe(60 * 1000); // 1 minute
      expect(options.max).toBe(10); // Only 10 executions per minute
    });

    it("should have correct error message", () => {
      const options = (executeLimiter as any).options;
      expect(options.message).toEqual({
        error:
          "Too many code execution requests, please wait before trying again.",
      });
    });
  });

  describe("createLimiter", () => {
    it("should be defined", () => {
      expect(createLimiter).toBeDefined();
      expect(typeof createLimiter).toBe("function");
    });

    it("should have hourly limits for creation", () => {
      const options = (createLimiter as any).options;

      expect(options.windowMs).toBe(60 * 60 * 1000); // 1 hour
      expect(options.max).toBe(10); // 10 creations per hour
    });

    it("should have correct error message", () => {
      const options = (createLimiter as any).options;
      expect(options.message).toEqual({
        error: "Too many creation requests, please try again later.",
      });
    });
  });

  describe("Rate Limiter Comparison", () => {
    it("authLimiter should be stricter than apiLimiter", () => {
      const authOptions = (authLimiter as any).options;
      const apiOptions = (apiLimiter as any).options;

      expect(authOptions.max).toBeLessThan(apiOptions.max);
    });

    it("chatLimiter should have shorter window than apiLimiter", () => {
      const chatOptions = (chatLimiter as any).options;
      const apiOptions = (apiLimiter as any).options;

      expect(chatOptions.windowMs).toBeLessThan(apiOptions.windowMs);
    });

    it("executeLimiter should be more restrictive than chatLimiter", () => {
      const executeOptions = (executeLimiter as any).options;
      const chatOptions = (chatLimiter as any).options;

      expect(executeOptions.max).toBeLessThan(chatOptions.max);
    });

    it("createLimiter should have longest window", () => {
      const createOptions = (createLimiter as any).options;
      const apiOptions = (apiLimiter as any).options;
      const chatOptions = (chatLimiter as any).options;

      expect(createOptions.windowMs).toBeGreaterThan(apiOptions.windowMs);
      expect(createOptions.windowMs).toBeGreaterThan(chatOptions.windowMs);
    });
  });

  describe("Standard Headers Configuration", () => {
    it("all limiters should use standard headers", () => {
      const limiters = [
        apiLimiter,
        authLimiter,
        chatLimiter,
        executeLimiter,
        createLimiter,
      ];

      limiters.forEach((limiter) => {
        const options = (limiter as any).options;
        expect(options.standardHeaders).toBe(true);
        expect(options.legacyHeaders).toBe(false);
      });
    });
  });

  describe("Security Configuration", () => {
    it("authLimiter should skip successful requests", () => {
      const options = (authLimiter as any).options;
      expect(options.skipSuccessfulRequests).toBe(true);
    });

    it("other limiters should not skip successful requests", () => {
      const limiters = [apiLimiter, chatLimiter, executeLimiter, createLimiter];

      limiters.forEach((limiter) => {
        const options = (limiter as any).options;
        expect(options.skipSuccessfulRequests).toBeFalsy();
      });
    });
  });
});
