import request from "supertest";
import express from "express";
import authRouter from "../../routes/auth";
import { generateToken } from "../../utils/auth";

// Mock dependencies
jest.mock("../../config/prisma", () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

import prisma from "../../config/prisma";

describe("Auth Routes", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/auth", authRouter);
    jest.clearAllMocks();
  });

  describe("GET /api/auth/me", () => {
    it("should return user data for authenticated user", async () => {
      const mockUser = {
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
        skillLevel: "intermediate",
        currentLanguage: "JavaScript",
        totalPoints: 100,
        streakDays: 5,
        background: "Software Developer",
        goals: "Learn AI",
        learningInterests: "Machine Learning",
        hasCompletedOnboarding: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const token = generateToken({
        userId: "user-123",
        email: "test@example.com",
      });

      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
      });
    });

    it("should return 401 without authentication token", async () => {
      const response = await request(app).get("/api/auth/me");

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Access token required");
    });

    it("should return 403 with invalid token", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(403);
      expect(response.body.error).toBe("Invalid or expired token");
    });

    it("should return 404 if user not found", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const token = generateToken({
        userId: "non-existent-user",
        email: "test@example.com",
      });

      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("User not found");
    });

    it("should return 500 on database error", async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const token = generateToken({
        userId: "user-123",
        email: "test@example.com",
      });

      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Failed to fetch user data");
    });
  });
});
