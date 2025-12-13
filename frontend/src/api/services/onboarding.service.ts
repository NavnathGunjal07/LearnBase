import axiosInstance from "../axiosInstance";

export interface OnboardingStatus {
  hasCompletedOnboarding: boolean;
  onboardingData: {
    background: string | null;
    goals: string | null;
    learningInterests: string | null;
    skillLevel: string;
  };
}

export interface OnboardingData {
  background?: string;
  goals?: string;
  learningInterests?: string;
  skillLevel?: string;
  hasCompletedOnboarding?: boolean;
}

export interface CompleteOnboardingData {
  background?: string;
  goals?: string;
  learningInterests?: string;
  skillLevel?: string;
}

export const onboardingService = {
  /**
   * Get onboarding status
   */
  async getStatus(): Promise<OnboardingStatus> {
    const response = await axiosInstance.get<OnboardingStatus>(
      "/onboarding/status",
      // @ts-ignore
      { skipToast: true }
    );
    return response.data as OnboardingStatus;
  },

  /**
   * Update onboarding data
   */
  async updateData(data: OnboardingData): Promise<any> {
    const response = await axiosInstance.patch("/onboarding/update", data);
    return response.data;
  },

  /**
   * Complete onboarding
   */
  async complete(
    data: CompleteOnboardingData
  ): Promise<{ success: boolean; user: any }> {
    const response = await axiosInstance.post("/onboarding/complete", data);
    return response.data;
  },
};
