import axiosInstance from '../axiosInstance';

export interface User {
  id: string;
  name: string;
  email: string;
  skillLevel: string;
  currentLanguage: string | null;
  totalPoints: number;
  streakDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserData {
  name?: string;
  skillLevel?: string;
  currentLanguage?: string;
}

export interface LastSession {
  hasSession: boolean;
  topicId?: number;
  topicName?: string;
  subtopicId?: number | null;
  subtopicName?: string | null;
  lastActivity?: string;
}

export const userService = {
  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    const response = await axiosInstance.get<User>('/users/me');
    return response.data;
  },

  /**
   * Update current user profile
   */
  async updateUser(data: UpdateUserData): Promise<User> {
    const response = await axiosInstance.patch<User>('/users/me', data);
    return response.data;
  },

  /**
   * Get user's last learning session
   */
  async getLastSession(): Promise<LastSession> {
    const response = await axiosInstance.get<LastSession>('/users/me/last-session');
    return response.data;
  },

  /**
   * Delete current user account
   */
  async deleteAccount(): Promise<void> {
    await axiosInstance.delete('/users/me');
  },
};
