import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticateToken, AuthRequest } from '../utils/auth';

const router = Router();

// Get all user's enrolled topics with progress
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userTopics = await prisma.userTopic.findMany({
      where: {
        userId: req.user!.userId,
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

    const topicsWithProgress = userTopics.map((ut) => ({
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
    console.error('Get user topics error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user topic by ID
router.get('/:userTopicId', authenticateToken, async (req: AuthRequest, res: Response) => {
  const userTopicId = parseInt(req.params.userTopicId);

  if (isNaN(userTopicId)) {
    return res.status(400).json({ error: 'Invalid user topic ID' });
  }

  try {
    const userTopic = await prisma.userTopic.findFirst({
      where: {
        id: userTopicId,
        userId: req.user!.userId,
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
    });

    if (!userTopic) {
      return res.status(404).json({ error: 'User topic not found' });
    }

    const topicWithProgress = {
      id: userTopic.id,
      masterTopicId: userTopic.masterTopicId,
      name: userTopic.masterTopic.name,
      description: userTopic.masterTopic.description,
      iconUrl: userTopic.masterTopic.iconUrl,
      category: userTopic.masterTopic.category,
      enrolledAt: userTopic.enrolledAt,
      lastAccessedAt: userTopic.lastAccessedAt,
      progress: userTopic.completedPercent,
      subtopics: userTopic.masterTopic.subtopics.map((s) => {
        const subtopicProgress = userTopic.progress.find((p) => p.subtopicId === s.id);
        return {
          id: s.id,
          title: s.title,
          description: s.description,
          difficultyLevel: s.difficultyLevel,
          orderIndex: s.orderIndex,
          progress: subtopicProgress?.completedPercent || 0,
        };
      }),
    };

    return res.json(topicWithProgress);
  } catch (error) {
    console.error('Get user topic error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user topic progress (mark as accessed)
router.patch('/:userTopicId/access', authenticateToken, async (req: AuthRequest, res: Response) => {
  const userTopicId = parseInt(req.params.userTopicId);

  if (isNaN(userTopicId)) {
    return res.status(400).json({ error: 'Invalid user topic ID' });
  }

  try {
    const userTopic = await prisma.userTopic.findFirst({
      where: {
        id: userTopicId,
        userId: req.user!.userId,
      },
    });

    if (!userTopic) {
      return res.status(404).json({ error: 'User topic not found' });
    }

    const updated = await prisma.userTopic.update({
      where: { id: userTopicId },
      data: { lastAccessedAt: new Date() },
    });

    return res.json({ message: 'Last accessed updated', lastAccessedAt: updated.lastAccessedAt });
  } catch (error) {
    console.error('Update access error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Update subtopic progress
router.patch('/:userTopicId/subtopics/:subtopicId/progress', authenticateToken, async (req: AuthRequest, res: Response) => {
  const userTopicId = parseInt(req.params.userTopicId);
  const subtopicId = parseInt(req.params.subtopicId);
  const { completedPercent } = req.body;

  if (isNaN(userTopicId) || isNaN(subtopicId)) {
    return res.status(400).json({ error: 'Invalid IDs' });
  }

  if (completedPercent === undefined || completedPercent < 0 || completedPercent > 100) {
    return res.status(400).json({ error: 'Invalid progress value (0-100)' });
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
      return res.status(404).json({ error: 'User topic not found' });
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

    const avgProgress = allProgress.length > 0
      ? allProgress.reduce((sum, p) => sum + p.completedPercent, 0) / allProgress.length
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
    console.error('Update progress error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Unenroll from a topic (soft delete)
router.delete('/:userTopicId', authenticateToken, async (req: AuthRequest, res: Response) => {
  const userTopicId = parseInt(req.params.userTopicId);

  if (isNaN(userTopicId)) {
    return res.status(400).json({ error: 'Invalid user topic ID' });
  }

  try {
    const userTopic = await prisma.userTopic.findFirst({
      where: {
        id: userTopicId,
        userId: req.user!.userId,
      },
    });

    if (!userTopic) {
      return res.status(404).json({ error: 'User topic not found' });
    }

    await prisma.userTopic.update({
      where: { id: userTopicId },
      data: { isActive: false },
    });

    return res.status(200).json({ message: 'Successfully unenrolled from topic' });
  } catch (error) {
    console.error('Unenroll topic error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get subtopics for a user's enrolled topic
router.get('/:userTopicId/subtopics', authenticateToken, async (req: AuthRequest, res: Response) => {
  const userTopicId = parseInt(req.params.userTopicId);

  if (isNaN(userTopicId)) {
    return res.status(400).json({ error: 'Invalid user topic ID' });
  }

  try {
    const userTopic = await prisma.userTopic.findFirst({
      where: {
        id: userTopicId,
        userId: req.user!.userId,
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
    });

    if (!userTopic) {
      return res.status(404).json({ error: 'User topic not found' });
    }

    const subtopicsWithProgress = userTopic.masterTopic.subtopics.map((s) => {
      const subtopicProgress = userTopic.progress.find((p) => p.subtopicId === s.id);
      return {
        id: s.id,
        title: s.title,
        description: s.description,
        difficultyLevel: s.difficultyLevel,
        orderIndex: s.orderIndex,
        progress: subtopicProgress?.completedPercent || 0,
      };
    });

    return res.json(subtopicsWithProgress);
  } catch (error) {
    console.error('Get subtopics error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific subtopic details with exercises
router.get('/:userTopicId/subtopics/:subtopicId', authenticateToken, async (req: AuthRequest, res: Response) => {
  const userTopicId = parseInt(req.params.userTopicId);
  const subtopicId = parseInt(req.params.subtopicId);

  if (isNaN(userTopicId) || isNaN(subtopicId)) {
    return res.status(400).json({ error: 'Invalid IDs' });
  }

  try {
    const userTopic = await prisma.userTopic.findFirst({
      where: {
        id: userTopicId,
        userId: req.user!.userId,
      },
    });

    if (!userTopic) {
      return res.status(404).json({ error: 'User topic not found' });
    }

    const subtopic = await prisma.subtopic.findFirst({
      where: {
        id: subtopicId,
        masterTopicId: userTopic.masterTopicId,
      },
      include: {
        exercises: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            aiGenerated: true,
          },
        },
      },
    });

    if (!subtopic) {
      return res.status(404).json({ error: 'Subtopic not found' });
    }

    const progress = await prisma.progress.findUnique({
      where: {
        userId_userTopicId_subtopicId: {
          userId: req.user!.userId,
          userTopicId,
          subtopicId,
        },
      },
    });

    return res.json({
      ...subtopic,
      progress: progress?.completedPercent || 0,
    });
  } catch (error) {
    console.error('Get subtopic error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
