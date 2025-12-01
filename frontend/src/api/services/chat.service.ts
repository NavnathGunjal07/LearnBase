import axiosInstance from "../axiosInstance";

export interface ChatMessage {
  sender: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export interface ChatHistoryResponse {
  sessionId: string;
  messages: ChatMessage[];
}

export interface SaveMessageData {
  sessionId?: string;
  role: "user" | "assistant";
  content: string;
  topicId?: number;
  subtopicId?: number;
}

export interface SaveMessageResponse {
  id: string;
  sessionId: string;
  success: boolean;
}

export const chatService = {
  /**
   * Get chat history for a specific topic/subtopic
   */
  async getChatHistory(
    topicId: number,
    subtopicId?: number,
  ): Promise<ChatHistoryResponse> {
    const params: any = { topicId };
    if (subtopicId) {
      params.subtopicId = subtopicId;
    }

    const response = await axiosInstance.get<ChatHistoryResponse>(
      "/chat/history",
      { params },
    );
    return response.data;
  },

  /**
   * Save a chat message
   */
  async saveMessage(data: SaveMessageData): Promise<SaveMessageResponse> {
    const response = await axiosInstance.post<SaveMessageResponse>(
      "/chat/message",
      data,
    );
    return response.data;
  },

  /**
   * Clear chat history for a specific topic/subtopic
   */
  async clearHistory(
    topicId: number,
    subtopicId?: number,
  ): Promise<{ success: boolean; message: string }> {
    const params: any = { topicId };
    if (subtopicId) {
      params.subtopicId = subtopicId;
    }

    const response = await axiosInstance.delete("/chat/history", { params });
    return response.data;
  },
};
