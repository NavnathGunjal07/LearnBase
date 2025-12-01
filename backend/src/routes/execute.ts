import express from "express";
import { codeExecutionService } from "../services/CodeExecutionService";
import { executeLimiter } from "../middleware/rateLimiter";

const router = express.Router();

// POST /api/execute - Execute JavaScript code
router.post("/execute", executeLimiter, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code || typeof code !== "string") {
      return res.status(400).json({
        error: "Code is required and must be a string",
      });
    }

    // Basic code length limit
    if (code.length > 10000) {
      return res.status(400).json({
        error: "Code is too long (max 10,000 characters)",
      });
    }

    console.log(`🔧 Executing code (${code.length} characters)...`);

    const result = await codeExecutionService.executeJavaScript(code);

    console.log(`✅ Code execution completed in ${result.executionTime}ms`);

    return res.json(result);
  } catch (error: any) {
    console.error("❌ Code execution error:", error);

    return res.status(500).json({
      success: false,
      output: "",
      error: "Internal server error during code execution",
      executionTime: 0,
    });
  }
});

export default router;
