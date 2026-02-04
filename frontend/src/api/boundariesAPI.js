import apiClient from './apiClient';

export const boundariesAPI = {
  getAllQuestions: async () => {
    const response = await apiClient.get('/boundaries/questions');
    return response.data;
  },

  submitAnswers: async (answers) => {
    const response = await apiClient.post('/boundaries/answers', answers);
    return response.data;
  },

  getUserAnswers: async (userId) => {
    const response = await apiClient.get(`/boundaries/answers/${userId}`);
    return response.data;
  },

  getOnboardingStatus: async () => {
    try {
      const response = await apiClient.get('/boundaries/onboarding-status');
      return response.data;
    } catch (error) {
      // Return incomplete status on error (triggers redirect to setup)
      console.error('Failed to check onboarding status:', error);
      return { wizard_completed: false };
    }
  },

  // Company boundary settings
  getCompanyBoundaryAnswers: async () => {
    const response = await apiClient.get('/boundaries/company-answers');
    return response.data;
  },

  saveCompanyBoundaryAnswers: async (answers) => {
    const response = await apiClient.post('/boundaries/company-answers', { answers });
    return response.data;
  },

  // Reference data
  getBoundaryQuestions: async () => {
    const response = await apiClient.get('/reference/boundary-questions');
    return response.data;
  },

  getEnabledActivityTypes: async (companyId) => {
    const response = await apiClient.get(`/boundaries/enabled-activity-types/${companyId}`);
    return response.data;
  }
};
