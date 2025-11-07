import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import OpenAI from 'openai';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  isAlive?: boolean;
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
          await getGroqResponse(ws, message.content);
        } else if (message.type === 'topic_selected' && message.topic) {
          // Handle topic and subtopic selection
          const { name: topicName, subtopic: subtopicName } = message.topic;
          
          // Send a confirmation message
          const responseContent = subtopicName 
            ? `Great choice! You've selected **${topicName} - ${subtopicName}**. I can help you learn about this specific subtopic. What would you like to know?`
            : `Great choice! You've selected **${topicName}**. I can help you learn about this topic. What specific aspect of ${topicName} would you like to explore first?`;
          
          ws.send(JSON.stringify({
            type: 'delta',
            sender: 'assistant',
            content: responseContent,
            timestamp: new Date().toISOString()
          }));
           ws.send(JSON.stringify({ type: 'done' }));
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

    // Handle the streaming response
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        ws.send(JSON.stringify({
          type: 'delta',
          content: content
        }));
      }
    }

    // Send done signal
    ws.send(JSON.stringify({ type: 'done' }));

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
