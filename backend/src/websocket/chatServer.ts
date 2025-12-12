import { WebSocketServer } from "ws";
import { Server } from "http";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma";
import { wsLogger } from "../utils/logger";
import {
  handleOnboardingFlow,
  AuthenticatedWebSocket,
} from "./onboardingHandler";
import { handleLearningFlow } from "./learningHandler";
import { handleWebSocketError } from "../utils/errorHandler";

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
    try {
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

          // Fetch user to check onboarding status
          const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
          });

          if (user) {
            ws.isAuthenticated = true;
            ws.hasCompletedOnboarding = user.hasCompletedOnboarding;
            ws.userEmail = user.email;

            wsLogger.info("WebSocket authenticated with token", {
              userId: ws.userId,
              completedOnboarding: ws.hasCompletedOnboarding,
            });
            console.log(
              `✅ WebSocket authenticated: User ${ws.userId} (Onboarding: ${
                ws.hasCompletedOnboarding ? "Done" : "Pending"
              })`
            );

            // Send authenticated welcome message
            ws.send(
              JSON.stringify({
                type: "authenticated",
                message: ws.hasCompletedOnboarding
                  ? "Welcome back! You are authenticated."
                  : "Welcome! Let's finish setting up your profile.",
                userId: user.id,
              })
            );
          } else {
            throw new Error("User not found");
          }
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
        // Unauthenticated user - strictly rejected in new flow
        wsLogger.info("Unauthenticated connection rejected");
        console.log("⚠️ Unauthenticated connection attempt rejected");

        // Send auth_required message to prompt user to login via Google
        ws.send(
          JSON.stringify({
            type: "auth_required",
            message: "Please log in to continue.",
          })
        );
      }
    } catch (error) {
      handleWebSocketError(error, ws, "WebSocket connection initialization");
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

        // Strict Authenticated-Only flow
        if (!ws.isAuthenticated || !ws.userId) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Authentication required. Please log in.",
            })
          );
          return;
        }

        // Route based on onboarding status
        if (!ws.hasCompletedOnboarding) {
          // Handle authenticated onboarding flow
          wsLogger.info("Routing to onboarding flow");
          await handleOnboardingFlow(ws, message);
        } else {
          // Handle authenticated learning flow
          wsLogger.info("Routing to learning flow");
          await handleLearningFlow(ws, message);
        }
      } catch (error) {
        wsLogger.error("Error handling WebSocket message", {
          error: (error as Error).message,
          stack: (error as Error).stack,
        });
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
