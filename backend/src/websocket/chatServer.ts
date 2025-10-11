import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import OpenAI from 'openai';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  isAlive?: boolean;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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
        const message = data.toString();
        console.log(`📨 Received message from user ${ws.userId}:`, message);

        // Send typing indicator
        ws.send(JSON.stringify({ type: 'typing' }));

        // Get AI response with streaming
        await getOpenAIResponse(ws, message);

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

// Get OpenAI response with streaming
async function getOpenAIResponse(ws: AuthenticatedWebSocket, userMessage: string) {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY not configured');
      ws.send(JSON.stringify({
        type: 'delta',
        content: 'OpenAI API key is not configured. Please add OPENAI_API_KEY to your .env file.'
      }));
      ws.send(JSON.stringify({ type: 'done' }));
      return;
    }

    // Create streaming completion
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // or 'gpt-4' for better quality
      messages: [
        {
          role: 'system',
          content: `You are a helpful programming tutor. Explain concepts clearly and provide examples when helpful.

IMPORTANT: Format your responses using Markdown:
- Use **bold** for emphasis
- Use \`code\` for inline code
- Use \`\`\`language for code blocks
- Use # for headings
- Use - or * for bullet points
- Use > for blockquotes
- Use tables when comparing concepts

Keep responses concise, educational, and well-formatted.`
        },
        {
          role: 'user',
          content: userMessage
        }
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 1500,
    });

    // Stream the response
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
    console.error('OpenAI API error:', error);
    
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
