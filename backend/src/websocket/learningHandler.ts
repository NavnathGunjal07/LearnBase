import { WebSocket } from "ws";
import prisma from "../config/prisma";
import { LEARNING_PROMPT } from "../prompts/learning";
import { VISUALIZER_PROMPT } from "../prompts/visualizer";
import { streamChatCompletion } from "../utils/ai";
import { handleWebSocketError } from "../utils/errorHandler";

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

// Export this function to be used primarily by chatServer
export async function initLearningSession(ws: AuthenticatedWebSocket) {
  // Close previous session if exists
  if (ws.currentSessionId) {
    try {
      await prisma.chatSession.update({
        where: { id: ws.currentSessionId },
        data: { lastActivity: new Date() },
      });
    } catch (error) {
      console.error("Error closing previous session:", error);
    }
  }

  // Clear current session state to start fresh
  ws.currentSessionId = undefined;
  ws.currentTopicId = undefined;
  ws.currentSubtopicId = undefined;

  // Send the initial greeting for a new session
  ws.send(
    JSON.stringify({
      type: "message",
      content: "What do you want to learn today?",
      sender: "assistant",
    })
  );
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
      // If no session ID, handle as topic generation/negotiation
      if (!ws.currentSessionId) {
        await handleTopicGeneration(ws, message.content);
      } else {
        await handleUserMessage(ws, message);
      }
    } else if (type === "quiz_answer") {
      await handleQuizAnswer(ws, message);
    } else if (type === "code_execution") {
      await handleCodeExecution(ws, message);
    } else if (type === "visualizer_check") {
      await handleVisualizerCheck(ws);
    } else if (type === "new_chat") {
      await initLearningSession(ws);
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
  try {
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
        userId: ws.userId, // Track which user this assistant message is for
        role: "assistant",
        content: initialQuestion,
        messageType: "text",
      },
    });

    // Send initial question to user
    ws.send(JSON.stringify({ type: "delta", content: initialQuestion }));
    ws.send(
      JSON.stringify({
        type: "done",
        suggestions: [
          "I'm a complete beginner",
          "I know the basics",
          "I'm looking for advanced tips",
        ],
      })
    );
  } catch (error) {
    handleWebSocketError(error, ws, "handleTopicSelected");
  }
}

async function handleSessionResumed(ws: AuthenticatedWebSocket, message: any) {
  try {
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
  } catch (error) {
    handleWebSocketError(error, ws, "handleSessionResumed");
  }
}

