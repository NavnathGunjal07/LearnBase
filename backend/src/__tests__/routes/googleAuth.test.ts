import request from "supertest";
import express from "express";
import googleAuthRouter from "../../routes/googleAuth";

// Mock dependencies
jest.mock("../../config/passport", () => ({
  __esModule: true,
  default: {
    authenticate: jest.fn(() => (req: any, res: any, next: any) => {
      // Mock successful authentication
      req.user = { id: "test-user-123", email: "test@example.com" };
      next();
    }),
  },
}));

jest.mock("../../config/prisma", () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Mock fetch globally
global.fetch = jest.fn();

import prisma from "../../config/prisma";

describe("Google Auth Routes", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/auth", googleAuthRouter);

    jest.clearAllMocks();
  });

  describe("POST /api/auth/google/onetap", () => {
    it("should authenticate with valid Google token", async () => {
      const mockGooglePayload = {
        email: "test@example.com",
        name: "Test User",
        sub: "google-id-123",
        picture: "https://example.com/photo.jpg",
      };

      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockGooglePayload,
      });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post("/api/auth/google/onetap")
        .send({ token: "valid-google-token" });

      expect(response.status).toBe(200);
      expect(response.body.redirectUrl).toContain("/auth?token=");
      expect(response.body.redirectUrl).toContain("userId=user-123");
    });

    it("should create new user if not exists", async () => {
      const mockGooglePayload = {
        email: "newuser@example.com",
        name: "New User",
        sub: "google-id-456",
        picture: "https://example.com/photo.jpg",
      };

      const mockNewUser = {
        id: "new-user-456",
        email: "newuser@example.com",
        name: "New User",
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockGooglePayload,
      });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockNewUser);

      const response = await request(app)
        .post("/api/auth/google/onetap")
        .send({ token: "valid-google-token" });

      expect(response.status).toBe(200);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: "newuser@example.com",
          name: "New User",
          googleId: "google-id-456",
          profilePicture: "https://example.com/photo.jpg",
          onboardingStep: "ASK_INTERESTS",
        },
      });
      expect(response.body.redirectUrl).toContain("userId=new-user-456");
    });

    it("should return 400 if no token provided", async () => {
      const response = await request(app)
        .post("/api/auth/google/onetap")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("No token provided");
    });

    it("should return 401 for invalid token", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({ error: "invalid_token" }),
      });

      const response = await request(app)
        .post("/api/auth/google/onetap")
        .send({ token: "invalid-token" });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Invalid token");
    });

    it("should return 401 if email not in payload", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({ sub: "google-id" }), // Missing email
      });

      const response = await request(app)
        .post("/api/auth/google/onetap")
        .send({ token: "token-without-email" });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Invalid token");
    });

    it("should handle fetch errors gracefully", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      const response = await request(app)
        .post("/api/auth/google/onetap")
        .send({ token: "valid-token" });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Internal server error");
    });

    it("should handle database errors gracefully", async () => {
      const mockGooglePayload = {
        email: "test@example.com",
        name: "Test User",
        sub: "google-id-123",
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockGooglePayload,
      });

      (prisma.user.findUnique as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const response = await request(app)
        .post("/api/auth/google/onetap")
        .send({ token: "valid-token" });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Internal server error");
    });

    it("should use email as fallback name if name not provided", async () => {
      const mockGooglePayload = {
        email: "testuser@example.com",
        sub: "google-id-789",
      };

      const mockNewUser = {
        id: "new-user-789",
        email: "testuser@example.com",
        name: "testuser",
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockGooglePayload,
      });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockNewUser);

      const response = await request(app)
        .post("/api/auth/google/onetap")
        .send({ token: "valid-token" });

      expect(response.status).toBe(200);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "testuser", // Email prefix used as fallback
        }),
      });
    });
  });

  describe("GET /api/auth/google", () => {
    it("should initiate Google OAuth flow", async () => {
      const response = await request(app).get("/api/auth/google");

      // The passport.authenticate middleware should be called
      // In a real scenario, this would redirect to Google
      expect(response.status).toBe(200);
    });
  });

  describe("GET /api/auth/google/callback", () => {
    it("should handle Google OAuth callback", async () => {
      const response = await request(app).get("/api/auth/google/callback");

      // Should redirect to frontend with token
      expect(response.status).toBe(302); // Redirect status
      expect(response.headers.location).toContain("/auth?token=");
    });
  });
});
