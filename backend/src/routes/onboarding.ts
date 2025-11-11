import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticateToken, AuthRequest } from '../utils/auth';

const router = Router();

// Check onboarding status
router.get('/status', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        hasCompletedOnboarding: true,
        background: true,
        goals: true,
        learningInterests: true,
        skillLevel: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      hasCompletedOnboarding: user.hasCompletedOnboarding,
      onboardingData: {
        background: user.background,
        goals: user.goals,
        learningInterests: user.learningInterests,
        skillLevel: user.skillLevel,
      },
    });
  } catch (error) {
    console.error('Get onboarding status error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Update onboarding data
router.patch('/update', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { background, goals, learningInterests, skillLevel, hasCompletedOnboarding } = req.body;

    const updateData: any = {};
    if (background !== undefined) updateData.background = background;
    if (goals !== undefined) updateData.goals = goals;
    if (learningInterests !== undefined) updateData.learningInterests = learningInterests;
    if (skillLevel !== undefined) updateData.skillLevel = skillLevel;
    if (hasCompletedOnboarding !== undefined) updateData.hasCompletedOnboarding = hasCompletedOnboarding;

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
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

    return res.json(user);
  } catch (error) {
    console.error('Update onboarding error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Complete onboarding
router.post('/complete', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { background, goals, learningInterests, skillLevel } = req.body;

    const updateData: any = {
      hasCompletedOnboarding: true,
    };

    if (background) updateData.background = background;
    if (goals) updateData.goals = goals;
    if (learningInterests) updateData.learningInterests = learningInterests;
    if (skillLevel) updateData.skillLevel = skillLevel;

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
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

    return res.json({ success: true, user });
  } catch (error) {
    console.error('Complete onboarding error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

