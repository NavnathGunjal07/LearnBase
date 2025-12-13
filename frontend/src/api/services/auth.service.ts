import axiosInstance from "../axiosInstance";

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
   * Verify token validity
   */
  async verifyToken(): Promise<{ valid: boolean; user?: any }> {
    const response = await axiosInstance.get("/auth/verify");
    return response.data;
  },

  /**
   * Verify Google One Tap Token
   */
  async verifyGoogleOneTap(token: string): Promise<{ redirectUrl: string }> {
    const response = await axiosInstance.post("/auth/google/onetap", { token });
    return response.data;
  },
};
