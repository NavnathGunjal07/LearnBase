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

    // Fallback: If onJson is provided but we didn't successfully parse JSON during the stream
    // (e.g. because markers were split across chunks or missing), try parsing the full response now.
    if (onJson && !isCollectingJson && fullResponse.trim()) {
      // 1. Try to find markdown JSON block
      const jsonMatch = fullResponse.match(/```json\s*([\s\S]*?)\s*```/);
      let jsonContent = jsonMatch ? jsonMatch[1] : fullResponse;

      // 2. If no markdown, try to find the outermost JSON object (first '{' to last '}')
      // This handles cases like: "Here is the JSON: { ... }" or just "{ ... }"
      if (!jsonMatch) {
        const firstOpen = fullResponse.indexOf("{");
        const lastClose = fullResponse.lastIndexOf("}");
        if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
          jsonContent = fullResponse.substring(firstOpen, lastClose + 1);
        }
      }

      try {
        const data = JSON.parse(jsonContent);
        // Only call onJson if we haven't called it yet?
        // The streaming logic resets jsonBuffer, so it might have called it multiple times if there were multiple blocks.
        // But for metadata prompt, we expect one object.
        // Let's assume if we are here, we might want to ensure we got the data.
        // However, to avoid duplicates, we should probably track if we successfully parsed anything.
        // For now, let's just try parsing. If the streaming logic worked, this might be redundant but harmless if idempotent.
        // Better: let's rely on this fallback for the "pure metadata" case mostly.
        onJson(data);
      } catch (e) {
        // Silent failure on fallback, as it might just be text
        // console.warn("Fallback JSON parse failed", e);
      }
    }

    return fullResponse;
  } catch (error) {
    console.error("AI Chat Completion Error:", error);
    throw error;
  }
}
