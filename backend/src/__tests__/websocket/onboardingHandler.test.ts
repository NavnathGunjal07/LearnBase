import {
  AuthenticatedWebSocket,
  handleOnboardingFlow,
} from "../../websocket/onboardingHandler";

// Mock dependencies
jest.mock("../../config/prisma", () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("../../utils/errorHandler", () => ({
  handleWebSocketError: jest.fn((error: any, ws: any, context?: string) => {
    if (ws.readyState === 1) {
      ws.send(
        JSON.stringify({
          type: "error",
          error: {
            type: "WEBSOCKET_ERROR",
            message: error.message || "An error occurred",
          },
        })
      );
    }
  }),
}));

jest.mock("../../websocket/learningHandler", () => ({
  initLearningSession: jest.fn(),
}));

import prisma from "../../config/prisma";
import { initLearningSession } from "../../websocket/learningHandler";

describe("Onboarding Handler", () => {
  let mockWs: AuthenticatedWebSocket;
  let sentMessages: any[];

  beforeEach(() => {
    sentMessages = [];
    mockWs = {
      send: jest.fn((data: string) => {
        sentMessages.push(JSON.parse(data));
      }),
      userId: "test-user-123",
      userEmail: "test@example.com",
      isAlive: true,
      isAuthenticated: true,
      hasCompletedOnboarding: false,
      onboardingMessages: [],
      readyState: 1,
    } as any;

    jest.clearAllMocks();
  });

  describe("handleOnboardingFlow", () => {
    it("should handle name input", async () => {
      const mockUser = {
        id: "test-user-123",
        name: null,
        learningInterests: null,
        goals: null,
        background: null,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        name: "John Doe",
      });

      await handleOnboardingFlow(mockWs, {
        type: "onboarding_message",
        content: "John Doe",
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "test-user-123" },
        data: { name: "John Doe" },
      });

      // Should send next prompt (interests)
      const lastMessage = sentMessages[sentMessages.length - 1];
      expect(lastMessage.type).toBe("message");
    });

    it("should handle interests input", async () => {
      const mockUser = {
        id: "test-user-123",
        name: "John Doe",
        learningInterests: null,
        goals: null,
        background: null,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        learningInterests: "JavaScript, Python",
      });

      await handleOnboardingFlow(mockWs, {
        type: "onboarding_message",
        content: "JavaScript, Python",
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "test-user-123" },
        data: { learningInterests: "JavaScript, Python" },
      });
    });

    it("should handle goals input", async () => {
      const mockUser = {
        id: "test-user-123",
        name: "John Doe",
        learningInterests: "JavaScript, Python",
        goals: null,
        background: null,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        goals: "Become a full-stack developer",
      });

      await handleOnboardingFlow(mockWs, {
        type: "onboarding_message",
        content: "Become a full-stack developer",
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "test-user-123" },
        data: { goals: "Become a full-stack developer" },
      });
    });

    it("should handle education/background input", async () => {
      const mockUser = {
        id: "test-user-123",
        name: "John Doe",
        learningInterests: "JavaScript, Python",
        goals: "Become a full-stack developer",
        background: null,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        background: "Computer Science student",
        hasCompletedOnboarding: true,
      });

      await handleOnboardingFlow(mockWs, {
        type: "onboarding_message",
        content: "Computer Science student",
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "test-user-123" },
        data: {
          background: "Computer Science student",
          hasCompletedOnboarding: true,
        },
      });

      // Should initialize learning session after onboarding complete
      expect(initLearningSession).toHaveBeenCalledWith(mockWs);
    });

    it("should reject empty name input", async () => {
      const mockUser = {
        id: "test-user-123",
        name: null,
        learningInterests: null,
        goals: null,
        background: null,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await handleOnboardingFlow(mockWs, {
        type: "onboarding_message",
        content: "   ",
      });

      expect(prisma.user.update).not.toHaveBeenCalled();

      // Should send error or retry message
      const errorMessage = sentMessages.find(
        (msg) => msg.type === "message" && msg.content.includes("name")
      );
      expect(errorMessage).toBeDefined();
    });

    it("should reject invalid interests input", async () => {
      const mockUser = {
        id: "test-user-123",
        name: "John Doe",
        learningInterests: null,
        goals: null,
        background: null,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await handleOnboardingFlow(mockWs, {
        type: "onboarding_message",
        content: ",,,",
      });

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("should handle unauthorized user", async () => {
      const unauthorizedWs = { ...mockWs, userId: undefined } as any;

      await handleOnboardingFlow(unauthorizedWs, {
        type: "onboarding_message",
        content: "Test",
      });

      const errorMessage = sentMessages.find((msg) => msg.type === "error");
      expect(errorMessage).toBeDefined();
    });

    it("should handle database errors gracefully", async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      await handleOnboardingFlow(mockWs, {
        type: "onboarding_message",
        content: "John Doe",
      });

      const errorMessage = sentMessages.find((msg) => msg.type === "error");
      expect(errorMessage).toBeDefined();
    });

    it("should send initial prompt when user has no data", async () => {
      const mockUser = {
        id: "test-user-123",
        name: null,
        learningInterests: null,
        goals: null,
        background: null,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await handleOnboardingFlow(mockWs, {
        type: "onboarding_start",
      });

      // Should send name prompt
      const namePrompt = sentMessages.find(
        (msg) =>
          msg.type === "message" && msg.content.toLowerCase().includes("name")
      );
      expect(namePrompt).toBeDefined();
    });

    it("should resume from correct step if partially completed", async () => {
      const mockUser = {
        id: "test-user-123",
        name: "John Doe",
        learningInterests: "JavaScript",
        goals: null,
        background: null,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await handleOnboardingFlow(mockWs, {
        type: "onboarding_start",
      });

      // Should send goals prompt (next incomplete step)
      const goalsPrompt = sentMessages.find(
        (msg) =>
          msg.type === "message" && msg.content.toLowerCase().includes("goal")
      );
      expect(goalsPrompt).toBeDefined();
    });
  });
});
