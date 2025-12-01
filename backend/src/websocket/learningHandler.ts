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

  // Generate initial greeting asking for experience level
  const initialQuestion = `Welcome to **${name}**! 🎓\n\nTo help me tailor the lessons for you, could you tell me a bit about your current understanding of **${subtopicName}**?\n\n(e.g., "I'm a complete beginner", "I know the basics", "I'm looking for advanced tips")`;

  // Save system message (initial context)
  await prisma.chatMessage.create({
    data: {
      chatId: session.id,
      role: "assistant",
      content: initialQuestion,
      messageType: "text",
    },
  });

  // Send initial question to user
  ws.send(JSON.stringify({ type: "delta", content: initialQuestion }));
  ws.send(JSON.stringify({ type: "done" }));
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

  // Check if this is the first user reply (response to the level question)
  // History will have: [Assistant (Initial Question), User (Current Message)] if it's the first reply
  const isFirstReply = history.length <= 2;

  let systemPromptContext = `${LEARNING_PROMPT}\n\nCurrent Context:\nTopic: ${topicName}\nSubtopic: ${subtopicName}`;

  if (isFirstReply) {
    systemPromptContext += `\n\nUSER CONTEXT: The user has just stated their experience level: "${content}". Adapt your teaching style accordingly. Start by acknowledging their level and introducing the first concept.`;
  } else {
    systemPromptContext += `\n\nINSTRUCTION: Continue teaching based on the conversation history. Assess the user's understanding from their last message and update progress if appropriate.`;
  }

  const messages = [
    {
      role: "system",
      content: systemPromptContext,
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
        message: "I'm having trouble thinking right now. Please try again.",
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
