import { Subtopic, Topic } from "@/utils/types";
import axiosInstance from "../axiosInstance";

export const topicService = {
  /**
   * Get all user's enrolled topics with progress
   */
  async getUserTopics(): Promise<Topic[]> {
    const response = await axiosInstance.get<Topic[]>("/topics/user");
    return response.data;
  },

  /**
   * Get all available topics
   */
  async getTopics(): Promise<Topic[]> {
    const response = await axiosInstance.get<Topic[]>("/topics/");
    return response.data;
  },

  /**
   * Get a specific  topic with subtopics
   */
  async getTopicById(id: number): Promise<Topic & { subtopics: Subtopic[] }> {
    const response = await axiosInstance.get(`/topics/${id}`);
    return response.data;
  },

  /**
   * Enroll user in a topic
   */
  async enrollInTopic(topicId: string): Promise<Topic> {
    const response = await axiosInstance.post<Topic>("/topics/enroll", {
      topicId,
    });
    return response.data;
  },

  /**
   * Update topic progress
   */
  async updateProgress(
    topicId: string,
    subtopicId: string,
    progress: number
  ): Promise<void> {
    await axiosInstance.patch(`/subtopics/${topicId}/${subtopicId}/progress`, {
      completedPercent: progress,
    });
  },

  /**
   * Unenroll from a topic
   */
  async unenrollFromTopic(topicId: string): Promise<void> {
    await axiosInstance.delete(`/topics/${topicId}`);
  },
};
