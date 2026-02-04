import { Router } from "express";
import prisma from "../config/prisma";
import { authenticateToken } from "../utils/auth";
import { chatLimiter } from "../middleware/rateLimiter";

const router = Router();

// Get chat history for a specific topic/subtopic (last 2 days only)
router.get("/history", authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { topicId, subtopicId } = req.query;

    if (!topicId) {
      return res.status(400).json({ error: "Topic ID is required" });
    }

    // Find the user topic
    const userTopic = await prisma.userTopic.findFirst({
      where: {
        userId,
        masterTopicId: parseInt(topicId as string),
      },
    });

    if (!userTopic) {
      return res.json({ messages: [] });
    }

    // Get or create chat session for this topic/subtopic
    let chatSession = await prisma.chatSession.findFirst({
      where: {
        userId,
        userTopicId: userTopic.id,
        subtopicId: subtopicId ? parseInt(subtopicId as string) : null,
      },
      orderBy: {
        lastActivity: "desc",
      },
    });

    if (!chatSession) {
      // Create a new session if none exists
      const subtopic = subtopicId
        ? await prisma.subtopic.findUnique({
            where: { id: parseInt(subtopicId as string) },
          })
        : null;

      const masterTopic = await prisma.masterTopic.findUnique({
        where: { id: parseInt(topicId as string) },
      });

      chatSession = await prisma.chatSession.create({
        data: {
          userId,
          userTopicId: userTopic.id,
          subtopicId: subtopicId ? parseInt(subtopicId as string) : null,
          title: subtopic
            ? `${masterTopic?.name} - ${subtopic.title}`
            : masterTopic?.name || "Learning Session",
        },
      });
    }

    // Get all messages for this session
    const messages = await prisma.chatMessage.findMany({
      where: {
        chatId: chatSession.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Transform messages to frontend format
    const formattedMessages = messages.map((msg: any) => ({
      sender: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
      timestamp: msg.createdAt.toISOString(),
      messageType: msg.messageType,
      isComplete: true, // All stored messages are complete
      quiz: msg.messageType === "quiz" ? msg.metadata : undefined,
      codingChallenge:
        msg.messageType === "coding_challenge" ? msg.metadata : undefined,
      codingSubmission:
        msg.messageType === "coding_submission" ? msg.metadata : undefined,
    }));

    return res.json({
      sessionId: chatSession.id,
      messages: formattedMessages,
    });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return res.status(500).json({ error: "Failed to fetch chat history" });
  }
});

// Save a chat message
router.post("/message", chatLimiter, authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { sessionId, role, content, topicId, subtopicId } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Message content is required" });
    }

    let chatSessionId = sessionId;

    // If no session ID provided, find or create one
    if (!chatSessionId && topicId) {
      const userTopic = await prisma.userTopic.findFirst({
        where: {
          userId,
          masterTopicId: parseInt(topicId),
        },
      });

      if (!userTopic) {
        return res.status(404).json({ error: "User topic not found" });
      }

      let chatSession = await prisma.chatSession.findFirst({
        where: {
          userId,
          userTopicId: userTopic.id,
          subtopicId: subtopicId ? parseInt(subtopicId) : null,
        },
        orderBy: {
          lastActivity: "desc",
        },
      });

      if (!chatSession) {
        const subtopic = subtopicId
          ? await prisma.subtopic.findUnique({
              where: { id: parseInt(subtopicId) },
            })
          : null;

        const masterTopic = await prisma.masterTopic.findUnique({
          where: { id: parseInt(topicId) },
        });

        chatSession = await prisma.chatSession.create({
          data: {
            userId,
            userTopicId: userTopic.id,
            subtopicId: subtopicId ? parseInt(subtopicId) : null,
            title: subtopic
              ? `${masterTopic?.name} - ${subtopic.title}`
              : masterTopic?.name || "Learning Session",
          },
        });
      }

      chatSessionId = chatSession.id;
    }

    if (!chatSessionId) {
      return res
        .status(400)
        .json({ error: "Session ID or topic ID is required" });
    }

    // Save the message
    const message = await prisma.chatMessage.create({
      data: {
        chatId: chatSessionId,
        userId: role === "user" ? userId : null,
        role: role || "user",
        content,
      },
    });

    // Update session last activity
    await prisma.chatSession.update({
      where: { id: chatSessionId },
      data: { lastActivity: new Date() },
    });

    return res.json({
      id: message.id,
      sessionId: chatSessionId,
      success: true,
    });
  } catch (error) {
    console.error("Error saving message:", error);
    return res.status(500).json({ error: "Failed to save message" });
  }
});

// Clear chat history for a specific topic/subtopic
router.delete("/history", authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { topicId, subtopicId } = req.query;

    if (!topicId) {
      return res.status(400).json({ error: "Topic ID is required" });
    }

    const userTopic = await prisma.userTopic.findFirst({
      where: {
        userId,
        masterTopicId: parseInt(topicId as string),
      },
    });

    if (!userTopic) {
      return res.json({ success: true, message: "No chat history found" });
    }

    // Delete all chat sessions and their messages for this topic/subtopic
    await prisma.chatSession.deleteMany({
      where: {
        userId,
        userTopicId: userTopic.id,
        subtopicId: subtopicId ? parseInt(subtopicId as string) : null,
      },
    });

    return res.json({ success: true, message: "Chat history cleared" });
  } catch (error) {
    console.error("Error clearing chat history:", error);
    return res.status(500).json({ error: "Failed to clear chat history" });
  }
});

export default router;
