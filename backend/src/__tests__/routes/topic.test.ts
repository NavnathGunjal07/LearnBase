import request from "supertest";
import express from "express";
import topicRouter from "../../routes/topic";
import { generateToken } from "../../utils/auth";

// Mock dependencies
jest.mock("../../config/prisma", () => ({
  __esModule: true,
  default: {
    masterTopic: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    userTopic: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("../../middleware/rateLimiter", () => ({
  apiLimiter: (req: any, res: any, next: any) => next(),
  createLimiter: (req: any, res: any, next: any) => next(),
}));

import prisma from "../../config/prisma";

describe("Topic Routes", () => {
  let app: express.Application;
  let authToken: string;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/topics", topicRouter);

    authToken = generateToken({
      userId: "test-user-123",
      email: "test@example.com",
    });

    jest.clearAllMocks();
  });

  describe("GET /api/topics", () => {
    it("should return all active master topics", async () => {
      const mockTopics = [
        {
          id: 1,
          name: "JavaScript",
          slug: "javascript",
          description: "Learn JavaScript",
          iconUrl: "icon.png",
          category: "Programming",
        },
        {
          id: 2,
          name: "Python",
          slug: "python",
          description: "Learn Python",
          iconUrl: "icon2.png",
          category: "Programming",
        },
      ];

      (prisma.masterTopic.findMany as jest.Mock).mockResolvedValue(mockTopics);

      const response = await request(app).get("/api/topics");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockTopics);
      expect(prisma.masterTopic.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { orderIndex: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          iconUrl: true,
          category: true,
        },
      });
    });

    it("should return 500 on database error", async () => {
      (prisma.masterTopic.findMany as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const response = await request(app).get("/api/topics");

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Internal server error");
    });
  });

  describe("GET /api/topics/user", () => {
    it("should return user enrolled topics with progress", async () => {
      const mockUserTopics = [
        {
          id: 1,
          masterTopicId: 1,
          completedPercent: 50,
          enrolledAt: new Date(),
          lastAccessedAt: new Date(),
          masterTopic: {
            name: "JavaScript",
            description: "Learn JS",
            iconUrl: "icon.png",
            category: "Programming",
            subtopics: [
              {
                id: 1,
                title: "Basics",
                description: "JS Basics",
                difficultyLevel: "beginner",
                orderIndex: 1,
              },
            ],
          },
          progress: [
            {
              subtopicId: 1,
              completedPercent: 75,
            },
          ],
        },
      ];

      (prisma.userTopic.findMany as jest.Mock).mockResolvedValue(
        mockUserTopics
      );

      const response = await request(app)
        .get("/api/topics/user")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe("JavaScript");
      expect(response.body[0].subtopics[0].progress).toBe(75);
    });

    it("should return 401 without authentication", async () => {
      const response = await request(app).get("/api/topics/user");

      expect(response.status).toBe(401);
    });

    it("should return 500 on database error", async () => {
      (prisma.userTopic.findMany as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const response = await request(app)
        .get("/api/topics/user")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Internal server error");
    });
  });

  describe("GET /api/topics/:id", () => {
    it("should return specific topic with subtopics", async () => {
      const mockTopic = {
        id: 1,
        name: "JavaScript",
        description: "Learn JavaScript",
        subtopics: [
          {
            id: 1,
            title: "Basics",
            orderIndex: 1,
          },
        ],
      };

      (prisma.masterTopic.findUnique as jest.Mock).mockResolvedValue(mockTopic);

      const response = await request(app).get("/api/topics/1");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockTopic);
      expect(prisma.masterTopic.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          subtopics: {
            orderBy: { orderIndex: "asc" },
          },
        },
      });
    });

    it("should return 404 if topic not found", async () => {
      (prisma.masterTopic.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get("/api/topics/999");

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Master topic not found");
    });

    it("should return 500 on database error", async () => {
      (prisma.masterTopic.findUnique as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const response = await request(app).get("/api/topics/1");

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Internal server error");
    });
  });

  describe("POST /api/topics/enroll", () => {
    it("should enroll user in a topic successfully", async () => {
      const mockMasterTopic = {
        id: 1,
        name: "JavaScript",
        subtopics: [
          {
            id: 1,
            title: "Basics",
            difficultyLevel: "beginner",
            orderIndex: 1,
          },
        ],
      };

      const mockUserTopic = {
        id: 1,
        enrolledAt: new Date(),
        completedPercent: 0,
        masterTopic: mockMasterTopic,
      };

      (prisma.masterTopic.findUnique as jest.Mock).mockResolvedValue(
        mockMasterTopic
      );
      (prisma.userTopic.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.userTopic.create as jest.Mock).mockResolvedValue(mockUserTopic);

      const response = await request(app)
        .post("/api/topics/enroll")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ topicId: 1 });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe("JavaScript");
      expect(response.body.subtopics).toHaveLength(1);
    });

    it("should return 400 if topicId is missing", async () => {
      const response = await request(app)
        .post("/api/topics/enroll")
        .set("Authorization", `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Topic ID is required");
    });

    it("should return 404 if master topic not found", async () => {
      (prisma.masterTopic.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post("/api/topics/enroll")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ topicId: 999 });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Master topic not found");
    });

    it("should return 400 if already enrolled", async () => {
      const mockMasterTopic = { id: 1, name: "JavaScript", subtopics: [] };
      const mockExistingEnrollment = { id: 1, userId: "test-user-123" };

      (prisma.masterTopic.findUnique as jest.Mock).mockResolvedValue(
        mockMasterTopic
      );
      (prisma.userTopic.findUnique as jest.Mock).mockResolvedValue(
        mockExistingEnrollment
      );

      const response = await request(app)
        .post("/api/topics/enroll")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ topicId: 1 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Already enrolled in this topic");
    });

    it("should return 401 without authentication", async () => {
      const response = await request(app)
        .post("/api/topics/enroll")
        .send({ topicId: 1 });

      expect(response.status).toBe(401);
    });

    it("should return 500 on database error", async () => {
      (prisma.masterTopic.findUnique as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const response = await request(app)
        .post("/api/topics/enroll")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ topicId: 1 });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Internal server error");
    });
  });

  describe("DELETE /api/topics/:userTopicId", () => {
    it("should unenroll user from topic successfully", async () => {
      const mockUserTopic = {
        id: 1,
        userId: "test-user-123",
      };

      (prisma.userTopic.findFirst as jest.Mock).mockResolvedValue(
        mockUserTopic
      );
      (prisma.userTopic.update as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .delete("/api/topics/1")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Successfully unenrolled from topic");
      expect(prisma.userTopic.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isActive: false },
      });
    });

    it("should return 400 for invalid userTopicId", async () => {
      const response = await request(app)
        .delete("/api/topics/invalid")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid user topic ID");
    });

    it("should return 404 if user topic not found", async () => {
      (prisma.userTopic.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .delete("/api/topics/999")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("User topic not found");
    });

    it("should return 401 without authentication", async () => {
      const response = await request(app).delete("/api/topics/1");

      expect(response.status).toBe(401);
    });

    it("should return 500 on database error", async () => {
      (prisma.userTopic.findFirst as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const response = await request(app)
        .delete("/api/topics/1")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Internal server error");
    });
  });
});