async function handleCodeExecution(ws: AuthenticatedWebSocket, message: any) {
  try {
    const { code, language, challenge } = message;
    ws.send(
      JSON.stringify({ type: "code_execution_result", status: "running" })
    );

    const { generateEvalPrompt } = await import("../prompts/eval");
    const EVAL_PROMPT = generateEvalPrompt(language, code, challenge.testCases);

    const { streamChatCompletion } = await import("../utils/ai");

    await streamChatCompletion({
      messages: [{ role: "system", content: EVAL_PROMPT }],
      onJson: async (result) => {
        ws.send(
          JSON.stringify({
            type: "code_execution_result",
            status: "completed",
            result,
          })
        );

        if (result.passedCount === result.totalCount && result.totalCount > 0) {
          const successMsg = "🎉🌈 Excellent! You got it right! 🚀";

          ws.send(
            JSON.stringify({
              type: "message",
              sender: "assistant",
              content: successMsg,
            })
          );

          if (ws.currentSessionId && ws.userId) {
            // Save success message to DB
            await prisma.chatMessage.create({
              data: {
                chatId: ws.currentSessionId,
                userId: ws.userId,
                role: "assistant",
                content: successMsg,
                messageType: "text",
              },
            });

            // Fetch Session Details for Context
            const session = await prisma.chatSession.findUnique({
              where: { id: ws.currentSessionId },
              include: {
                userTopic: { include: { masterTopic: true } },
                subtopic: true,
              },
            });

            if (session) {
              // Fetch history
              const history = await prisma.chatMessage.findMany({
                where: { chatId: ws.currentSessionId },
                orderBy: { createdAt: "asc" },
                take: 20,
              });

              const currentProgress = session.subtopicId
                ? (
                    await prisma.progress.findUnique({
                      where: {
                        userId_userTopicId_subtopicId: {
                          userId: ws.userId,
                          userTopicId: session.userTopicId,
                          subtopicId: session.subtopicId,
                        },
                      },
                    })
                  )?.completedPercent || 0
                : 0;

              const weightage = session.subtopic?.weightage || 10;
              const topicName = session.userTopic.masterTopic.name;
              const subtopicName = session.subtopic?.title || "General";

              const systemPromptContext = `${LEARNING_PROMPT}\n\nCurrent Context:\nTopic: ${topicName}\nSubtopic: ${subtopicName}\nCurrent Progress: ${currentProgress}%\nProgress Weightage per Step: ${weightage}%\n\nINSTRUCTION: The user just completed a coding challenge SUCCESSFULLY. The last message in history is your congratulations. NOW, continue the lesson. Briefly bridge from the challenge to the next concept. Do not ask "What would you like to do next?". Just teach the next step.`;

              const messages = [
                { role: "system", content: systemPromptContext },
                ...history.map((m: any) => ({
                  role: m.role as "user" | "assistant" | "system",
                  content: m.content,
                })),
              ];

              await generateAIResponse(
                ws,
                messages,
                ws.currentSessionId,
                session.userTopicId,
                session.subtopicId || undefined,
                currentProgress,
                weightage
              );
            }
          }
        }

        // Save submission to DB
        // challenge.id corresponds to the Exercise ID if it was created
        if (challenge?.id && typeof challenge.id === "number" && ws.userId) {
          try {
            await prisma.submission.create({
              data: {
                userId: ws.userId,
                exerciseId: challenge.id,
                code: code,
                status:
                  result.passedCount === result.totalCount
                    ? "completed"
                    : "failed",
                score: result.passedCount || 0,
                feedback: result.error || JSON.stringify(result.results),
                runtime: 0, // We don't track runtime yet
              },
            });
            console.log(`Saved submission for exercise ${challenge.id}`);

            // Also save a chat message to record the submission
            if (ws.currentSessionId) {
              await prisma.chatMessage.create({
                data: {
                  chatId: ws.currentSessionId,
                  userId: ws.userId,
                  role: "user",
                  content: `Submitted solution for ${
                    challenge.title || "Coding Challenge"
                  }`,
                  messageType: "coding_submission",
                  metadata: {
                    code,
                    language,
                    status:
                      result.passedCount === result.totalCount
                        ? "completed"
                        : "failed",
                    passedCount: result.passedCount,
                    totalCount: result.totalCount,
                    exerciseId: challenge.id,
                  },
                },
              });
            }
          } catch (dbError) {
            console.error("Failed to save submission:", dbError);
          }
        }
      },
    });
  } catch (error) {
    console.error("Code Eval Error", error);
    ws.send(
      JSON.stringify({
        type: "code_execution_result",
        status: "error",
        error: "Execution failed",
      })
    );
  }
}

