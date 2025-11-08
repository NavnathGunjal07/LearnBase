import axiosInstance from '../axiosInstance';

export interface Subtopic {
  id: string;
  title: string;
  description: string;
  difficultyLevel: 'basic' | 'intermediate' | 'advanced';
  orderIndex: number;
  progress: number;
}

export interface Topic {
  id: string;
  masterTopicId: number;
  name: string;
  description: string;
  iconUrl: string | null;
  category: string;
  enrolledAt: string;
  lastAccessedAt: string;
  progress: number;
  subtopics: Subtopic[];
}

export interface MasterTopic {
  id: number;
  name: string;
  slug: string;
  description: string;
  iconUrl: string | null;
  category: string;
}

export interface EnrollTopicData {
  masterTopicId: number;
}

export const topicService = {
  /**
   * Get all user's enrolled topics with progress
   */
  async getUserTopics(): Promise<Topic[]> {
    const response = await axiosInstance.get<Topic[]>('/topics');
    return response.data;
  },

  /**
   * Get all available master topics
   */
  async getMasterTopics(): Promise<MasterTopic[]> {
    const response = await axiosInstance.get<MasterTopic[]>('/master-topics');
    return response.data;
  },

  /**
   * Get a specific master topic with subtopics
   */
  async getMasterTopicById(id: number): Promise<MasterTopic & { subtopics: Subtopic[] }> {
    const response = await axiosInstance.get(`/master-topics/${id}`);
    return response.data;
  },

  /**
   * Enroll user in a topic
   */
  async enrollInTopic(data: EnrollTopicData): Promise<Topic> {
    const response = await axiosInstance.post<Topic>('/master-topics/enroll', data);
    return response.data;
  },

  /**
   * Update topic progress
   */
  async updateProgress(topicId: string, subtopicId: string, progress: number): Promise<void> {
    await axiosInstance.patch(`/topics/${topicId}/subtopics/${subtopicId}/progress`, { progress });
  },

  /**
   * Unenroll from a topic
   */
  async unenrollFromTopic(topicId: string): Promise<void> {
    await axiosInstance.delete(`/topics/${topicId}`);
  },
};
