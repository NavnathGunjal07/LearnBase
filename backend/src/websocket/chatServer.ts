import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import OpenAI from 'openai';
import { PrismaClient } from '../../prisma/generated/client';

const prisma = new PrismaClient();

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  isAlive?: boolean;
  currentSessionId?: string;
  currentTopicId?: number;
  currentSubtopicId?: number;
}

// Groq client configuration
const groqClient = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

// System prompt for the AI
const SYSTEM_PROMPT = `You are a helpful programming tutor. Explain concepts clearly and provide examples when helpful.

IMPORTANT: Format your responses using Markdown:
- Use **bold** for emphasis
- Use \`code\` for inline code
- Use \`\`\`language for code blocks
- Use # for headings
- Use - or * for bullet points
- Use > for blockquotes
- Use tables when comparing concepts

Keep responses concise, educational, and well-formatted.`;

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
    const stream = await groqClient.chat.completions.create({
      model: 'openai/gpt-oss-20b',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ],
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
