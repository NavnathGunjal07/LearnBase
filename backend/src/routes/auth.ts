import { Router, Response, Request } from "express";
import { authenticateToken, AuthRequest } from "../utils/auth";
import prisma from "../config/prisma";

const router = Router();

// GET /api/auth/me - Get current authenticated user
router.get("/me", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { user } = req as AuthRequest;
    if (!user?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
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

    if (!dbUser) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(dbUser);
  } catch (error) {
    console.error("Error fetching current user:", error);
    return res.status(500).json({ error: "Failed to fetch user data" });
  }
});

export default router;