async function handleQuizAnswer(ws: AuthenticatedWebSocket, message: any) {
  try {
    const { selectedIndex, correctIndex } = message;
    const sessionId = ws.currentSessionId;

    if (!sessionId) {
      ws.send(JSON.stringify({ type: "error", content: "No active session" }));
      return;
    }

    const isCorrect = selectedIndex === correctIndex;

    // Get session details for progress update
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        userTopic: { include: { masterTopic: true } },
        subtopic: true,
      },
    });

    if (!session) {
      ws.send(JSON.stringify({ type: "error", content: "Session not found" }));
      return;
    }

    // Send result to user
    ws.send(
      JSON.stringify({
        type: "quiz_result",
        isCorrect,
      })
    );

    // Update progress if correct
    if (isCorrect && session.userTopicId && session.subtopicId) {
      const progressRecord = await prisma.progress.findUnique({
        where: {
          userId_userTopicId_subtopicId: {
            userId: ws.userId!,
            userTopicId: session.userTopicId,
            subtopicId: session.subtopicId,
          },
        },
      });

      const currentProgress = progressRecord?.completedPercent || 0;
      const weightage = session.subtopic?.weightage || 10;
      const newProgress = Math.min(currentProgress + weightage, 100);

      await handleProgressUpdate(ws, session.userTopicId, session.subtopicId, {
        score: newProgress,
        reasoning: "Answered quiz question correctly",
      });
    }

    // Send AI encouragement message
    const encouragement = isCorrect
      ? "🎉🌈 *Excellent!* You got it right! 🚀"
      : "🤔🐢 *Not quite, young coder.* Let's review that concept again! 💡";

    // Save encouragement to DB so it appears in history for context
    await prisma.chatMessage.create({
      data: {
        chatId: sessionId,
        userId: ws.userId,
        role: "assistant",
        content: encouragement,
        messageType: "text",
      },
    });

    ws.send(
      JSON.stringify({
        type: "message",
        content: encouragement,
        sender: "assistant",
      })
    );

    // If correct, continue the lesson automatically
    if (isCorrect) {
      // Fetch history for context
      const history = await prisma.chatMessage.findMany({
        where: { chatId: sessionId },
        orderBy: { createdAt: "asc" },
        take: 20,
      });

      const currentProgress = session.subtopicId
        ? (
            await prisma.progress.findUnique({
              where: {
                userId_userTopicId_subtopicId: {
                  userId: ws.userId!,
                  userTopicId: session.userTopicId,
                  subtopicId: session.subtopicId,
                },
              },
            })
          )?.completedPercent || 0
        : 0;

      const weightage = session.subtopic?.weightage || 10;
      const topicName = session.userTopic.masterTopic.name;
      const subtopicName = session.subtopic?.title || "General";

      const systemPromptContext = `${LEARNING_PROMPT}\n\nCurrent Context:\nTopic: ${topicName}\nSubtopic: ${subtopicName}\nCurrent Progress: ${currentProgress}%\nProgress Weightage per Step: ${weightage}%\n\nINSTRUCTION: The user just answered a quiz question CORRECTLY. The last message in history is your congratulations. NOW, continue the lesson. Briefly bridge from the quiz topic to the next concept. Do not ask "What would you like to do next?". Just teach the next step.`;

      const messages = [
        { role: "system", content: systemPromptContext },
        ...history.map((m: any) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        })),
      ];

      await generateAIResponse(
        ws,
        messages,
        sessionId,
        session.userTopicId,
        session.subtopicId || undefined,
        currentProgress,
        weightage
      );
    }

    ws.send(JSON.stringify({ type: "done" }));
  } catch (error) {
    handleWebSocketError(error, ws, "handleQuizAnswer");
  }
}

async function handleUserMessage(ws: AuthenticatedWebSocket, message: any) {
  try {
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

    // Update session last activity
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { lastActivity: new Date() },
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

    // Check for visualizer mode
    if (message.mode === "visualizer") {
      await generateVisualizer(ws, content);
      return;
    }

    // Check if this is the first user reply (response to the level question)
    // History will have: [Assistant (Initial Question), User (Current Message)] if it's the first reply
    const isFirstReply = history.length <= 2;

    // Fetch current progress for the subtopic
    let currentProgress = 0;
    if (session?.userTopicId && session?.subtopicId) {
      const progressRecord = await prisma.progress.findUnique({
        where: {
          userId_userTopicId_subtopicId: {
            userId: ws.userId!,
            userTopicId: session.userTopicId,
            subtopicId: session.subtopicId,
          },
        },
      });
      currentProgress = progressRecord?.completedPercent || 0;
    }

    // Get weightage from subtopic
    const subtopicWeightage = session?.subtopic?.weightage || 10;

    let systemPromptContext = `${LEARNING_PROMPT}\n\nCurrent Context:\nTopic: ${topicName}\nSubtopic: ${subtopicName}\nCurrent Progress: ${currentProgress}%\nProgress Weightage per Step: ${subtopicWeightage}%`;

    if (isFirstReply) {
      systemPromptContext += `\n\nUSER CONTEXT: The user has just stated their experience level: "${content}". Adapt your teaching style accordingly. Start by acknowledging their level and introducing the first concept.`;
    } else {
      systemPromptContext += `\n\nINSTRUCTION: Continue teaching based on the conversation history. Assess the user's understanding from their last message. If they demonstrate understanding or complete a step, calculate the new progress (current + weightage, max 100) and include it in the hidden JSON block.`;
    }

    const messages = [
      {
        role: "system",
        content: systemPromptContext,
      },
      ...history.map((m: any) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      })),
    ];

    await generateAIResponse(
      ws,
      messages,
      sessionId,
      session?.userTopicId || undefined,
      session?.subtopicId || undefined,
      currentProgress,
      subtopicWeightage
    );
  } catch (error) {
    handleWebSocketError(error, ws, "handleUserMessage");
  }
}

