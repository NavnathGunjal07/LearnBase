import request from "supertest";
import express from "express";
import subtopicRouter from "../../routes/subtopic";
import { generateToken } from "../../utils/auth";

// Mock dependencies
jest.mock("../../config/prisma", () => ({
  __esModule: true,
  default: {
    userTopic: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    progress: {
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
    subtopic: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock("../../middleware/rateLimiter", () => ({
  apiLimiter: (req: any, res: any, next: any) => next(),
}));

import prisma from "../../config/prisma";

describe("Subtopic Routes", () => {
  let app: express.Application;
  let authToken: string;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/subtopics", subtopicRouter);

    authToken = generateToken({
      userId: "test-user-123",
      email: "test@example.com",
    });

    jest.clearAllMocks();
  });

  describe("PATCH /api/subtopics/:userTopicId/:subtopicId/progress", () => {
    it("should update subtopic progress successfully", async () => {
      const mockUserTopic = {
        id: 1,
        userId: "test-user-123",
        masterTopicId: 1,
      };

      const mockProgress = {
        userId: "test-user-123",
        userTopicId: 1,
        subtopicId: 1,
        completedPercent: 75,
      };

      const mockSubtopics = [
        { id: 1, weightage: 50 },
        { id: 2, weightage: 50 },
      ];

      const mockAllProgress = [
        { subtopicId: 1, completedPercent: 75 },
        { subtopicId: 2, completedPercent: 25 },
      ];

      (prisma.userTopic.findFirst as jest.Mock).mockResolvedValue(
        mockUserTopic
      );
      (prisma.progress.upsert as jest.Mock).mockResolvedValue(mockProgress);
      (prisma.userTopic.findUnique as jest.Mock).mockResolvedValue({
        masterTopicId: 1,
      });
      (prisma.subtopic.findMany as jest.Mock).mockResolvedValue(mockSubtopics);
      (prisma.progress.findMany as jest.Mock).mockResolvedValue(
        mockAllProgress
      );
      (prisma.userTopic.update as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .patch("/api/subtopics/1/1/progress")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ completedPercent: 75 });

      expect(response.status).toBe(200);
      expect(response.body.completedPercent).toBe(75);
      expect(prisma.progress.upsert).toHaveBeenCalled();
      expect(prisma.userTopic.update).toHaveBeenCalled();
    });

    it("should return 400 for invalid IDs", async () => {
      const response = await request(app)
        .patch("/api/subtopics/invalid/invalid/progress")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ completedPercent: 50 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid IDs");
    });

    it("should return 400 for invalid progress value (negative)", async () => {
      const response = await request(app)
        .patch("/api/subtopics/1/1/progress")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ completedPercent: -10 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid progress value (0-100)");
    });

    it("should return 400 for invalid progress value (over 100)", async () => {
      const response = await request(app)
        .patch("/api/subtopics/1/1/progress")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ completedPercent: 150 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid progress value (0-100)");
    });

    it("should return 400 for missing completedPercent", async () => {
      const response = await request(app)
        .patch("/api/subtopics/1/1/progress")
        .set("Authorization", `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid progress value (0-100)");
    });

    it("should return 404 if user topic not found", async () => {
      (prisma.userTopic.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .patch("/api/subtopics/999/1/progress")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ completedPercent: 50 });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("User topic not found");
    });

    it("should return 401 without authentication", async () => {
      const response = await request(app)
        .patch("/api/subtopics/1/1/progress")
        .send({ completedPercent: 50 });

      expect(response.status).toBe(401);
    });

    it("should handle progress update with 0%", async () => {
      const mockUserTopic = {
        id: 1,
        userId: "test-user-123",
        masterTopicId: 1,
      };

      const mockProgress = {
        userId: "test-user-123",
        userTopicId: 1,
        subtopicId: 1,
        completedPercent: 0,
      };

      (prisma.userTopic.findFirst as jest.Mock).mockResolvedValue(
        mockUserTopic
      );
      (prisma.progress.upsert as jest.Mock).mockResolvedValue(mockProgress);
      (prisma.userTopic.findUnique as jest.Mock).mockResolvedValue({
        masterTopicId: 1,
      });
      (prisma.subtopic.findMany as jest.Mock).mockResolvedValue([
        { id: 1, weightage: 100 },
      ]);
      (prisma.progress.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.userTopic.update as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .patch("/api/subtopics/1/1/progress")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ completedPercent: 0 });

      expect(response.status).toBe(200);
      expect(response.body.completedPercent).toBe(0);
    });

    it("should handle progress update with 100%", async () => {
      const mockUserTopic = {
        id: 1,
        userId: "test-user-123",
        masterTopicId: 1,
      };

      const mockProgress = {
        userId: "test-user-123",
        userTopicId: 1,
        subtopicId: 1,
        completedPercent: 100,
      };

      (prisma.userTopic.findFirst as jest.Mock).mockResolvedValue(
        mockUserTopic
      );
      (prisma.progress.upsert as jest.Mock).mockResolvedValue(mockProgress);
      (prisma.userTopic.findUnique as jest.Mock).mockResolvedValue({
        masterTopicId: 1,
      });
      (prisma.subtopic.findMany as jest.Mock).mockResolvedValue([
        { id: 1, weightage: 100 },
      ]);
      (prisma.progress.findMany as jest.Mock).mockResolvedValue([
        { subtopicId: 1, completedPercent: 100 },
      ]);
      (prisma.userTopic.update as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .patch("/api/subtopics/1/1/progress")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ completedPercent: 100 });

      expect(response.status).toBe(200);
      expect(response.body.completedPercent).toBe(100);
    });

    it("should calculate weighted progress correctly", async () => {
      const mockUserTopic = {
        id: 1,
        userId: "test-user-123",
        masterTopicId: 1,
      };

      const mockProgress = {
        userId: "test-user-123",
        userTopicId: 1,
        subtopicId: 1,
        completedPercent: 100,
      };

      // Two subtopics: one 100% complete (weight 30), one 0% complete (weight 70)
      // Expected weighted average: (100 * 30 + 0 * 70) / 100 = 30
      const mockSubtopics = [
        { id: 1, weightage: 30 },
        { id: 2, weightage: 70 },
      ];

      const mockAllProgress = [{ subtopicId: 1, completedPercent: 100 }];

      (prisma.userTopic.findFirst as jest.Mock).mockResolvedValue(
        mockUserTopic
      );
      (prisma.progress.upsert as jest.Mock).mockResolvedValue(mockProgress);
      (prisma.userTopic.findUnique as jest.Mock).mockResolvedValue({
        masterTopicId: 1,
      });
      (prisma.subtopic.findMany as jest.Mock).mockResolvedValue(mockSubtopics);
      (prisma.progress.findMany as jest.Mock).mockResolvedValue(
        mockAllProgress
      );
      (prisma.userTopic.update as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .patch("/api/subtopics/1/1/progress")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ completedPercent: 100 });

      expect(response.status).toBe(200);
      // Verify that userTopic.update was called with the correct weighted progress
      expect(prisma.userTopic.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          completedPercent: 30, // (100 * 30 + 0 * 70) / 100
          lastAccessedAt: expect.any(Date),
        },
      });
    });

    it("should return 500 on database error", async () => {
      (prisma.userTopic.findFirst as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const response = await request(app)
        .patch("/api/subtopics/1/1/progress")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ completedPercent: 50 });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Internal server error");
    });
  });
});
