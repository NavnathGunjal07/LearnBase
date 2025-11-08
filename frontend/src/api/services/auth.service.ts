import axiosInstance from '../axiosInstance';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    skillLevel: string;
    currentLanguage: string | null;
    totalPoints: number;
    streakDays: number;
  };
  token: string;
}

export const authService = {
  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await axiosInstance.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await axiosInstance.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  /**
   * Verify token validity
   */
  async verifyToken(): Promise<{ valid: boolean; user?: any }> {
    const response = await axiosInstance.get('/auth/verify');
    return response.data;
  },
};
