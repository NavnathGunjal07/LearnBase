import axiosInstance from "@/api/axiosInstance";
import { handleError } from "@/utils/errorHandler";

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await axiosInstance.post<AuthResponse>(
        "/auth/login",
        credentials,
      );
      const { user, token } = response.data;

      // Store the token in localStorage
      localStorage.setItem("token", token);

      return { user, token };
    } catch (error) {
      handleError(error, "Login");
      throw error;
    }
  },

  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await axiosInstance.post<AuthResponse>(
        "/auth/register",
        userData,
      );
      const { user, token } = response.data;

      // Store the token in localStorage
      localStorage.setItem("token", token);

      return { user, token };
    } catch (error) {
      handleError(error, "Registration");
      throw error;
    }
  },

  logout(): void {
    // Remove the token from localStorage
    localStorage.removeItem("token");
    // Clear any other user-related data
    // ...
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;

      const response = await axiosInstance.get<User>("/auth/me");
      return response.data;
    } catch (error) {
      handleError(error, "Get Current User");
      // If token is invalid, clear it
      localStorage.removeItem("token");
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem("token");
  },
};
