import { Router, Request, Response } from "express";
import prisma from "../config/prisma";
import { authenticateToken, AuthRequest } from "../utils/auth";
import { createLimiter, apiLimiter } from "../middleware/rateLimiter";

const router = Router();

// ============================================================================
// MASTER TOPICS (Public/Catalog)
// ============================================================================

// Get all available topics (for selection)
router.get("/", async (req: Request, res: Response) => {
  try {
    const masterTopics = await prisma.masterTopic.findMany({
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

    return res.json(masterTopics);
  } catch (error) {
    console.error("Get topics error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get popular topics (sorted by enrollment count)
router.get("/popular", async (req: Request, res: Response) => {
  try {
    // Group user topics by masterTopicId and count them
    const popularTopics = await prisma.userTopic.groupBy({
      by: ["masterTopicId"],
      _count: {
        masterTopicId: true,
      },
      orderBy: {
        _count: {
          masterTopicId: "desc",
        },
      },
      take: 6,
    });

    // Fetch details for these topics
    const topicDetails = await prisma.masterTopic.findMany({
      where: {
        id: {
          in: popularTopics.map((pt) => pt.masterTopicId),
        },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        iconUrl: true,
        category: true,
      },
    });

    // Merge count with details
    const result = popularTopics
      .map((pt) => {
        const details = topicDetails.find((t) => t.id === pt.masterTopicId);
        if (!details) return null;
        return {
          ...details,
          learnerCount: pt._count.masterTopicId,
        };
      })
      .filter(Boolean); // Remove nulls (in case a topic was deactivated)

    return res.json(result);
  } catch (error) {
    console.error("Get popular topics error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get all user's enrolled topics with progress
router.get(
  "/user",
  authenticateToken,
  apiLimiter,
  async (req: Request, res: Response) => {
    try {
      const user = (req as AuthRequest).user;
      const userTopics = await prisma.userTopic.findMany({
        where: {
          userId: user?.userId,
          isActive: true,
        },
        include: {
          masterTopic: {
            include: {
              subtopics: {
                orderBy: { orderIndex: "asc" },
              },
            },
          },
          progress: true,
        },
        orderBy: { lastAccessedAt: "desc" },
      });

      const topicsWithProgress = userTopics.map((ut: any) => ({
        id: ut.id,
        masterTopicId: ut.masterTopicId,
        name: ut.masterTopic.name,
        description: ut.masterTopic.description,
        iconUrl: ut.masterTopic.iconUrl,
        category: ut.masterTopic.category,
        enrolledAt: ut.enrolledAt,
        lastAccessedAt: ut.lastAccessedAt,
        progress: ut.completedPercent,
        subtopics: ut.masterTopic.subtopics.map((s: any) => {
          const subtopicProgress = ut.progress.find(
            (p: any) => p.subtopicId === s.id
          );
          return {
            id: s.id,
            title: s.title,
            description: s.description,
            difficultyLevel: s.difficultyLevel,
            orderIndex: s.orderIndex,
            progress: subtopicProgress?.completedPercent || 0,
          };
        }),
      }));

      return res.json(topicsWithProgress);
    } catch (error) {
      console.error("Get user topics error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get a specific  topic with its subtopics
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const masterTopic = await prisma.masterTopic.findUnique({
      where: { id: parseInt(id) },
      include: {
        subtopics: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!masterTopic) {
      return res.status(404).json({ error: "Master topic not found" });
    }

    return res.json(masterTopic);
  } catch (error) {
    console.error("Get  topic error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ============================================================================
// USER TOPICS (Enrolled Topics)
// ============================================================================

// Enroll user in a topic
router.post(
  "/enroll",
  createLimiter,
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { topicId: rawTopicId } = req.body;
      const user = (req as AuthRequest).user;

      if (!rawTopicId) {
        return res.status(400).json({ error: "Topic ID is required" });
      }

      const topicId = parseInt(rawTopicId);
      if (isNaN(topicId)) {
        return res.status(400).json({ error: "Invalid Topic ID" });
      }

      if (!user?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Check if  topic exists
      const Topic = await prisma.masterTopic.findUnique({
        where: { id: topicId },
        include: {
          subtopics: {
            orderBy: { orderIndex: "asc" },
          },
        },
      });

      if (!Topic) {
        return res.status(404).json({ error: "Master topic not found" });
      }

      // Check if user is already enrolled
      const existingEnrollment = await prisma.userTopic.findUnique({
        where: {
          userId_masterTopicId: {
            userId: user?.userId,
            masterTopicId: topicId,
          },
        },
      });

      if (existingEnrollment) {
        return res
          .status(400)
          .json({ error: "Already enrolled in this topic" });
      }

      // Create user topic enrollment
      const userTopic = await prisma.userTopic.create({
        data: {
          userId: user?.userId,
          masterTopicId: topicId,
        },
        include: {
          masterTopic: {
            include: {
              subtopics: {
                orderBy: { orderIndex: "asc" },
              },
            },
          },
        },
      });

      return res.status(201).json({
        id: userTopic.id,
        name: userTopic.masterTopic.name,
        description: userTopic.masterTopic.description,
        iconUrl: userTopic.masterTopic.iconUrl,
        enrolledAt: userTopic.enrolledAt,
        progress: userTopic.completedPercent,
        subtopics: userTopic.masterTopic.subtopics.map((s: any) => ({
          id: s.id,
          name: s.title,
          description: s.description,
          level: s.difficultyLevel,
          orderIndex: s.orderIndex,
          progress: 0,
        })),
      });
    } catch (error) {
      console.error("Enroll topic error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Unenroll from a topic (soft delete)
router.delete(
  "/:userTopicId",
  authenticateToken,
  apiLimiter,
  async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user;
    const userTopicId = parseInt(req.params.userTopicId);

    if (isNaN(userTopicId)) {
      return res.status(400).json({ error: "Invalid user topic ID" });
    }

    try {
      const userTopic = await prisma.userTopic.findFirst({
        where: {
          id: userTopicId,
          userId: user?.userId,
        },
      });

      if (!userTopic) {
        return res.status(404).json({ error: "User topic not found" });
      }

      await prisma.userTopic.update({
        where: { id: userTopicId },
        data: { isActive: false },
      });

      return res
        .status(200)
        .json({ message: "Successfully unenrolled from topic" });
    } catch (error) {
      console.error("Unenroll topic error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
