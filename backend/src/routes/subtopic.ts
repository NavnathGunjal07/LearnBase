import { Router, Response } from "express";
import prisma from "../utils/prisma";
import { authenticateToken, AuthRequest } from "../utils/auth";
import { apiLimiter } from "../middleware/rateLimiter";

const router = Router();

// Update subtopic progress
router.patch(
  "/:userTopicId/:subtopicId/progress",
  authenticateToken,
  apiLimiter,
  async (req: AuthRequest, res: Response) => {
    const userTopicId = parseInt(req.params.userTopicId);
    const subtopicId = parseInt(req.params.subtopicId);
    const { completedPercent } = req.body;

    if (isNaN(userTopicId) || isNaN(subtopicId)) {
      return res.status(400).json({ error: "Invalid IDs" });
    }

    if (
      completedPercent === undefined ||
      completedPercent < 0 ||
      completedPercent > 100
    ) {
      return res.status(400).json({ error: "Invalid progress value (0-100)" });
    }

    try {
      const userId = req.user!.userId;

      // Verify user topic exists and belongs to user
      const userTopic = await prisma.userTopic.findFirst({
        where: {
          id: userTopicId,
          userId,
        },
      });

      if (!userTopic) {
        return res.status(404).json({ error: "User topic not found" });
      }

      // Upsert progress
      const progress = await prisma.progress.upsert({
        where: {
          userId_userTopicId_subtopicId: {
            userId,
            userTopicId,
            subtopicId,
          },
        },
        update: {
          completedPercent,
        },
        create: {
          userId,
          userTopicId,
          subtopicId,
          completedPercent,
        },
      });

      // Update overall user topic progress
      const allProgress = await prisma.progress.findMany({
        where: { userTopicId },
      });

      const avgProgress =
        allProgress.length > 0
          ? allProgress.reduce((sum, p) => sum + p.completedPercent, 0) /
            allProgress.length
          : 0;

      await prisma.userTopic.update({
        where: { id: userTopicId },
        data: {
          completedPercent: avgProgress,
          lastAccessedAt: new Date(),
        },
      });

      return res.json(progress);
    } catch (error) {
      console.error("Update progress error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
