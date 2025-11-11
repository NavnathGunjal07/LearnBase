import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import OpenAI from 'openai';
import { PrismaClient } from '../../prisma/generated/client';
import { SYSTEM_PROMPT } from '../prompts/system';
import { ONBOARDING_PROMPT } from '../prompts/onboarding';

const prisma = new PrismaClient();

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  isAlive?: boolean;
  currentSessionId?: string;
  currentTopicId?: number;
  currentSubtopicId?: number;
  isOnboarding?: boolean;
  onboardingMessages?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

// Groq client configuration
const groqClient = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});



export function setupWebSocketServer(server: Server) {
  const wss = new WebSocketServer({
    server,
    path: '/ws'
  });

  console.log('🔌 WebSocket server initialized on /ws');

  // Heartbeat to detect broken connections
  const interval = setInterval(() => {
    wss.clients.forEach((ws: AuthenticatedWebSocket) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000); // 30 seconds

  wss.on('close', () => {
    clearInterval(interval);
  });

  wss.on('connection', (ws: AuthenticatedWebSocket, req) => {
    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Extract token from query params or headers
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token') || req.headers.authorization?.replace('Bearer ', '');

    // Authenticate user
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string };
        ws.userId = decoded.userId;
        console.log(`✅ WebSocket authenticated: User ${ws.userId}`);
      } catch (error) {
        console.error('❌ WebSocket authentication failed:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Authentication failed' }));
        ws.close();
        return;
      }
    } else {
      console.log('⚠️ WebSocket connected without authentication');
    }

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Connected to LearnBase chat server'
    }));

    // Handle incoming messages
    ws.on('message', async (data: Buffer) => {
      try {
        const messageText = data.toString();
        let message;
        
        // Try to parse as JSON, fallback to raw text
        try {
          message = JSON.parse(messageText);
        } catch (e) {
          // If not valid JSON, treat as raw text message
          message = {
            type: 'message',
            content: messageText
          };
        }
        
        console.log(`📨 Received message from user ${ws.userId}:`, message);

        // Process the message
        if (message.type === 'message' && message.content) {
          // Initialize onboarding messages array if not exists
          if (!ws.onboardingMessages) {
            ws.onboardingMessages = [];
          }

          // Add user message to onboarding history
          if (ws.isOnboarding) {
            ws.onboardingMessages.push({ role: 'user', content: message.content });
          }

          // Save user message to database
          if (ws.currentSessionId) {
            await prisma.chatMessage.create({
              data: {
                chatId: ws.currentSessionId,
                userId: ws.userId,
                role: 'user',
                content: message.content,
              },
            });
          }
          
          await getGroqResponse(ws, message.content);
        } else if (message.type === 'start_onboarding') {
          // Handle onboarding start
          ws.isOnboarding = true;
          ws.onboardingMessages = [];

          // Create a special onboarding chat session (we'll use a dummy userTopicId)
          // For onboarding, we don't need a real topic, so we'll handle it differently
          if (ws.userId) {
            // Get user's name for personalized greeting
            const user = await prisma.user.findUnique({
              where: { id: ws.userId },
              select: { name: true },
            });

            // Start onboarding conversation
            const welcomeMessage = `👋 Welcome to LearnBase${user?.name ? `, ${user.name}` : ''}! I'm excited to help you start your learning journey. 

To personalize your experience, I'd love to get to know you a bit. Tell me - what brings you to LearnBase? Are you completely new to programming, or do you have some experience already?`;

            // Stream the welcome message
            const chunkSize = 10;
            for (let i = 0; i < welcomeMessage.length; i += chunkSize) {
              const chunk = welcomeMessage.slice(i, i + chunkSize);
              ws.send(JSON.stringify({
                type: 'delta',
                content: chunk
              }));
              await new Promise(resolve => setTimeout(resolve, 20));
            }
            
            ws.send(JSON.stringify({ type: 'done' }));

            // Add to onboarding messages
            ws.onboardingMessages.push({ role: 'assistant', content: welcomeMessage });
          }
        } else if (message.type === 'topic_selected' && message.topic) {
          // Handle topic and subtopic selection
          const { name: topicName, subtopic: subtopicName, topicId, subtopicId } = message.topic;
          
          // Store topic/subtopic IDs in WebSocket
          ws.currentTopicId = topicId;
          ws.currentSubtopicId = subtopicId;
          
          // Find or create chat session
          if (ws.userId && topicId) {
            const userTopic = await prisma.userTopic.findFirst({
              where: {
                userId: ws.userId,
                masterTopicId: topicId,
              },
            });

            if (userTopic) {
              let chatSession = await prisma.chatSession.findFirst({
                where: {
                  userId: ws.userId,
                  userTopicId: userTopic.id,
                  subtopicId: subtopicId || null,
                },
                orderBy: {
                  lastActivity: 'desc',
                },
              });

              if (!chatSession) {
                chatSession = await prisma.chatSession.create({
                  data: {
                    userId: ws.userId,
                    userTopicId: userTopic.id,
                    subtopicId: subtopicId || null,
                    title: subtopicName
                      ? `${topicName} - ${subtopicName}`
                      : topicName,
                  },
                });
              }

              ws.currentSessionId = chatSession.id;
              
              // Update last activity
              await prisma.chatSession.update({
                where: { id: chatSession.id },
                data: { lastActivity: new Date() },
              });
            }
          }
          
          // Send a confirmation message with streaming effect
          const responseContent = subtopicName 
            ? `Great choice! You've selected **${topicName} - ${subtopicName}**. I can help you learn about this specific subtopic. What would you like to know?`
            : `Great choice! You've selected **${topicName}**. I can help you learn about this topic. What specific aspect of ${topicName} would you like to explore first?`;
          
          // Stream the message character by character for a nice effect
          const chunkSize = 10; // Send 10 characters at a time
          for (let i = 0; i < responseContent.length; i += chunkSize) {
            const chunk = responseContent.slice(i, i + chunkSize);
            ws.send(JSON.stringify({
              type: 'delta',
              content: chunk
            }));
            // Small delay for streaming effect (optional)
            await new Promise(resolve => setTimeout(resolve, 20));
          }
          
          ws.send(JSON.stringify({ type: 'done' }));
          
          // Save AI welcome message to database
          if (ws.currentSessionId) {
            await prisma.chatMessage.create({
              data: {
                chatId: ws.currentSessionId,
                userId: null,
                role: 'assistant',
                content: responseContent,
              },
            });
          }
        } else if (message.type === 'session_resumed') {
          // Handle session resumption (when chat history exists)
          const { sessionId, topicId, subtopicId } = message;
          
          // Store session and topic info in WebSocket
          ws.currentSessionId = sessionId;
          ws.currentTopicId = topicId;
          ws.currentSubtopicId = subtopicId;
          
          // Update last activity for the session
          if (sessionId) {
            await prisma.chatSession.update({
              where: { id: sessionId },
              data: { lastActivity: new Date() },
            });
          }
          
          console.log(`📝 Session resumed: ${sessionId} for user ${ws.userId}`);
        }

      } catch (error) {
        console.error('Error handling message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Failed to process message'
        }));
      }
    });

    ws.on('close', () => {
      console.log(`👋 WebSocket disconnected: User ${ws.userId || 'unknown'}`);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  return wss;
}

// Get Groq API response with streaming
async function getGroqResponse(ws: AuthenticatedWebSocket, userMessage: string) {
  try {
    // Use onboarding prompt if this is an onboarding session
    const systemPrompt = ws.isOnboarding ? ONBOARDING_PROMPT : SYSTEM_PROMPT;
    
    // Build messages array
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt }
    ];

    // For onboarding, include conversation history
    if (ws.isOnboarding && ws.onboardingMessages) {
      // Add all previous messages from onboarding conversation
      ws.onboardingMessages.forEach(msg => {
        messages.push({ role: msg.role, content: msg.content });
      });
    } else {
      // For regular chat, just add the current message
      messages.push({ role: 'user', content: userMessage });
    }

    const stream = await groqClient.chat.completions.create({
      model: 'openai/gpt-oss-20b',
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 1500,
      stream: true,
    });

    let fullResponse = '';

    // Handle the streaming response
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        ws.send(JSON.stringify({
          type: 'delta',
          content: content
        }));
      }
    }

    // Send done signal
    ws.send(JSON.stringify({ type: 'done' }));

    // Add assistant response to onboarding messages
    if (ws.isOnboarding && fullResponse) {
      if (!ws.onboardingMessages) {
        ws.onboardingMessages = [];
      }
      ws.onboardingMessages.push({ role: 'assistant', content: fullResponse });

      // Try to extract onboarding information from conversation
      // Start checking after 4 messages (2 exchanges)
      if (ws.userId && ws.onboardingMessages.length >= 4) {
        // Extract information after each exchange
        await extractAndUpdateOnboardingData(ws);
        
        // Check completion after 6 messages (3 exchanges) and every 2 messages after that
        if (ws.onboardingMessages.length >= 6 && ws.onboardingMessages.length % 2 === 0) {
          // Check if we have all required fields
          const user = await prisma.user.findUnique({
            where: { id: ws.userId },
            select: {
              background: true,
              goals: true,
              learningInterests: true,
              skillLevel: true,
              hasCompletedOnboarding: true,
            },
          });

          // Require ALL fields: background, goals, learningInterests, and skillLevel
          if (user && !user.hasCompletedOnboarding) {
            const hasAllInfo = user.background && user.goals && user.learningInterests && user.skillLevel;
            
            if (hasAllInfo) {
              // Use AI to determine if conversation is complete and natural
              const completionCheck = await checkOnboardingCompletion(ws.onboardingMessages);
              
              if (completionCheck.shouldComplete) {
                // Complete onboarding
                await prisma.user.update({
                  where: { id: ws.userId },
                  data: { hasCompletedOnboarding: true },
                });

                // Send completion message
                const completionMessage = completionCheck.completionMessage || 
                  `Perfect! I've got everything I need to personalize your learning experience. Now, let's choose a topic to start learning! 🚀`;
                
                // Stream completion message
                const chunkSize = 10;
                for (let i = 0; i < completionMessage.length; i += chunkSize) {
                  const chunk = completionMessage.slice(i, i + chunkSize);
                  ws.send(JSON.stringify({
                    type: 'delta',
                    content: chunk
                  }));
                  await new Promise(resolve => setTimeout(resolve, 20));
                }
                ws.send(JSON.stringify({ type: 'done' }));
                ws.send(JSON.stringify({ type: 'onboarding_complete' }));

                // Add to messages
                if (ws.onboardingMessages) {
                  ws.onboardingMessages.push({ role: 'assistant', content: completionMessage });
                }
              }
            }
          }
        }
      }
    }

    // Save AI response to database
    if (ws.currentSessionId && fullResponse) {
      await prisma.chatMessage.create({
        data: {
          chatId: ws.currentSessionId,
          userId: null,
          role: 'assistant',
          content: fullResponse,
        },
      });
      
      // Update session last activity
      await prisma.chatSession.update({
        where: { id: ws.currentSessionId },
        data: { lastActivity: new Date() },
      });
    }

  } catch (error: any) {
    console.error('Groq API error:', error);

    // Send error message to user
    const errorMessage = error.message || 'Failed to get AI response';
    ws.send(JSON.stringify({
      type: 'delta',
      content: `Error: ${errorMessage}. Please try again.`
    }));
    ws.send(JSON.stringify({ type: 'done' }));
  }
}

