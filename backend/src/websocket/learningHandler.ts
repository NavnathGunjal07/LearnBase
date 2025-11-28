import { WebSocket } from "ws";
import { PrismaClient } from "../../prisma/generated/client";
import { LEARNING_PROMPT } from "../prompts/learning";
import { streamChatCompletion } from "../utils/ai";

const prisma = new PrismaClient();

export interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  userEmail?: string;
  isAlive?: boolean;
  currentSessionId?: string;
  currentTopicId?: number;
  currentSubtopicId?: number;
  isAuthenticated?: boolean;
}

interface ProgressUpdate {
  score: number;
  reasoning: string;
}

export async function handleLearningFlow(
  ws: AuthenticatedWebSocket,
  message: any
) {
  const { type } = message;

  if (!ws.userId) {
    ws.send(JSON.stringify({ type: "error", content: "Unauthorized" }));
    return;
  }

  try {
    if (type === "topic_selected") {
      await handleTopicSelected(ws, message);
    } else if (type === "session_resumed") {
      await handleSessionResumed(ws, message);
    } else if (type === "message") {
      await handleUserMessage(ws, message);
    }
  } catch (error) {
    console.error("Error in learning flow:", error);
    ws.send(
      JSON.stringify({
        type: "error",
        content: "An error occurred in the learning session.",
      })
    );
  }
}

async function handleTopicSelected(ws: AuthenticatedWebSocket, message: any) {
  const { topic } = message;
  const { topicId, subtopicId, name, subtopic: subtopicName } = topic;

  console.log(
    `📚 Topic selected: ${name} (${subtopicName}) for user ${ws.userId}`
  );

  // Create or find chat session
  const session = await prisma.chatSession.create({
    data: {
      userId: ws.userId!,
      userTopicId: topicId, // Note: Frontend sends topicId which might be masterTopicId, need to ensure we have UserTopic
      subtopicId: subtopicId,
      title: `${name} - ${subtopicName}`,
      startedAt: new Date(),
    },
  });

  // Update WS state
  ws.currentSessionId = session.id;
  ws.currentTopicId = topicId;
  ws.currentSubtopicId = subtopicId;

  // Generate initial AI greeting
  const systemMessage = {
    role: "system",
    content: `${LEARNING_PROMPT}\n\nCurrent Context:\nTopic: ${name}\nSubtopic: ${subtopicName}`,
  };

  const initialUserContext = {
    role: "user",
    content: `I want to learn about ${subtopicName} in ${name}.`,
  };

  await generateAIResponse(ws, [systemMessage, initialUserContext], session.id);
}

async function handleSessionResumed(ws: AuthenticatedWebSocket, message: any) {
  const { sessionId, topicId, subtopicId } = message;

  console.log(`🔄 Session resumed: ${sessionId}`);

  // Verify session exists and belongs to user
  const session = await prisma.chatSession.findFirst({
    where: {
      id: sessionId,
      userId: ws.userId!,
    },
  });

  if (session) {
    ws.currentSessionId = session.id;
    ws.currentTopicId = topicId;
    ws.currentSubtopicId = subtopicId;

    // No need to send a message, client just loads history
    // But we could send a "Welcome back" if we wanted
  } else {
    ws.send(JSON.stringify({ type: "error", content: "Session not found" }));
  }
}

async function handleUserMessage(ws: AuthenticatedWebSocket, message: any) {
  const { content } = message;
  const sessionId = ws.currentSessionId;

  if (!sessionId) {
    ws.send(JSON.stringify({ type: "error", content: "No active session" }));
    return;
  }

  // Save user message
  await prisma.chatMessage.create({
    data: {
      chatId: sessionId,
      userId: ws.userId,
      role: "user",
      content: content,
      messageType: "text",
    },
  });

  // Fetch history for context
  const history = await prisma.chatMessage.findMany({
    where: { chatId: sessionId },
    orderBy: { createdAt: "asc" },
    take: 20, // Limit context window
  });

  // Get topic details for system prompt context
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    include: {
      userTopic: { include: { masterTopic: true } },
      subtopic: true,
    },
  });

  const topicName = session?.userTopic.masterTopic.name || "Coding";
  const subtopicName = session?.subtopic?.title || "General";

  const messages = [
    {
      role: "system",
      content: `${LEARNING_PROMPT}\n\nCurrent Context:\nTopic: ${topicName}\nSubtopic: ${subtopicName}`,
    },
    ...history.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    })),
  ];

  await generateAIResponse(
    ws,
    messages,
    sessionId,
    session?.userTopicId || undefined,
    session?.subtopicId || undefined
  );
}

async function generateAIResponse(
  ws: AuthenticatedWebSocket,
  messages: any[],
  sessionId: string,
  userTopicId?: number,
  subtopicId?: number
) {
  try {
    ws.send(JSON.stringify({ type: "typing" }));

    const fullResponse = await streamChatCompletion({
      messages,
      onDelta: (content) => {
        ws.send(JSON.stringify({ type: "delta", content }));
      },
      onJson: async (data) => {
        if (data.progress_update && userTopicId && subtopicId) {
          await handleProgressUpdate(
            ws,
            userTopicId,
            subtopicId,
            data.progress_update
          );
        }
      },
    });

    ws.send(JSON.stringify({ type: "done" }));

    // Save assistant message
    await prisma.chatMessage.create({
      data: {
        chatId: sessionId,
        role: "assistant",
        content: fullResponse,
        messageType: "text",
      },
    });
  } catch (error) {
    console.error("GROQ API error:", error);
    ws.send(
      JSON.stringify({
        type: "error",
        content:
          "I'm having trouble connecting to my brain right now. Please check if the GROQ_API_KEY is set in the backend .env file.",
      })
    );
  }
}

async function handleProgressUpdate(
  ws: AuthenticatedWebSocket,
  userTopicId: number,
  subtopicId: number,
  update: ProgressUpdate
) {
  console.log(
    `📈 Progress update for user ${ws.userId}: ${update.score}% - ${update.reasoning}`
  );

  try {
    // Update progress in DB
    await prisma.progress.upsert({
      where: {
        userId_userTopicId_subtopicId: {
          userId: ws.userId!,
          userTopicId,
          subtopicId,
        },
      },
      update: {
        completedPercent: update.score,
      },
      create: {
        userId: ws.userId!,
        userTopicId,
        subtopicId,
        completedPercent: update.score,
      },
    });

    // Update overall topic progress
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

    // Notify frontend
    ws.send(
      JSON.stringify({
        type: "progress_updated",
        topicId: userTopicId,
        subtopicId: subtopicId,
        progress: update.score,
        topicProgress: avgProgress,
      })
    );
  } catch (error) {
    console.error("Failed to update progress:", error);
  }
}
