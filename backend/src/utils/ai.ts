import { groq } from "../config/groq";

interface ChatCompletionOptions {
  messages: any[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  onDelta?: (content: string) => void;
  onJson?: (json: any) => void;
}

/**
 * Centralized utility for streaming chat completions from AI.
 * Handles:
 * - GROQ API interaction
 * - Streaming response
 * - Extracting hidden JSON blocks (e.g., for progress updates)
 * - Invoking callbacks for text content and JSON data
 */
export async function streamChatCompletion({
  messages,
  model = "llama-3.1-8b-instant",
  temperature = 0.7,
  maxTokens = 1024,
  onDelta,
  onJson,
}: ChatCompletionOptions): Promise<string> {
  try {
    const completion = await groq.chat.completions.create({
      messages,
      model,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    });

    let fullResponse = "";
    let jsonBuffer = "";
    let isCollectingJson = false;

    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta?.content || "";

      // Check for JSON start
      if (content.includes("```json")) {
        isCollectingJson = true;
        // If there's content before the JSON block, send it
        const parts = content.split("```json");
        if (parts[0]) {
          if (onDelta) onDelta(parts[0]);
          fullResponse += parts[0];
        }
        continue;
      }

      if (isCollectingJson) {
        jsonBuffer += content;
        // Check for JSON end
        if (content.includes("```")) {
          isCollectingJson = false;
          // Process the JSON
          const cleanJson = jsonBuffer.replace("```", "").trim();
          try {
            if (cleanJson) {
              const data = JSON.parse(cleanJson);
              if (onJson) onJson(data);
            }
          } catch (e) {
            console.error("Failed to parse hidden JSON from AI response:", e);
          }
          jsonBuffer = ""; // Reset buffer
        }
      } else {
        // Normal text content
        if (onDelta && content) onDelta(content);
        fullResponse += content;
      }
    }

    return fullResponse;
  } catch (error) {
    console.error("AI Chat Completion Error:", error);
    throw error;
  }
}
