import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import apiRoutes from "./routes";
import { NextFunction, urlencoded, json, Request, Response } from "express";
import prisma from "./config/prisma";
import { setupWebSocketServer } from "./websocket/chatServer";
import { apiLimiter } from "./middleware/rateLimiter";
import passport from "./config/passport";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Create HTTP server (needed for WebSocket)
const server = http.createServer(app);

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGINS?.split(",") || "*",
  })
);
app.use(json());
app.use(urlencoded({ extended: true }));

// Initialize Passport
app.use(passport.initialize());

// Apply rate limiting to all API routes
app.use("/api", apiLimiter);

// Routes
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Welcome to LearnBase API", status: "running" });
});

// ... (imports)

// Routes
// ...
app.use("/api", apiRoutes);

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

// Connect to database and start server
async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log("✅ Database connected successfully");

    // Setup WebSocket server
    setupWebSocketServer(server);

    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
      console.log(`🔌 WebSocket server: ws://localhost:${PORT}/ws`);
    });
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  console.log("👋 Database disconnected");
  process.exit(0);
});

export default app;