async function generateAIResponse(
  ws: AuthenticatedWebSocket,
  messages: any[],
  sessionId: string,
  userTopicId?: number,
  subtopicId?: number,
  currentProgress: number = 0,
  weightage: number = 20
) {
  try {
    ws.send(JSON.stringify({ type: "typing" }));

    // Step 1: Generate Text Response (Streaming)
    const fullResponse = await streamChatCompletion({
      messages,
      onDelta: (content) => {
        ws.send(JSON.stringify({ type: "delta", content }));
      },
    });

    // Save assistant message
    await prisma.chatMessage.create({
      data: {
        chatId: sessionId,
        userId: ws.userId,
        role: "assistant",
        content: fullResponse,
        messageType: "text",
      },
    });

    // Step 2: Classify Intent
    ws.send(JSON.stringify({ type: "activity_status", status: "analyzing" }));

    const { CLASSIFIER_PROMPT } = await import("../prompts/classifier");

    // Construct intent classification prompt
    const classificationMessages = [
      { role: "system", content: CLASSIFIER_PROMPT },
      {
        role: "user",
        content: `LATEST ASSISTANT RESPONSE:\n"${fullResponse}"\n\nClassify the intent now.`,
      },
    ];

    let intent = {
      needsQuiz: false,
      needsCoding: false,
      needsProgress: false,
      needsSuggestions: true,
    };

    await streamChatCompletion({
      messages: classificationMessages,
      onJson: (data) => {
        intent = { ...intent, ...data };
      },
    });

    // Enforce mutual exclusivity (Safety check)
    if (intent.needsQuiz && intent.needsCoding) {
      // Prioritize coding if both are present, or just pick one. Let's prioritize Quiz as it's usually a quick check before code.
      // Actually, user said "only 1 will be there".
      intent.needsCoding = false;
    }

    console.log("🧠 Context Classification:", intent);

    // Step 3: Conditional Generation
    const { QUIZ_PROMPT, CODING_PROMPT, SUGGESTIONS_PROMPT, PROGRESS_PROMPT } =
      await import("../prompts/generators");

    // A. Progress Update
    if (intent.needsProgress && userTopicId && subtopicId) {
      ws.send(
        JSON.stringify({ type: "activity_status", status: "updating_progress" })
      );
      const progressMessages = [
        { role: "system", content: PROGRESS_PROMPT },
        {
          role: "user",
          content: `Current Progress: ${currentProgress}%\nWeightage: ${weightage}%\nContext: User demonstrated understanding.`,
        },
      ];
      await streamChatCompletion({
        messages: progressMessages,
        onJson: async (data) => {
          if (data.progress_update) {
            await handleProgressUpdate(
              ws,
              userTopicId,
              subtopicId,
              data.progress_update
            );
          }
        },
      });
    }

    // B. Quiz Generation
    if (intent.needsQuiz) {
      ws.send(
        JSON.stringify({ type: "activity_status", status: "generating_quiz" })
      );
      const quizMessages = [
        { role: "system", content: QUIZ_PROMPT },
        {
          role: "user",
          content: `Generate a quiz based on: "${fullResponse}"`,
        },
      ];
      await streamChatCompletion({
        messages: quizMessages,
        onJson: async (data) => {
          if (data.quiz) {
            await prisma.chatMessage.create({
              data: {
                chatId: sessionId,
                userId: ws.userId,
                role: "assistant",
                content: `Quiz: ${data.quiz.question}`,
                messageType: "quiz",
                metadata: data.quiz,
              },
            });
            ws.send(JSON.stringify({ type: "quiz", quiz: data.quiz }));
          }
        },
      });
    }

    // C. Coding Challenge
    if (intent.needsCoding) {
      ws.send(
        JSON.stringify({ type: "activity_status", status: "generating_code" })
      );
      const codingMessages = [
        { role: "system", content: CODING_PROMPT },
        {
          role: "user",
          content: `Generate a coding challenge based on: "${fullResponse}"`,
        },
      ];
      await streamChatCompletion({
        messages: codingMessages,
        onJson: async (data) => {
          if (data.coding_challenge) {
            let exerciseId: number | undefined;
            if (subtopicId) {
              // Persist exercise code (similar to before)
              try {
                const exercise = await prisma.exercise.create({
                  data: {
                    subtopicId: subtopicId,
                    title: data.coding_challenge.title,
                    prompt: data.coding_challenge.description,
                    starterCode: data.coding_challenge.starterCode,
                    difficulty: "intermediate",
                    aiGenerated: true,
                    testCases: {
                      create:
                        data.coding_challenge.testCases?.map((tc: any) => ({
                          input: tc.input,
                          expectedOutput: tc.expected,
                          visible: true,
                        })) || [],
                    },
                  },
                });
                exerciseId = exercise.id;
              } catch (e) {
                console.error("Failed to create exercise", e);
              }
            }

            const challengePayload = {
              ...data.coding_challenge,
              id: exerciseId,
            };

            await prisma.chatMessage.create({
              data: {
                chatId: sessionId,
                userId: ws.userId,
                role: "assistant",
                content: `Coding Challenge: ${data.coding_challenge.title}`,
                messageType: "coding_challenge",
                metadata: challengePayload,
              },
            });
            ws.send(
              JSON.stringify({
                type: "coding_challenge",
                challenge: challengePayload,
              })
            );
          }
        },
      });
    }

    // D. Suggestions (Only if no quiz and no coding)
    if (intent.needsSuggestions && !intent.needsQuiz && !intent.needsCoding) {
      ws.send(
        JSON.stringify({
          type: "activity_status",
          status: "generating_suggestions",
        })
      );
      const suggestionMessages = [
        { role: "system", content: SUGGESTIONS_PROMPT },
        {
          role: "user",
          content: `Generate suggestions based on: "${fullResponse}"`,
        },
      ];
      await streamChatCompletion({
        messages: suggestionMessages,
        onJson: async (data) => {
          if (data.suggestions) {
            ws.send(
              JSON.stringify({
                type: "suggestions",
                suggestions: data.suggestions,
              })
            );
          }
        },
      });
    }

    ws.send(JSON.stringify({ type: "activity_status", status: "idle" }));
    ws.send(JSON.stringify({ type: "done" }));
  } catch (error) {
    console.error("AI Generation Error:", error);
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
    // 1. Get Master Topic ID
    const userTopic = await prisma.userTopic.findUnique({
      where: { id: userTopicId },
      select: { masterTopicId: true },
    });

    if (userTopic) {
      // 2. Get all subtopics and their weights
      const subtopics = await prisma.subtopic.findMany({
        where: { masterTopicId: userTopic.masterTopicId },
        select: { id: true, weightage: true },
      });

      // 3. Get all progress records
      const allProgress = await prisma.progress.findMany({
        where: { userTopicId },
      });

      // 4. Calculate weighted average
      let totalWeightedScore = 0;
      let totalMaxWeight = 0;

      for (const subtopic of subtopics) {
        const progress = allProgress.find(
          (p: any) => p.subtopicId === subtopic.id
        );
        const score = progress ? progress.completedPercent : 0;

        totalWeightedScore += score * subtopic.weightage;
        totalMaxWeight += subtopic.weightage;
      }

      const weightedProgress =
        totalMaxWeight > 0 ? totalWeightedScore / totalMaxWeight : 0;

      await prisma.userTopic.update({
        where: { id: userTopicId },
        data: {
          completedPercent: weightedProgress,
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
          topicProgress: weightedProgress,
        })
      );
    }
  } catch (error) {
    console.error("Failed to update progress:", error);
  }
}

