import { Router, Response, Request } from "express";
import prisma from "../config/prisma";
import { authenticateToken, AuthRequest } from "../utils/auth";

const router = Router();

// Get user's last learning session
router.get(
  "/me/last-session",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { user } = req as AuthRequest;
      const userId = user!.userId;

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

export default router;
