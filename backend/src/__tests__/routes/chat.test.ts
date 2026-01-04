import request from "supertest";
import express from "express";
import chatRouter from "../../routes/chat";
import { generateToken } from "../../utils/auth";

// Mock dependencies
jest.mock("../../config/prisma", () => ({
  __esModule: true,
  default: {
    userTopic: {
      findFirst: jest.fn(),
    },
    chatSession: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    chatMessage: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    subtopic: {
      findUnique: jest.fn(),
    },
    masterTopic: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("../../middleware/rateLimiter", () => ({
  chatLimiter: (req: any, res: any, next: any) => next(),
}));

import prisma from "../../config/prisma";

describe("Chat Routes", () => {
  let app: express.Application;
  let authToken: string;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/chat", chatRouter);

    authToken = generateToken({
      userId: "test-user-123",
      email: "test@example.com",
    });

    jest.clearAllMocks();
  });

  describe("GET /api/chat/history", () => {
    it("should return chat history for existing session", async () => {
      const mockUserTopic = { id: 1, userId: "test-user-123" };
      const mockSession = {
        id: "session-123",
        userId: "test-user-123",
      };
      const mockMessages = [
        {
          id: 1,
          role: "user",
          content: "Hello",
          createdAt: new Date(),
        },
        {
          id: 2,
          role: "assistant",
          content: "Hi there!",
          createdAt: new Date(),
        },
      ];

      (prisma.userTopic.findFirst as jest.Mock).mockResolvedValue(
        mockUserTopic
      );
      (prisma.chatSession.findFirst as jest.Mock).mockResolvedValue(
        mockSession
      );
      (prisma.chatMessage.findMany as jest.Mock).mockResolvedValue(
        mockMessages
      );

      const response = await request(app)
        .get("/api/chat/history?topicId=1")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.sessionId).toBe("session-123");
      expect(response.body.messages).toHaveLength(2);
      expect(response.body.messages[0].sender).toBe("user");
      expect(response.body.messages[1].sender).toBe("assistant");
    });

    it("should create new session if none exists", async () => {
      const mockUserTopic = { id: 1, userId: "test-user-123" };
      const mockMasterTopic = { id: 1, name: "JavaScript" };
      const mockNewSession = {
        id: "new-session-123",
        userId: "test-user-123",
      };

      (prisma.userTopic.findFirst as jest.Mock).mockResolvedValue(
        mockUserTopic
      );
      (prisma.chatSession.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.masterTopic.findUnique as jest.Mock).mockResolvedValue(
        mockMasterTopic
      );
      (prisma.chatSession.create as jest.Mock).mockResolvedValue(
        mockNewSession
      );
      (prisma.chatMessage.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get("/api/chat/history?topicId=1")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.sessionId).toBe("new-session-123");
      expect(prisma.chatSession.create).toHaveBeenCalled();
    });

    it("should return 400 if topicId is missing", async () => {
      const response = await request(app)
        .get("/api/chat/history")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Topic ID is required");
    });

    it("should return empty messages if user topic not found", async () => {
      (prisma.userTopic.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get("/api/chat/history?topicId=999")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.messages).toEqual([]);
    });

    it("should return 401 without authentication", async () => {
      const response = await request(app).get("/api/chat/history?topicId=1");

      expect(response.status).toBe(401);
    });

    it("should return 500 on database error", async () => {
      (prisma.userTopic.findFirst as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const response = await request(app)
        .get("/api/chat/history?topicId=1")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Failed to fetch chat history");
    });
  });

  describe("POST /api/chat/message", () => {
    it("should save message with existing session", async () => {
      const mockMessage = {
        id: 1,
        chatId: "session-123",
        content: "Test message",
      };

      (prisma.chatMessage.create as jest.Mock).mockResolvedValue(mockMessage);
      (prisma.chatSession.update as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .post("/api/chat/message")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          sessionId: "session-123",
          role: "user",
          content: "Test message",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.sessionId).toBe("session-123");
      expect(prisma.chatMessage.create).toHaveBeenCalled();
      expect(prisma.chatSession.update).toHaveBeenCalled();
    });

    it("should create session if not provided with topicId", async () => {
      const mockUserTopic = { id: 1 };
      const mockMasterTopic = { id: 1, name: "JavaScript" };
      const mockSession = { id: "new-session-123" };
      const mockMessage = { id: 1 };

      (prisma.userTopic.findFirst as jest.Mock).mockResolvedValue(
        mockUserTopic
      );
      (prisma.chatSession.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.masterTopic.findUnique as jest.Mock).mockResolvedValue(
        mockMasterTopic
      );
      (prisma.chatSession.create as jest.Mock).mockResolvedValue(mockSession);
      (prisma.chatMessage.create as jest.Mock).mockResolvedValue(mockMessage);
      (prisma.chatSession.update as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .post("/api/chat/message")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          topicId: "1",
          role: "user",
          content: "Test message",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(prisma.chatSession.create).toHaveBeenCalled();
    });

    it("should return 400 if content is missing", async () => {
      const response = await request(app)
        .post("/api/chat/message")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          sessionId: "session-123",
          role: "user",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Message content is required");
    });

    it("should return 400 if neither sessionId nor topicId provided", async () => {
      const response = await request(app)
        .post("/api/chat/message")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          role: "user",
          content: "Test message",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Session ID or topic ID is required");
    });

    it("should return 404 if user topic not found", async () => {
      (prisma.userTopic.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post("/api/chat/message")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          topicId: "999",
          role: "user",
          content: "Test message",
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("User topic not found");
    });

    it("should return 401 without authentication", async () => {
      const response = await request(app).post("/api/chat/message").send({
        sessionId: "session-123",
        content: "Test",
      });

      expect(response.status).toBe(401);
    });

    it("should return 500 on database error", async () => {
      (prisma.chatMessage.create as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const response = await request(app)
        .post("/api/chat/message")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          sessionId: "session-123",
          role: "user",
          content: "Test message",
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Failed to save message");
    });
  });

  describe("DELETE /api/chat/history", () => {
    it("should clear chat history successfully", async () => {
      const mockUserTopic = { id: 1 };

      (prisma.userTopic.findFirst as jest.Mock).mockResolvedValue(
        mockUserTopic
      );
      (prisma.chatSession.deleteMany as jest.Mock).mockResolvedValue({
        count: 2,
      });

      const response = await request(app)
        .delete("/api/chat/history?topicId=1")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Chat history cleared");
      expect(prisma.chatSession.deleteMany).toHaveBeenCalled();
    });

    it("should return success if no chat history found", async () => {
      (prisma.userTopic.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .delete("/api/chat/history?topicId=999")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("No chat history found");
    });

    it("should return 400 if topicId is missing", async () => {
      const response = await request(app)
        .delete("/api/chat/history")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Topic ID is required");
    });

    it("should return 401 without authentication", async () => {
      const response = await request(app).delete("/api/chat/history?topicId=1");

      expect(response.status).toBe(401);
    });

    it("should return 500 on database error", async () => {
      (prisma.userTopic.findFirst as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const response = await request(app)
        .delete("/api/chat/history?topicId=1")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Failed to clear chat history");
    });
  });
});
