import { Router, Response } from "express";
import { authenticateToken, AuthRequest } from "../utils/auth";
import prisma from "../utils/prisma";

const router = Router();

// GET /api/auth/me - Get current authenticated user
router.get(
  "/me",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
          id: true,
          name: true,
          email: true,
          skillLevel: true,
          currentLanguage: true,
          totalPoints: true,
          streakDays: true,
          background: true,
          goals: true,
          learningInterests: true,
          hasCompletedOnboarding: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json(user);
    } catch (error) {
      console.error("Error fetching current user:", error);
      return res.status(500).json({ error: "Failed to fetch user data" });
    }
  },
);

export default router;