// Periodic progress check
export async function checkProgress(ws: AuthenticatedWebSocket) {
  if (!ws.currentSessionId || !ws.userId) return;

  try {
    const session = await prisma.chatSession.findUnique({
      where: { id: ws.currentSessionId },
      include: {
        userTopic: { include: { masterTopic: true } },
        subtopic: true,
      },
    });

    if (!session || !session.userTopicId || !session.subtopicId) return;

    // Get current subtopic progress
    const progressRecord = await prisma.progress.findUnique({
      where: {
        userId_userTopicId_subtopicId: {
          userId: ws.userId,
          userTopicId: session.userTopicId,
          subtopicId: session.subtopicId,
        },
      },
    });

    const currentSubtopicProgress = progressRecord?.completedPercent || 0;

    // Calculate weighted topic progress (Fresh calc)
    const userTopicId = session.userTopicId;
    const subtopics = await prisma.subtopic.findMany({
      where: { masterTopicId: session.userTopic.masterTopicId },
      select: { id: true, weightage: true },
    });

    const allProgress = await prisma.progress.findMany({
      where: { userTopicId },
    });

    let totalWeightedScore = 0;
    let totalMaxWeight = 0;

    for (const subtopic of subtopics) {
      const p = allProgress.find((ap) => ap.subtopicId === subtopic.id);
      const score = p ? p.completedPercent : 0;
      totalWeightedScore += score * subtopic.weightage;
      totalMaxWeight += subtopic.weightage;
    }

    const weightedProgress =
      totalMaxWeight > 0 ? totalWeightedScore / totalMaxWeight : 0;

    // Send update
    ws.send(
      JSON.stringify({
        type: "progress_updated",
        topicId: userTopicId,
        subtopicId: session.subtopicId,
        progress: currentSubtopicProgress,
        topicProgress: weightedProgress,
      })
    );
  } catch (error) {
    console.error("Error in checkProgress:", error);
  }
}

