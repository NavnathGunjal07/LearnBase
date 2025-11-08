import axiosInstance from '../axiosInstance';

export interface ExecuteCodeData {
  code: string;
}

export interface ExecuteCodeResponse {
  success: boolean;
  output: string;
  error: string | null;
  executionTime: number;
}

export const executeService = {
  /**
   * Execute JavaScript code
   */
  async executeCode(code: string): Promise<ExecuteCodeResponse> {
    const response = await axiosInstance.post<ExecuteCodeResponse>('/execute/execute', { code });
    return response.data;
  },
};
