import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticateToken, AuthRequest } from '../utils/auth';
import { createLimiter } from '../middleware/rateLimiter';

const router = Router();

// Get all available master topics (for dropdown selection)
router.get('/', async (req: Request, res: Response) => {
  try {
    const masterTopics = await prisma.masterTopic.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: 'asc' },
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
    console.error('Get master topics error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a specific master topic with its subtopics
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const masterTopic = await prisma.masterTopic.findUnique({
      where: { id: parseInt(id) },
      include: {
        subtopics: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!masterTopic) {
      return res.status(404).json({ error: 'Master topic not found' });
    }

    return res.json(masterTopic);
  } catch (error) {
    console.error('Get master topic error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Enroll user in a topic (create UserTopic)
router.post('/enroll', createLimiter, authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { masterTopicId } = req.body;
    const userId = req.user!.userId;

    if (!masterTopicId) {
      return res.status(400).json({ error: 'Master topic ID is required' });
    }

    // Check if master topic exists
    const masterTopic = await prisma.masterTopic.findUnique({
      where: { id: masterTopicId },
      include: {
        subtopics: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!masterTopic) {
      return res.status(404).json({ error: 'Master topic not found' });
    }

    // Check if user is already enrolled
    const existingEnrollment = await prisma.userTopic.findUnique({
      where: {
        userId_masterTopicId: {
          userId,
          masterTopicId,
        },
      },
    });

    if (existingEnrollment) {
      return res.status(400).json({ error: 'Already enrolled in this topic' });
    }

    // Create user topic enrollment
    const userTopic = await prisma.userTopic.create({
      data: {
        userId,
        masterTopicId,
      },
      include: {
        masterTopic: {
          include: {
            subtopics: {
              orderBy: { orderIndex: 'asc' },
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
      subtopics: userTopic.masterTopic.subtopics.map((s) => ({
        id: s.id,
        name: s.title,
        description: s.description,
        level: s.difficultyLevel,
        orderIndex: s.orderIndex,
        progress: 0,
      })),
    });
  } catch (error) {
    console.error('Enroll topic error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's enrolled topics
router.get('/user/enrolled', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const userTopics = await prisma.userTopic.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        masterTopic: {
          include: {
            subtopics: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
        progress: true,
      },
      orderBy: { lastAccessedAt: 'desc' },
    });

    const formattedTopics = userTopics.map((ut) => ({
      id: ut.id,
      masterTopicId: ut.masterTopicId,
      name: ut.masterTopic.name,
      description: ut.masterTopic.description,
      iconUrl: ut.masterTopic.iconUrl,
      category: ut.masterTopic.category,
      enrolledAt: ut.enrolledAt,
      lastAccessedAt: ut.lastAccessedAt,
      progress: ut.completedPercent,
      subtopics: ut.masterTopic.subtopics.map((s) => {
        const subtopicProgress = ut.progress.find((p) => p.subtopicId === s.id);
        return {
          id: s.id,
          name: s.title,
          description: s.description,
          level: s.difficultyLevel,
          orderIndex: s.orderIndex,
          progress: subtopicProgress?.completedPercent || 0,
        };
      }),
    }));

    return res.json(formattedTopics);
  } catch (error) {
    console.error('Get user topics error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Unenroll from a topic
router.delete('/unenroll/:userTopicId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { userTopicId } = req.params;
    const userId = req.user!.userId;

    const userTopic = await prisma.userTopic.findFirst({
      where: {
        id: parseInt(userTopicId),
        userId,
      },
    });

    if (!userTopic) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    await prisma.userTopic.update({
      where: { id: parseInt(userTopicId) },
      data: { isActive: false },
    });

    return res.status(200).json({ message: 'Successfully unenrolled from topic' });
  } catch (error) {
    console.error('Unenroll topic error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