async function generateVisualizer(
  ws: AuthenticatedWebSocket,
  description: string
) {
  try {
    console.log(`🎨 Generating visualization for: ${description}`);

    ws.send(
      JSON.stringify({
        type: "activity_status",
        status: "generating_visualizer",
      })
    );

    const messages = [
      {
        role: "system",
        content: VISUALIZER_PROMPT,
      },
      {
        role: "user",
        content: `Visualize this concept: ${description}`,
      },
    ];

    await streamChatCompletion({
      messages,
      model: "groq/compound",
      maxTokens: 4096,
      onDelta: (content) => {
        ws.send(JSON.stringify({ type: "visualizer_progress", content }));
      },
      onJson: (data) => {
        // Reset status
        ws.send(
          JSON.stringify({
            type: "activity_status",
            status: "idle",
          })
        );

        if (data.type === "visualizer" && data.payload) {
          ws.send(
            JSON.stringify({
              type: "visualizer",
              payload: data.payload,
            })
          );
        } else if (data.type === "error" && data.message) {
          ws.send(
            JSON.stringify({
              type: "message",
              sender: "assistant", // System message or assistant?
              content: `To create a visualization, I need a concrete request. ${data.message}`,
            })
          );
          // Also hide the loading state
          ws.send(JSON.stringify({ type: "visualizer_complete" }));
        }
      },
    });
  } catch (error) {
    console.error("Failed to generate visualization:", error);
    ws.send(
      JSON.stringify({
        type: "error",
        content: "Failed to generate visualization",
      })
    );
  } finally {
    ws.send(JSON.stringify({ type: "visualizer_complete" }));
  }
}

