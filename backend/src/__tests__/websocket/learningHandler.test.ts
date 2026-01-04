import {
  AuthenticatedWebSocket,
  initLearningSession,
  handleLearningFlow,
} from "../../websocket/learningHandler";

// Mock dependencies
jest.mock("../../config/prisma", () => ({
  __esModule: true,
  default: {
    chatSession: {
      update: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    chatMessage: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    userTopic: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    masterTopic: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    progress: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    subtopic: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock("../../utils/ai", () => ({
  streamChatCompletion: jest.fn(),
}));

jest.mock("../../utils/errorHandler", () => ({
  handleWebSocketError: jest.fn((error: any, ws: any, context?: string) => {
    // Simulate the real handleWebSocketError behavior
    if (ws.readyState === 1) {
      // WebSocket.OPEN
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

import prisma from "../../config/prisma";
import { streamChatCompletion } from "../../utils/ai";

describe("Learning Handler", () => {
  let mockWs: AuthenticatedWebSocket;
  let sentMessages: any[];

  beforeEach(() => {
    // Create a mock WebSocket
    sentMessages = [];
    mockWs = {
      send: jest.fn((data: string) => {
        sentMessages.push(JSON.parse(data));
      }),
      userId: "test-user-123",
      userEmail: "test@example.com",
      isAlive: true,
      isAuthenticated: true,
      currentSessionId: undefined,
      currentTopicId: undefined,
      currentSubtopicId: undefined,
    } as any;

    jest.clearAllMocks();
  });

  describe("initLearningSession", () => {
    it("should clear current session state", async () => {
      mockWs.currentSessionId = "old-session-id";
      mockWs.currentTopicId = 123;
      mockWs.currentSubtopicId = 456;

      (prisma.chatSession.update as jest.Mock).mockResolvedValue({});

      await initLearningSession(mockWs);

      expect(mockWs.currentSessionId).toBeUndefined();
      expect(mockWs.currentTopicId).toBeUndefined();
      expect(mockWs.currentSubtopicId).toBeUndefined();
    });

    it("should send initial greeting message", async () => {
      await initLearningSession(mockWs);

      expect(sentMessages).toHaveLength(1);
      expect(sentMessages[0]).toEqual({
        type: "message",
        content: "What do you want to learn today?",
        sender: "assistant",
      });
    });

    it("should update previous session if exists", async () => {
      mockWs.currentSessionId = "existing-session";

      (prisma.chatSession.update as jest.Mock).mockResolvedValue({});

      await initLearningSession(mockWs);

      expect(prisma.chatSession.update).toHaveBeenCalledWith({
        where: { id: "existing-session" },
        data: { lastActivity: expect.any(Date) },
      });
    });

    it("should handle errors when closing previous session gracefully", async () => {
      mockWs.currentSessionId = "existing-session";

      (prisma.chatSession.update as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      // Should not throw
      await expect(initLearningSession(mockWs)).resolves.not.toThrow();

      // Should still send greeting
      expect(sentMessages).toHaveLength(1);
      expect(sentMessages[0].content).toBe("What do you want to learn today?");
    });
  });

  describe("handleLearningFlow", () => {
    it("should reject unauthorized users", async () => {
      const unauthorizedWs = { ...mockWs, userId: undefined } as any;

      await handleLearningFlow(unauthorizedWs, { type: "message" });

      expect(sentMessages).toHaveLength(1);
      expect(sentMessages[0]).toEqual({
        type: "error",
        content: "Unauthorized",
      });
    });

    it("should handle new_chat message type", async () => {
      (prisma.chatSession.update as jest.Mock).mockResolvedValue({});

      await handleLearningFlow(mockWs, { type: "new_chat" });

      expect(sentMessages).toHaveLength(1);
      expect(sentMessages[0].content).toBe("What do you want to learn today?");
    });

    it("should handle topic_selected message type", async () => {
      const message = {
        type: "topic_selected",
        topic: {
          topicId: 1,
          subtopicId: 1,
          name: "JavaScript",
          subtopic: "Basics",
        },
      };

      (prisma.chatSession.create as jest.Mock).mockResolvedValue({
        id: "new-session-id",
      });

      (prisma.chatMessage.create as jest.Mock).mockResolvedValue({});

      await handleLearningFlow(mockWs, message);

      expect(prisma.chatSession.create).toHaveBeenCalled();
      expect(mockWs.currentSessionId).toBe("new-session-id");
      expect(mockWs.currentTopicId).toBe(1);
      expect(mockWs.currentSubtopicId).toBe(1);
    });

    it("should handle session_resumed message type", async () => {
      const message = {
        type: "session_resumed",
        sessionId: "resume-session-id",
        topicId: 2,
        subtopicId: 3,
      };

      (prisma.chatSession.findFirst as jest.Mock).mockResolvedValue({
        id: "resume-session-id",
        userId: "test-user-123",
      });

      await handleLearningFlow(mockWs, message);

      expect(mockWs.currentSessionId).toBe("resume-session-id");
      expect(mockWs.currentTopicId).toBe(2);
      expect(mockWs.currentSubtopicId).toBe(3);
    });

    it("should handle errors gracefully", async () => {
      const message = {
        type: "topic_selected",
        topic: {
          topicId: 1,
          subtopicId: 1,
          name: "Test",
          subtopic: "Test",
        },
      };

      // Mock WebSocket readyState to be OPEN (1)
      Object.defineProperty(mockWs, "readyState", {
        value: 1, // WebSocket.OPEN
        writable: true,
      });

      (prisma.chatSession.create as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      await handleLearningFlow(mockWs, message);

      // Should send error message - check for either format
      const errorMessage = sentMessages.find((msg) => msg.type === "error");
      expect(errorMessage).toBeDefined();
      // The error could have either 'content' or 'error' property depending on the handler
      expect(errorMessage.error || errorMessage.content).toBeDefined();
    });

    it("should handle message type without session as topic generation", async () => {
      const message = {
        type: "message",
        content: "I want to learn Python",
      };

      mockWs.currentSessionId = undefined;

      (streamChatCompletion as jest.Mock).mockResolvedValue("Response");

      await handleLearningFlow(mockWs, message);

      // Should trigger topic generation flow
      expect(streamChatCompletion).toHaveBeenCalled();
    });

    it("should handle message type with session as user message", async () => {
      const message = {
        type: "message",
        content: "Tell me more",
      };

      mockWs.currentSessionId = "active-session";

      (prisma.chatMessage.create as jest.Mock).mockResolvedValue({});
      (prisma.chatSession.update as jest.Mock).mockResolvedValue({});
      (prisma.chatMessage.findMany as jest.Mock).mockResolvedValue([
        { role: "assistant", content: "Hello", createdAt: new Date() },
      ]);
      (prisma.chatSession.findUnique as jest.Mock).mockResolvedValue({
        userTopicId: 1,
        subtopicId: 1,
        userTopic: {
          masterTopic: { name: "JavaScript" },
        },
        subtopic: { title: "Basics", weightage: 10 },
      });
      (prisma.progress.findUnique as jest.Mock).mockResolvedValue({
        completedPercent: 50,
      });

      (streamChatCompletion as jest.Mock).mockResolvedValue("AI Response");

      await handleLearningFlow(mockWs, message);

      expect(prisma.chatMessage.create).toHaveBeenCalled();
      expect(streamChatCompletion).toHaveBeenCalled();
    });

    it("should handle visualizer_check message type", async () => {
      mockWs.currentSessionId = "session-with-history";

      (prisma.chatMessage.findMany as jest.Mock).mockResolvedValue([
        { role: "user", content: "Test", createdAt: new Date() },
      ]);

      (streamChatCompletion as jest.Mock).mockImplementation(
        async ({ onJson }) => {
          if (onJson) {
            onJson({ isVisualizable: true, suggestions: ["Test"] });
          }
          return "Response";
        }
      );

      await handleLearningFlow(mockWs, { type: "visualizer_check" });

      const checkResult = sentMessages.find(
        (msg) => msg.type === "visualizer_check_result"
      );
      expect(checkResult).toBeDefined();
      expect(checkResult.payload.isVisualizable).toBe(true);
    });
  });
});