// Helper to broadcast to all connected clients
export function broadcastToAll(wss: WebSocketServer, message: any) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// Helper to send to specific user
export function sendToUser(wss: WebSocketServer, userId: string, message: any) {
  wss.clients.forEach((client: AuthenticatedWebSocket) => {
    if (client.userId === userId && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// Check if onboarding conversation is complete
async function checkOnboardingCompletion(messages: Array<{ role: 'user' | 'assistant'; content: string }>): Promise<{ shouldComplete: boolean; completionMessage?: string }> {
  try {
    const conversationContext = messages
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n');

    const checkPrompt = `Based on the following onboarding conversation, determine if we have gathered COMPLETE information about the user. We need ALL of these:
1. Background (educational/professional background - must be clear and specific)
2. Goals (what they want to achieve - must be clear and specific)
3. Learning interests (what topics/technologies they want to learn - must be clear and specific)
4. Skill level (beginner, intermediate, or advanced - must be determined)

IMPORTANT: Only return shouldComplete: true if ALL FOUR pieces of information are clearly gathered and specific. If any information is vague, missing, or unclear, return shouldComplete: false so the AI can ask follow-up questions.

Return JSON with:
{
  "shouldComplete": true/false,
  "completionMessage": "A friendly message to wrap up onboarding and encourage them to select a topic (only if shouldComplete is true)"
}

Conversation:
${conversationContext}

Return ONLY the JSON object:`;

    const response = await groqClient.chat.completions.create({
      model: 'openai/gpt-oss-20b',
      messages: [
        { role: 'system', content: 'You are an assistant that determines if onboarding conversations are complete. Return only valid JSON.' },
        { role: 'user', content: checkPrompt }
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    const responseText = response.choices[0]?.message?.content || '';
    const jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(jsonText);

    return {
      shouldComplete: result.shouldComplete === true,
      completionMessage: result.completionMessage,
    };
  } catch (error) {
    console.error('Error checking onboarding completion:', error);
    return { shouldComplete: false };
  }
}

// Extract onboarding information from conversation and update user
async function extractAndUpdateOnboardingData(ws: AuthenticatedWebSocket): Promise<boolean> {
  if (!ws.userId || !ws.onboardingMessages || ws.onboardingMessages.length < 2) {
    return false;
  }

  try {
    // Build conversation context for extraction
    const conversationContext = ws.onboardingMessages
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n');

    // Use AI to extract structured information
    const extractionPrompt = `Based on the following conversation, extract the user's information in JSON format. Return ONLY valid JSON with these fields:
{
  "background": "user's educational/professional background (string or null)",
  "goals": "what they want to achieve (string or null)",
  "learningInterests": "what they want to learn, comma-separated (string or null)",
  "skillLevel": "beginner, intermediate, or advanced (string)"
}

If information is not available, use null for that field. Be conservative - only extract what is clearly stated.

Conversation:
${conversationContext}

Return ONLY the JSON object, no other text:`;

    const extractionResponse = await groqClient.chat.completions.create({
      model: 'openai/gpt-oss-20b',
      messages: [
        { role: 'system', content: 'You are a data extraction assistant. Extract information from conversations and return only valid JSON.' },
        { role: 'user', content: extractionPrompt }
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const extractedText = extractionResponse.choices[0]?.message?.content || '';
    
    // Try to parse JSON (might be wrapped in markdown code blocks)
    let extractedData: any = {};
    try {
      // Remove markdown code blocks if present
      const jsonText = extractedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      extractedData = JSON.parse(jsonText);
    } catch (e) {
      console.error('Failed to parse extracted data:', e);
      return false;
    }

    // Update user with extracted information (only if we have new data)
    const updateData: any = {};
    if (extractedData.background) updateData.background = extractedData.background;
    if (extractedData.goals) updateData.goals = extractedData.goals;
    if (extractedData.learningInterests) updateData.learningInterests = extractedData.learningInterests;
    if (extractedData.skillLevel && ['beginner', 'intermediate', 'advanced'].includes(extractedData.skillLevel.toLowerCase())) {
      updateData.skillLevel = extractedData.skillLevel.toLowerCase();
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: ws.userId },
        data: updateData,
      });
      console.log(`✅ Updated onboarding data for user ${ws.userId}:`, updateData);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error extracting onboarding data:', error);
    // Don't fail the chat if extraction fails
    return false;
  }
}