async function handleTopicGeneration(
  ws: AuthenticatedWebSocket,
  content: string
) {
  try {
    ws.send(JSON.stringify({ type: "typing" }));

    // 1. Analyze request and generate topic structure
    const { streamChatCompletion } = await import("../utils/ai");
    const { TOPIC_GENERATION_PROMPT } = await import(
      "../prompts/topicGeneration"
    );

    const prompt = TOPIC_GENERATION_PROMPT.replace("{{user_content}}", content);

    let jsonHandled = false;
    const fullResponse = await streamChatCompletion({
      messages: [
        { role: "system", content: prompt },
        { role: "user", content },
      ],
      // Don't stream to user to avoid showing raw JSON or partial thoughts.
      onJson: async (data: any) => {
        console.log("JSON data received:", data);
        if (data.topic_generation) {
          jsonHandled = true;
          const { masterTopic, subtopics } = data.topic_generation;

          // Notify user about plan creation
          ws.send(
            JSON.stringify({
              type: "message",
              sender: "assistant", // or 'system' depending on how you want it styled? Assistant is fine.
              content:
                "Creating personalized plan for your topic, please wait...",
            })
          );

          // 2. Create in DB
          try {
            // Create MasterTopic
            const newTopic = await prisma.masterTopic.create({
              data: {
                name: masterTopic.name,
                slug: masterTopic.slug + "-" + Date.now(), // Ensure uniqueness
                description: masterTopic.description,
                category: masterTopic.category,
                iconUrl: masterTopic.iconUrl,
                weightage: masterTopic.weightage,
                createdById: ws.userId,
                subtopics: {
                  create: subtopics.map((st: any, index: number) => ({
                    title: st.title,
                    difficultyLevel: st.difficultyLevel,
                    weightage: st.weightage,
                    orderIndex: index + 1,
                  })),
                },
              },
              include: { subtopics: true },
            });

            // 3. Enroll User
            const userTopic = await prisma.userTopic.create({
              data: {
                userId: ws.userId!,
                masterTopicId: newTopic.id,
                isActive: true,
              },
            });

            // Notify frontend to refresh topic list
            ws.send(JSON.stringify({ type: "topics_updated" }));

            // 4. Start Session (similar to handleTopicSelected)
            // Trigger logic as if topic was selected
            await handleTopicSelected(ws, {
              type: "topic_selected",
              topic: {
                topicId: userTopic.id, // We need UserTopic ID here for session?
                // Wait, handleTopicSelected expects { topicId, subtopicId, name, subtopic }
                // It creates session with userTopicId.
                // Actually handleTopicSelected logic uses `topicId` as UserTopicId?
                // Looking at handleTopicSelected:
                // data: { userTopicId: topicId }
                // So yes, it expects userTopicId.

                name: newTopic.name,
                subtopic: newTopic.subtopics[0].title,
                subtopicId: newTopic.subtopics[0].id,
              },
            });
          } catch (dbError) {
            console.error("DB Error creating topic:", dbError);
            ws.send(
              JSON.stringify({
                type: "message",
                sender: "assistant",
                content:
                  "I couldn't create that course right now. Could you try a different name?",
              })
            );
          }
        }
      },
    });

    // If we didn't get JSON, send the text response to the user
    if (!jsonHandled && fullResponse) {
      ws.send(
        JSON.stringify({
          type: "message",
          sender: "assistant",
          content: fullResponse,
        })
      );
      ws.send(JSON.stringify({ type: "done" }));
    }

    // If we didn't get JSON, it might have been a conversational message (handled by onDelta if we enabled it,
    // or we need to capture full response and send it if no JSON).
    // Since we disabled onDelta above, we need to handle "just chat" case.
    // Let's refactor slightly to allow dual mode or checking.

    // REFACTOR: Use a standard simple completion first to check intent?
    // Or just let the stream flow?
    // If the AI is instructed to ONLY output JSON for topics, it might be silent if we don't handle 'text'.
    // Let's change the prompt to allow text response for clarification.
  } catch (error) {
    console.error("Topic Gen Error", error);
    ws.send(
      JSON.stringify({
        type: "error",
        content: "Something went wrong generating the course.",
      })
    );
  }
}

// Handler for on-demand visualizer check
export async function handleVisualizerCheck(ws: AuthenticatedWebSocket) {
  try {
    const sessionId = ws.currentSessionId;
    if (!sessionId) {
      ws.send(
        JSON.stringify({
          type: "visualizer_check_result",
          payload: { isVisualizable: false, suggestions: [] },
        })
      );
      return;
    }

    // Fetch recent history
    const history = await prisma.chatMessage.findMany({
      where: { chatId: sessionId },
      orderBy: { createdAt: "desc" }, // Get latest first
      take: 6, // Analyze last few messages
    });

    // Reverse to chronological order for AI
    const recentMessages = history.reverse();

    const { VISUALIZER_CHECK_PROMPT } = await import(
      "../prompts/visualizerCheck"
    );

    const messages = [
      { role: "system", content: VISUALIZER_CHECK_PROMPT },
      ...recentMessages.map((m: any) => ({
        role: "user", // Simplified role mapping since we just need context
        content: `${m.role === "user" ? "User" : "Mentor"}: ${m.content}`,
      })),
    ];

    console.log("🔍 Checking visualizability...");

    await streamChatCompletion({
      messages,
      model: "llama-3.3-70b-versatile", // Fast model for check
      onJson: (data) => {
        console.log("Visualizer Check Result:", data);
        ws.send(
          JSON.stringify({
            type: "visualizer_check_result",
            payload: {
              isVisualizable: !!data.isVisualizable,
              suggestions: Array.isArray(data.suggestions)
                ? data.suggestions.slice(0, 3)
                : [],
            },
          })
        );
      },
    });
  } catch (error) {
    console.error("Visualizer check error:", error);
    // Fail silently/gracefully
    ws.send(
      JSON.stringify({
        type: "visualizer_check_result",
        payload: { isVisualizable: false, suggestions: [] },
      })
    );
  }
}
