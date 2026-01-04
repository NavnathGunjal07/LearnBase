import request from "supertest";
import express from "express";
import onboardingRouter from "../../routes/onboarding";
import { generateToken } from "../../utils/auth";

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

import prisma from "../../config/prisma";

describe("Onboarding Routes", () => {
  let app: express.Application;
  let authToken: string;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/onboarding", onboardingRouter);

    authToken = generateToken({
      userId: "test-user-123",
      email: "test@example.com",
    });

    jest.clearAllMocks();
  });

  describe("GET /api/onboarding/status", () => {
    it("should return onboarding status for authenticated user", async () => {
      const mockUser = {
        hasCompletedOnboarding: true,
        background: "Software Developer",
        goals: "Learn AI",
        learningInterests: "Machine Learning, Python",
        skillLevel: "intermediate",
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .get("/api/onboarding/status")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        hasCompletedOnboarding: true,
        onboardingData: {
          background: "Software Developer",
          goals: "Learn AI",
          learningInterests: "Machine Learning, Python",
          skillLevel: "intermediate",
        },
      });
    });

    it("should return 404 if user not found", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get("/api/onboarding/status")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("User not found");
    });

    it("should return 401 without authentication", async () => {
      const response = await request(app).get("/api/onboarding/status");

      expect(response.status).toBe(401);
    });
  });

  describe("PATCH /api/onboarding/update", () => {
    it("should update onboarding data", async () => {
      const updateData = {
        background: "Updated Background",
        goals: "Updated Goals",
        learningInterests: "Updated Interests",
        skillLevel: "advanced",
      };

      const updatedUser = {
        id: "test-user-123",
        name: "Test User",
        email: "test@example.com",
        ...updateData,
        hasCompletedOnboarding: false,
        currentLanguage: "JavaScript",
        totalPoints: 0,
        streakDays: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const response = await request(app)
        .patch("/api/onboarding/update")
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.user).toMatchObject(updateData);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "test-user-123" },
        data: updateData,
        select: expect.any(Object),
      });
    });

    it("should handle partial updates", async () => {
      const partialUpdate = {
        background: "Only Background Updated",
      };

      const updatedUser = {
        id: "test-user-123",
        background: "Only Background Updated",
        goals: "Original Goals",
        learningInterests: "Original Interests",
        skillLevel: "beginner",
      };

      (prisma.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const response = await request(app)
        .patch("/api/onboarding/update")
        .set("Authorization", `Bearer ${authToken}`)
        .send(partialUpdate);

      expect(response.status).toBe(200);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "test-user-123" },
        data: partialUpdate,
        select: expect.any(Object),
      });
    });

    it("should return 500 on database error", async () => {
      (prisma.user.update as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const response = await request(app)
        .patch("/api/onboarding/update")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ background: "Test" });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Internal server error");
    });
  });

  describe("POST /api/onboarding/complete", () => {
    it("should complete onboarding with all data", async () => {
      const onboardingData = {
        background: "Software Engineer",
        goals: "Master Full Stack",
        learningInterests: "React, Node.js",
        skillLevel: "intermediate",
      };

      const completedUser = {
        id: "test-user-123",
        name: "Test User",
        email: "test@example.com",
        ...onboardingData,
        hasCompletedOnboarding: true,
        currentLanguage: "JavaScript",
        totalPoints: 0,
        streakDays: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.update as jest.Mock).mockResolvedValue(completedUser);

      const response = await request(app)
        .post("/api/onboarding/complete")
        .set("Authorization", `Bearer ${authToken}`)
        .send(onboardingData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.hasCompletedOnboarding).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "test-user-123" },
        data: {
          hasCompletedOnboarding: true,
          ...onboardingData,
        },
        select: expect.any(Object),
      });
    });

    it("should complete onboarding with minimal data", async () => {
      const completedUser = {
        id: "test-user-123",
        hasCompletedOnboarding: true,
      };

      (prisma.user.update as jest.Mock).mockResolvedValue(completedUser);

      const response = await request(app)
        .post("/api/onboarding/complete")
        .set("Authorization", `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "test-user-123" },
        data: { hasCompletedOnboarding: true },
        select: expect.any(Object),
      });
    });

    it("should return 500 on database error", async () => {
      (prisma.user.update as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const response = await request(app)
        .post("/api/onboarding/complete")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ background: "Test" });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Internal server error");
    });
  });
});
