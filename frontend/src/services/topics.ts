import axiosInstance from '@/api/axiosInstance';

export interface Topic {
  id: string;
  title: string;
  description?: string;
  progress: number;
  subtopics?: Subtopic[];
  createdAt: string;
  updatedAt: string;
}

export interface Subtopic {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  order: number;
  topicId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTopicData {
  title: string;
  description?: string;
}

export interface CreateSubtopicData {
  title: string;
  description?: string;
  topicId: string;
  order?: number;
}

export const topicService = {
  // Topic operations
  async getTopics(): Promise<Topic[]> {
    try {
      const response = await axiosInstance.get<Topic[]>('/topics');
      return response.data;
    } catch (error) {
      console.error('Error fetching topics:', error);
      throw error;
    }
  },

  async getTopicById(id: string): Promise<Topic> {
    try {
      const response = await axiosInstance.get<Topic>(`/topics/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching topic ${id}:`, error);
      throw error;
    }
  },

  async createTopic(data: CreateTopicData): Promise<Topic> {
    try {
      const response = await axiosInstance.post<Topic>('/topics', data);
      return response.data;
    } catch (error) {
      console.error('Error creating topic:', error);
      throw error;
    }
  },

  async updateTopic(id: string, data: Partial<CreateTopicData>): Promise<Topic> {
    try {
      const response = await axiosInstance.patch<Topic>(`/topics/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating topic ${id}:`, error);
      throw error;
    }
  },

  async deleteTopic(id: string): Promise<void> {
    try {
      await axiosInstance.delete(`/topics/${id}`);
    } catch (error) {
      console.error(`Error deleting topic ${id}:`, error);
      throw error;
    }
  },

  // Subtopic operations
  async createSubtopic(data: CreateSubtopicData): Promise<Subtopic> {
    try {
      const response = await axiosInstance.post<Subtopic>('/subtopics', data);
      return response.data;
    } catch (error) {
      console.error('Error creating subtopic:', error);
      throw error;
    }
  },

  async updateSubtopic(
    id: string,
    data: Partial<Omit<CreateSubtopicData, 'topicId'>>
  ): Promise<Subtopic> {
    try {
      const response = await axiosInstance.patch<Subtopic>(`/subtopics/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating subtopic ${id}:`, error);
      throw error;
    }
  },

  async deleteSubtopic(id: string): Promise<void> {
    try {
      await axiosInstance.delete(`/subtopics/${id}`);
    } catch (error) {
      console.error(`Error deleting subtopic ${id}:`, error);
      throw error;
    }
  },

  // Progress operations
  async updateSubtopicProgress(
    subtopicId: string,
    completed: boolean
  ): Promise<Subtopic> {
    try {
      const response = await axiosInstance.patch<Subtopic>(
        `/subtopics/${subtopicId}/progress`,
        { completed }
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating progress for subtopic ${subtopicId}:`, error);
      throw error;
    }
  },

  async getTopicProgress(topicId: string): Promise<number> {
    try {
      const response = await axiosInstance.get<{ progress: number }>(
        `/topics/${topicId}/progress`
      );
      return response.data.progress;
    } catch (error) {
      console.error(`Error getting progress for topic ${topicId}:`, error);
      throw error;
    }
  },
};
