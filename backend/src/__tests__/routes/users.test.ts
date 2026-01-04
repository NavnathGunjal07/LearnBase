import request from "supertest";
import express from "express";
import usersRouter from "../../routes/users";
import { generateToken } from "../../utils/auth";

// Mock dependencies
jest.mock("../../config/prisma", () => ({
  __esModule: true,
  default: {
    user: {
      update: jest.fn(),
      delete: jest.fn(),
    },
    chatSession: {
      findFirst: jest.fn(),
    },
  },
}));

import prisma from "../../config/prisma";

describe("Users Routes", () => {
  let app: express.Application;
  let authToken: string;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/users", usersRouter);

    authToken = generateToken({
      userId: "test-user-123",
      email: "test@example.com",
    });

    jest.clearAllMocks();
  });

  describe("GET /api/users/me/last-session", () => {
    it("should return last learning session", async () => {
      const mockSession = {
        id: "session-123",
        userId: "test-user-123",
        lastActivity: new Date(),
        subtopicId: 1,
        userTopic: {
          masterTopicId: 1,
          masterTopic: {
            name: "JavaScript",
          },
        },
        subtopic: {
          title: "Basics",
        },
      };

      (prisma.chatSession.findFirst as jest.Mock).mockResolvedValue(
        mockSession
      );

      const response = await request(app)
        .get("/api/users/me/last-session")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        hasSession: true,
        topicId: 1,
        topicName: "JavaScript",
        subtopicId: 1,
        subtopicName: "Basics",
        lastActivity: mockSession.lastActivity.toISOString(),
      });
    });

    it("should return hasSession false when no session exists", async () => {
      (prisma.chatSession.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get("/api/users/me/last-session")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ hasSession: false });
    });

    it("should return 401 without authentication", async () => {
      const response = await request(app).get("/api/users/me/last-session");

      expect(response.status).toBe(401);
    });

    it("should return 500 on database error", async () => {
      (prisma.chatSession.findFirst as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const response = await request(app)
        .get("/api/users/me/last-session")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Internal server error");
    });
  });
});
