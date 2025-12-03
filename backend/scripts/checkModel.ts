import { streamChatCompletion } from "../src/utils/ai";
import { VISUALIZER_PROMPT } from "../src/prompts/visualizer";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function checkModel() {
  console.log("🚀 Starting Visualizer Model Check...");
  console.log("Model: llama-3.3-70b-versatile");

  const description = "node js event lop";

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

  try {
    await streamChatCompletion({
      messages,
      model: "llama-3.3-70b-versatile",
      onDelta: (content) => {
        process.stdout.write(content);
      },
      onJson: (data) => {
        console.log("\n\n✨ JSON Received:\n", JSON.stringify(data, null, 2));
      },
    });
    console.log("\n\n✅ Check Complete");
  } catch (error) {
    console.error("\n❌ Error:", error);
  }
}

checkModel();
