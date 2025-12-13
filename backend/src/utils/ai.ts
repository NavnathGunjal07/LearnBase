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
 * - Streaming response with text deltas
 * - Parsing JSON from complete response at the end
 */
export async function streamChatCompletion({
  messages,
  model = "llama-3.3-70b-versatile",
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

    // Stream all content chunks
    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        if (onDelta) onDelta(content);
        fullResponse += content;
      }
    }

    // After streaming is complete, try to parse JSON if onJson callback is provided
    if (onJson && fullResponse.trim()) {
      // 1. Try to find markdown JSON block first
      const jsonMatch = fullResponse.match(/```json\s*([\s\S]*?)\s*```/);
      let jsonContent = jsonMatch ? jsonMatch[1] : null;

      // 2. If no markdown block, try to find raw JSON object
      if (!jsonContent) {
        const firstOpen = fullResponse.indexOf("{");
        const lastClose = fullResponse.lastIndexOf("}");
        if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
          jsonContent = fullResponse.substring(firstOpen, lastClose + 1);
        }
      }

      // 3. Try to parse the JSON content
      if (jsonContent) {
        try {
          const data = JSON.parse(jsonContent.trim());
          onJson(data);
        } catch (e) {
          console.error("Failed to parse JSON from response:", e);
          console.error("JSON content was:", jsonContent);
        }
      }
    }

    return fullResponse;
  } catch (error) {
    console.error("AI Chat Completion Error:", error);
    throw error;
  }
}
