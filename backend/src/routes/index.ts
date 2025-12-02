import { Router } from "express";
import authRoutes from "./auth";
import topicRoutes from "./topic";
import subtopicRoutes from "./subtopic";
import userRoutes from "./users";
import chatRoutes from "./chat";
import onboardingRoutes from "./onboarding";

const router = Router();

// Mount all routes
router.use("/auth", authRoutes);
router.use("/topics", topicRoutes);
router.use("/subtopics", subtopicRoutes);
router.use("/users", userRoutes);
router.use("/chat", chatRoutes);
router.use("/onboarding", onboardingRoutes);

export default router;
