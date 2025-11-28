import { WebSocketServer } from "ws";
import { Server } from "http";
import jwt from "jsonwebtoken";
import { wsLogger, authLogger } from "../utils/logger";
import { handleAuthFlow, AuthenticatedWebSocket } from "./onboardingHandler";
import { handleLearningFlow } from "./learningHandler";

export function setupWebSocketServer(server: Server) {
  const wss = new WebSocketServer({
    server,
    path: "/ws",
  });

  wsLogger.info("WebSocket server initialized on /ws");
  console.log("🔌 WebSocket server initialized on /ws");

  // Heartbeat to detect broken connections
  const interval = setInterval(() => {
    wss.clients.forEach((ws: AuthenticatedWebSocket) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(interval);
  });

  wss.on("connection", async (ws: AuthenticatedWebSocket, req) => {
    ws.isAlive = true;
    ws.isAuthenticated = false;

    ws.on("pong", () => {
      ws.isAlive = true;
    });

    // Extract token from query params or headers
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const token =
      url.searchParams.get("token") ||
      req.headers.authorization?.replace("Bearer ", "");

    // Try to authenticate with token if provided
    if (token) {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || "your-secret-key"
        ) as { userId: string };
        ws.userId = decoded.userId;
        ws.isAuthenticated = true;

        wsLogger.info("WebSocket authenticated with token", {
          userId: ws.userId,
        });
        console.log(`✅ WebSocket authenticated: User ${ws.userId}`);

        // Send authenticated welcome message
        ws.send(
          JSON.stringify({
            type: "authenticated",
            message: "Welcome back! You are authenticated.",
          })
        );
      } catch (error) {
        wsLogger.error("Token authentication failed", { error });
        console.error("❌ Token authentication failed:", error);
        ws.send(
          JSON.stringify({
            type: "auth_required",
            message: "Authentication required",
          })
        );
      }
    } else {
      // Unauthenticated user - start auth flow
      wsLogger.info("Unauthenticated connection - starting auth flow");
      authLogger.info("New auth flow initiated");
      console.log("⚠️ New unauthenticated connection - starting auth flow");

      // Send auth_required message to prompt user
      ws.send(
        JSON.stringify({
          type: "auth_required",
          message:
            "Welcome to LearnBase! 👋\\n\\nTo get started, please provide your email address.",
        })
      );
    }

    // Handle incoming messages
    ws.on("message", async (data: Buffer) => {
      try {
        const messageText = data.toString();
        let message;

        // Try to parse as JSON, fallback to raw text
        try {
          message = JSON.parse(messageText);
        } catch (e) {
          message = {
            type: "message",
            content: messageText,
          };
        }

        wsLogger.info("📨 WebSocket message received", {
          userId: ws.userId || "unauthenticated",
          userEmail: ws.userEmail || "none",
          isAuthenticated: ws.isAuthenticated,
          messageType: message.type,
          contentLength: message.content?.length || 0,
        });

        console.log(
          `📨 Received message from ${ws.userId || ws.userEmail || "unknown"}:`,
          message
        );

        // Route based on authentication status
        if (!ws.isAuthenticated) {
          // Handle authentication/onboarding flow
          wsLogger.info("Routing to auth flow");
          await handleAuthFlow(ws, message);
        } else {
          // Handle authenticated user messages
          wsLogger.info("Handling authenticated user message");

          // Route to learning handler
          await handleLearningFlow(ws, message);
        }
      } catch (error) {
        wsLogger.error("Error handling WebSocket message", {
          error: (error as Error).message,
          stack: (error as Error).stack,
        });
        console.error("Error handling message:", error);
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Failed to process message",
          })
        );
      }
    });

    ws.on("close", () => {
      wsLogger.info("WebSocket connection closed", {
        userId: ws.userId,
        userEmail: ws.userEmail,
      });
      console.log(
        `👋 WebSocket disconnected: User ${
          ws.userId || ws.userEmail || "unknown"
        }`
      );
    });

    ws.on("error", (error) => {
      wsLogger.error("WebSocket error", { error, userId: ws.userId });
      console.error("WebSocket error:", error);
    });
  });

  return wss;
}
