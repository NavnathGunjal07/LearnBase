import { streamChatCompletion } from "../../utils/ai";

// Mock the groq module
jest.mock("../../config/groq", () => ({
  groq: {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  },
}));

import { groq } from "../../config/groq";

describe("AI Utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("streamChatCompletion", () => {
    it("should stream chat completion successfully", async () => {
      const mockChunks = [
        { choices: [{ delta: { content: "Hello" } }] },
        { choices: [{ delta: { content: " world" } }] },
        { choices: [{ delta: { content: "!" } }] },
      ];

      (groq.chat.completions.create as jest.Mock).mockResolvedValue(
        (async function* () {
          for (const chunk of mockChunks) {
            yield chunk;
          }
        })()
      );

      const messages = [{ role: "user", content: "Test message" }];
      const result = await streamChatCompletion({ messages });

      expect(result).toBe("Hello world!");
      expect(groq.chat.completions.create).toHaveBeenCalledWith({
        messages,
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_tokens: 1024,
        stream: true,
      });
    });

    it("should call onDelta callback for each chunk", async () => {
      const mockChunks = [
        { choices: [{ delta: { content: "Test" } }] },
        { choices: [{ delta: { content: " content" } }] },
      ];

      (groq.chat.completions.create as jest.Mock).mockResolvedValue(
        (async function* () {
          for (const chunk of mockChunks) {
            yield chunk;
          }
        })()
      );

      const onDelta = jest.fn();
      const messages = [{ role: "user", content: "Test" }];

      await streamChatCompletion({ messages, onDelta });

      expect(onDelta).toHaveBeenCalledTimes(2);
      expect(onDelta).toHaveBeenNthCalledWith(1, "Test");
      expect(onDelta).toHaveBeenNthCalledWith(2, " content");
    });

    it("should parse JSON from markdown code block", async () => {
      const jsonResponse = '```json\n{"key": "value", "number": 42}\n```';
      const mockChunks = [{ choices: [{ delta: { content: jsonResponse } }] }];

      (groq.chat.completions.create as jest.Mock).mockResolvedValue(
        (async function* () {
          for (const chunk of mockChunks) {
            yield chunk;
          }
        })()
      );

      const onJson = jest.fn();
      const messages = [{ role: "user", content: "Test" }];

      await streamChatCompletion({ messages, onJson });

      expect(onJson).toHaveBeenCalledWith({ key: "value", number: 42 });
    });

    it("should parse JSON from raw JSON object", async () => {
      const jsonResponse = 'Some text {"key": "value"} more text';
      const mockChunks = [{ choices: [{ delta: { content: jsonResponse } }] }];

      (groq.chat.completions.create as jest.Mock).mockResolvedValue(
        (async function* () {
          for (const chunk of mockChunks) {
            yield chunk;
          }
        })()
      );

      const onJson = jest.fn();
      const messages = [{ role: "user", content: "Test" }];

      await streamChatCompletion({ messages, onJson });

      expect(onJson).toHaveBeenCalledWith({ key: "value" });
    });

    it("should use custom model and parameters", async () => {
      const mockChunks = [{ choices: [{ delta: { content: "Test" } }] }];

      (groq.chat.completions.create as jest.Mock).mockResolvedValue(
        (async function* () {
          for (const chunk of mockChunks) {
            yield chunk;
          }
        })()
      );

      const messages = [{ role: "user", content: "Test" }];
      await streamChatCompletion({
        messages,
        model: "custom-model",
        temperature: 0.5,
        maxTokens: 2048,
      });

      expect(groq.chat.completions.create).toHaveBeenCalledWith({
        messages,
        model: "custom-model",
        temperature: 0.5,
        max_tokens: 2048,
        stream: true,
      });
    });

    it("should handle empty content chunks gracefully", async () => {
      const mockChunks = [
        { choices: [{ delta: { content: "Hello" } }] },
        { choices: [{ delta: { content: "" } }] },
        { choices: [{ delta: { content: " world" } }] },
        { choices: [{ delta: {} }] },
      ];

      (groq.chat.completions.create as jest.Mock).mockResolvedValue(
        (async function* () {
          for (const chunk of mockChunks) {
            yield chunk;
          }
        })()
      );

      const onDelta = jest.fn();
      const messages = [{ role: "user", content: "Test" }];

      const result = await streamChatCompletion({ messages, onDelta });

      expect(result).toBe("Hello world");
      expect(onDelta).toHaveBeenCalledTimes(2); // Only called for non-empty content
    });

    it("should handle API errors", async () => {
      const error = new Error("API Error");
      (groq.chat.completions.create as jest.Mock).mockRejectedValue(error);

      const messages = [{ role: "user", content: "Test" }];

      await expect(streamChatCompletion({ messages })).rejects.toThrow(
        "API Error"
      );
    });

    it("should not call onJson if response is not JSON", async () => {
      const textResponse = "This is just plain text without any JSON";
      const mockChunks = [{ choices: [{ delta: { content: textResponse } }] }];

      (groq.chat.completions.create as jest.Mock).mockResolvedValue(
        (async function* () {
          for (const chunk of mockChunks) {
            yield chunk;
          }
        })()
      );

      const onJson = jest.fn();
      const messages = [{ role: "user", content: "Test" }];

      await streamChatCompletion({ messages, onJson });

      expect(onJson).not.toHaveBeenCalled();
    });
  });
});
