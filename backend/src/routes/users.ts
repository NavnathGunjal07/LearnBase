import { Router, Response } from "express";
import { validationResult } from "express-validator";
import prisma from "../utils/prisma";
import { authenticateToken, AuthRequest } from "../utils/auth";
import { updateUserValidation } from "../utils/validators";

const router = Router();

// Update current user
router.patch(
  "/me",
  authenticateToken,
  updateUserValidation,
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, skillLevel, currentLanguage } = req.body;

    try {
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (skillLevel !== undefined) updateData.skillLevel = skillLevel;
      if (currentLanguage !== undefined)
        updateData.currentLanguage = currentLanguage;

      const user = await prisma.user.update({
        where: { id: req.user!.userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          skillLevel: true,
          currentLanguage: true,
          totalPoints: true,
          streakDays: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return res.json(user);
    } catch (error) {
      console.error("Update user error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get user's last learning session
router.get(
  "/me/last-session",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;

      // Get the most recent chat session with topic info
      const lastSession = await prisma.chatSession.findFirst({
        where: { userId },
        orderBy: { lastActivity: "desc" },
        include: {
          userTopic: {
            include: {
              masterTopic: true,
            },
          },
          subtopic: true,
        },
      });

      if (!lastSession) {
        return res.json({ hasSession: false });
      }

      return res.json({
        hasSession: true,
        topicId: lastSession.userTopic.masterTopicId,
        topicName: lastSession.userTopic.masterTopic.name,
        subtopicId: lastSession.subtopicId,
        subtopicName: lastSession.subtopic?.title,
        lastActivity: lastSession.lastActivity,
      });
    } catch (error) {
      console.error("Get last session error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Delete current user
router.delete(
  "/me",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      await prisma.user.delete({
        where: { id: req.user!.userId },
      });

      return res.status(204).send();
    } catch (error) {
      console.error("Delete user error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
