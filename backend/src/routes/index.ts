import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import topicRoutes from './topics';
import masterTopicRoutes from './masterTopics';
import executeRoutes from './execute';
import chatRoutes from './chat';
import onboardingRoutes from './onboarding';

const router = Router();

// Mount all routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/topics', topicRoutes);
router.use('/master-topics', masterTopicRoutes);
router.use('/execute', executeRoutes);
router.use('/chat', chatRoutes);
router.use('/onboarding', onboardingRoutes);

export default router;
