import { Router, Response, Request } from "express";
import prisma from "../config/prisma";
import { authenticateToken, AuthRequest } from "../utils/auth";

const router = Router();

// Check onboarding status
router.get(
  "/status",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { user } = req as AuthRequest;
      const userData = await prisma.user.findUnique({
        where: { id: user!.userId },
        select: {
          hasCompletedOnboarding: true,
          background: true,
          goals: true,
          learningInterests: true,
          skillLevel: true,
        },
      });

      if (!userData) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json({
        hasCompletedOnboarding: userData.hasCompletedOnboarding,
        onboardingData: {
          background: userData.background,
          goals: userData.goals,
          learningInterests: userData.learningInterests,
          skillLevel: userData.skillLevel,
        },
      });
    } catch (error) {
      console.error("Get onboarding status error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Update onboarding data
router.patch(
  "/update",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const {
        background,
        goals,
        learningInterests,
        skillLevel,
        hasCompletedOnboarding,
      } = req.body;
      const { user } = req as AuthRequest;

      const updateData: any = {};
      if (background !== undefined) updateData.background = background;
      if (goals !== undefined) updateData.goals = goals;
      if (learningInterests !== undefined)
        updateData.learningInterests = learningInterests;
      if (skillLevel !== undefined) updateData.skillLevel = skillLevel;
      if (hasCompletedOnboarding !== undefined)
        updateData.hasCompletedOnboarding = hasCompletedOnboarding;

      const userData = await prisma.user.update({
        where: { id: user!.userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          skillLevel: true,
          background: true,
          goals: true,
          learningInterests: true,
          hasCompletedOnboarding: true,
          currentLanguage: true,
          totalPoints: true,
          streakDays: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return res.json({ user: userData });
    } catch (error) {
      console.error("Update onboarding error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Complete onboarding
router.post(
  "/complete",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { background, goals, learningInterests, skillLevel } = req.body;
      const { user } = req as AuthRequest;

      const updateData: any = {
        hasCompletedOnboarding: true,
      };

      if (background) updateData.background = background;
      if (goals) updateData.goals = goals;
      if (learningInterests) updateData.learningInterests = learningInterests;
      if (skillLevel) updateData.skillLevel = skillLevel;

      const userData = await prisma.user.update({
        where: { id: user!.userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          skillLevel: true,
          background: true,
          goals: true,
          learningInterests: true,
          hasCompletedOnboarding: true,
          currentLanguage: true,
          totalPoints: true,
          streakDays: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return res.json({ success: true, user: userData });
    } catch (error) {
      console.error("Complete onboarding error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
