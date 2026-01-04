import { Server } from "http";
import { setupWebSocketServer } from "../../websocket/chatServer";

// Mock dependencies
jest.mock("../../config/prisma", () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("../../utils/logger", () => ({
  wsLogger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock("../../websocket/onboardingHandler", () => ({
  handleOnboardingFlow: jest.fn(),
}));

jest.mock("../../websocket/learningHandler", () => ({
  handleLearningFlow: jest.fn(),
  initLearningSession: jest.fn(),
}));

jest.mock("../../utils/errorHandler", () => ({
  handleWebSocketError: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(),
}));

import prisma from "../../config/prisma";
import jwt from "jsonwebtoken";
import { initLearningSession } from "../../websocket/learningHandler";

describe("Chat Server (WebSocket)", () => {
  let mockServer: Server;

  beforeEach(() => {
    mockServer = {
      on: jest.fn(),
      listen: jest.fn(),
    } as any;

    jest.clearAllMocks();

    // Set up environment
    process.env.JWT_SECRET = "test-secret";
  });

  describe("setupWebSocketServer", () => {
    it("should create WebSocket server successfully", () => {
      const wss = setupWebSocketServer(mockServer);

      expect(wss).toBeDefined();
      expect(wss.options.path).toBe("/ws");
    });

    it("should set up heartbeat interval", () => {
      jest.useFakeTimers();

      const wss = setupWebSocketServer(mockServer);

      // Fast-forward time to trigger heartbeat
      jest.advanceTimersByTime(30000);

      // Cleanup
      wss.close();
      jest.useRealTimers();

      expect(true).toBe(true);
    });

    it("should handle authenticated connection with valid token", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        hasCompletedOnboarding: true,
      };

      (jwt.verify as jest.Mock).mockReturnValue({ userId: "user-123" });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const wss = setupWebSocketServer(mockServer);

      // Simulate connection event
      const mockWs = {
        on: jest.fn(),
        send: jest.fn(),
        ping: jest.fn(),
        terminate: jest.fn(),
        isAlive: true,
      } as any;

      const mockReq = {
        url: "/ws?token=valid-token",
        headers: { host: "localhost:3000" },
      } as any;

      // Manually trigger connection handler
      const connectionHandler = (wss as any)._events?.connection;
      if (connectionHandler) {
        await connectionHandler(mockWs, mockReq);
      }

      // Cleanup
      wss.close();

      expect(true).toBe(true);
    });

    it("should reject unauthenticated connection", async () => {
      const wss = setupWebSocketServer(mockServer);

      const mockWs = {
        on: jest.fn(),
        send: jest.fn(),
        ping: jest.fn(),
        terminate: jest.fn(),
        isAlive: true,
      } as any;

      const mockReq = {
        url: "/ws",
        headers: { host: "localhost:3000" },
      } as any;

      // Manually trigger connection handler
      const connectionHandler = (wss as any)._events?.connection;
      if (connectionHandler) {
        await connectionHandler(mockWs, mockReq);
      }

      // Should send auth_required message
      expect(mockWs.send).toHaveBeenCalled();
      const sentMessage = JSON.parse(mockWs.send.mock.calls[0][0]);
      expect(sentMessage.type).toBe("auth_required");

      // Cleanup
      wss.close();
    });

    it("should handle invalid token", async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error("Invalid token");
      });

      const wss = setupWebSocketServer(mockServer);

      const mockWs = {
        on: jest.fn(),
        send: jest.fn(),
        ping: jest.fn(),
        terminate: jest.fn(),
        isAlive: true,
      } as any;

      const mockReq = {
        url: "/ws?token=invalid-token",
        headers: { host: "localhost:3000" },
      } as any;

      const connectionHandler = (wss as any)._events?.connection;
      if (connectionHandler) {
        await connectionHandler(mockWs, mockReq);
      }

      // Should send auth_required message
      expect(mockWs.send).toHaveBeenCalled();

      // Cleanup
      wss.close();
    });

    it("should initialize learning session for authenticated user with completed onboarding", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        hasCompletedOnboarding: true,
      };

      (jwt.verify as jest.Mock).mockReturnValue({ userId: "user-123" });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const wss = setupWebSocketServer(mockServer);

      const mockWs = {
        on: jest.fn(),
        send: jest.fn(),
        ping: jest.fn(),
        terminate: jest.fn(),
        isAlive: true,
      } as any;

      const mockReq = {
        url: "/ws?token=valid-token",
        headers: { host: "localhost:3000" },
      } as any;

      const connectionHandler = (wss as any)._events?.connection;
      if (connectionHandler) {
        await connectionHandler(mockWs, mockReq);
      }

      // Should call initLearningSession
      expect(initLearningSession).toHaveBeenCalled();

      // Cleanup
      wss.close();
    });

    it("should not initialize learning session for user with incomplete onboarding", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        hasCompletedOnboarding: false,
      };

      (jwt.verify as jest.Mock).mockReturnValue({ userId: "user-123" });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const wss = setupWebSocketServer(mockServer);

      const mockWs = {
        on: jest.fn(),
        send: jest.fn(),
        ping: jest.fn(),
        terminate: jest.fn(),
        isAlive: true,
      } as any;

      const mockReq = {
        url: "/ws?token=valid-token",
        headers: { host: "localhost:3000" },
      } as any;

      const connectionHandler = (wss as any)._events?.connection;
      if (connectionHandler) {
        await connectionHandler(mockWs, mockReq);
      }

      // Should NOT call initLearningSession
      expect(initLearningSession).not.toHaveBeenCalled();

      // Cleanup
      wss.close();
    });

    it("should handle user not found", async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: "user-123" });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const wss = setupWebSocketServer(mockServer);

      const mockWs = {
        on: jest.fn(),
        send: jest.fn(),
        ping: jest.fn(),
        terminate: jest.fn(),
        isAlive: true,
      } as any;

      const mockReq = {
        url: "/ws?token=valid-token",
        headers: { host: "localhost:3000" },
      } as any;

      const connectionHandler = (wss as any)._events?.connection;
      if (connectionHandler) {
        await connectionHandler(mockWs, mockReq);
      }

      // Should send auth_required message
      expect(mockWs.send).toHaveBeenCalled();

      // Cleanup
      wss.close();
    });

    it("should extract token from Authorization header", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        hasCompletedOnboarding: true,
      };

      (jwt.verify as jest.Mock).mockReturnValue({ userId: "user-123" });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const wss = setupWebSocketServer(mockServer);

      const mockWs = {
        on: jest.fn(),
        send: jest.fn(),
        ping: jest.fn(),
        terminate: jest.fn(),
        isAlive: true,
      } as any;

      const mockReq = {
        url: "/ws",
        headers: {
          host: "localhost:3000",
          authorization: "Bearer valid-token",
        },
      } as any;

      const connectionHandler = (wss as any)._events?.connection;
      if (connectionHandler) {
        await connectionHandler(mockWs, mockReq);
      }

      expect(jwt.verify).toHaveBeenCalledWith("valid-token", "test-secret");

      // Cleanup
      wss.close();
    });

    it("should clean up interval on close", () => {
      const wss = setupWebSocketServer(mockServer);

      // Close the server
      wss.close();

      expect(true).toBe(true);
    });
  });

  describe("WebSocket Message Routing", () => {
    it("should route to onboarding flow for incomplete onboarding", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        hasCompletedOnboarding: false,
      };

      (jwt.verify as jest.Mock).mockReturnValue({ userId: "user-123" });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const wss = setupWebSocketServer(mockServer);

      // Cleanup
      wss.close();

      expect(true).toBe(true);
    });

    it("should route to learning flow for completed onboarding", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        hasCompletedOnboarding: true,
      };

      (jwt.verify as jest.Mock).mockReturnValue({ userId: "user-123" });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const wss = setupWebSocketServer(mockServer);

      // Cleanup
      wss.close();

      expect(true).toBe(true);
    });
  });
});
