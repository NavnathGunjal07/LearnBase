import { Subtopic, Topic } from "@/utils/types";
import axiosInstance from "../axiosInstance";
import { handleError } from "@/utils/errorHandler";

export const topicService = {
  /**
   * Get all user's enrolled topics with progress
   */
  async getUserTopics(): Promise<Topic[]> {
    try {
      const response = await axiosInstance.get<Topic[]>("/topics/user");
      return response.data;
    } catch (error) {
      handleError(error, "Get User Topics");
      throw error;
    }
  },

  /**
   * Get all available topics
   */
  async getTopics(): Promise<Topic[]> {
    try {
      const response = await axiosInstance.get<Topic[]>("/topics/");
      return response.data;
    } catch (error) {
      handleError(error, "Get Topics");
      throw error;
    }
  },

  /**
   * Get a specific  topic with subtopics
   */
  async getTopicById(id: number): Promise<Topic & { subtopics: Subtopic[] }> {
    try {
      const response = await axiosInstance.get(`/topics/${id}`);
      return response.data;
    } catch (error) {
      handleError(error, "Get Topic By ID");
      throw error;
    }
  },

  /**
   * Enroll user in a topic
   */
  async enrollInTopic(topicId: string): Promise<Topic> {
    try {
      const response = await axiosInstance.post<Topic>("/topics/enroll", {
        topicId,
      });
      return response.data;
    } catch (error) {
      handleError(error, "Enroll in Topic");
      throw error;
    }
  },

  /**
   * Update topic progress
   */
  async updateProgress(
    topicId: string,
    subtopicId: string,
    progress: number
  ): Promise<void> {
    try {
      await axiosInstance.patch(
        `/subtopics/${topicId}/${subtopicId}/progress`,
        {
          completedPercent: progress,
        }
      );
    } catch (error) {
      handleError(error, "Update Progress");
      throw error;
    }
  },

  /**
   * Unenroll from a topic
   */
  async unenrollFromTopic(topicId: string): Promise<void> {
    try {
      await axiosInstance.delete(`/topics/${topicId}`);
    } catch (error) {
      handleError(error, "Unenroll from Topic");
      throw error;
    }
  },
};
