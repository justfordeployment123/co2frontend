import apiClient from './apiClient';

/**
 * Authentication API Service
 * Handles all authentication-related API calls
 */
export const authAPI = {
  /**
   * Register a new company and user
   * @param {Object} data - Registration data
   * @param {string} data.companyName - Company name
   * @param {string} data.email - User email
   * @param {string} data.password - User password
   * @param {string} data.firstName - User first name
   * @param {string} data.lastName - User last name
   * @param {string} data.country - Company country code
   * @param {string} data.industry - Company industry (optional)
   * @returns {Promise} Response with token and user data
   */
  register: async (data) => {
    const response = await apiClient.post('/auth/company/signup', data);
    return response.data;
  },

  /**
   * Login user
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.email - User email
   * @param {string} credentials.password - User password
   * @returns {Promise} Response with token and user data
   */
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  /**
   * Logout user (client-side only)
   * Backend doesn't require logout endpoint as JWT is stateless
   * @returns {Promise} Resolved promise
   */
  logout: async () => {
    // No backend call needed for JWT-based auth
    return Promise.resolve({ message: 'Logged out' });
  },

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise} Response confirmation
   */
  forgotPassword: async (email) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Reset password with token
   * @param {Object} data - Reset password data
   * @param {string} data.token - Reset token
   * @param {string} data.password - New password
   * @returns {Promise} Response confirmation
   */
  resetPassword: async (data) => {
    const response = await apiClient.post('/auth/reset-password', data);
    return response.data;
  },

  /**
   * Get current user profile
   * @returns {Promise} User data
   */
  getProfile: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data.user;
  },
};

export default authAPI;
