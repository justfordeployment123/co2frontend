/**
 * ========================================================================
 * USER API
 * ========================================================================
 * 
 * API client for user profile and management endpoints
 */

import apiClient from './apiClient';

export const userAPI = {
  /**
   * Get user profile
   * @param {string} userId - User ID
   * @returns {Promise<object>} User profile
   */
  getUserProfile: async (userId) => {
    const response = await apiClient.get(`/users/${userId}/profile`);
    return response.data.profile || response.data;
  },

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {object} profileData - Profile data to update
   * @returns {Promise<object>} Updated profile
   */
  updateUserProfile: async (userId, profileData) => {
    const response = await apiClient.put(`/users/${userId}/profile`, profileData);
    return response.data.profile || response.data;
  },

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<object>} Success message
   */
  changePassword: async (userId, currentPassword, newPassword) => {
    const response = await apiClient.post(`/users/${userId}/change-password`, {
      currentPassword,
      newPassword
    });
    return response.data;
  },

  /**
   * Get company users
   * @param {string} companyId - Company ID
   * @returns {Promise<array>} List of users
   */
  getCompanyUsers: async (companyId) => {
    const response = await apiClient.get(`/users/company/${companyId}`);
    return response.data.users || response.data;
  },

  /**
   * Invite user to company
   * @param {string} companyId - Company ID
   * @param {object} inviteData - Invitation data (email, role, firstName, lastName)
   * @returns {Promise<object>} Invitation result
   */
  inviteUser: async (companyId, inviteData) => {
    const response = await apiClient.post(`/users/company/${companyId}/invite`, inviteData);
    return response.data;
  },

  /**
   * Add new user to company directly
   * @param {string} companyId - Company ID
   * @param {object} userData - User data (email, password, firstName, lastName, role)
   * @returns {Promise<object>} Result
   */
  addUser: async (companyId, userData) => {
    const response = await apiClient.post(`/users/company/${companyId}/add`, userData);
    return response.data;
  },

  /**
   * Update user role
   * @param {string} userId - User ID
   * @param {string} companyId - Company ID
   * @param {string} role - New role
   * @returns {Promise<object>} Success message
   */
  updateUserRole: async (userId, companyId, role) => {
    const response = await apiClient.put(`/users/${userId}/role`, {
      companyId,
      role
    });
    return response.data;
  },

  /**
   * Deactivate user
   * @param {string} userId - User ID
   * @returns {Promise<object>} Success message
   */
  deactivateUser: async (userId) => {
    const response = await apiClient.put(`/users/${userId}/deactivate`);
    return response.data;
  },

  /**
   * Reactivate user
   * @param {string} userId - User ID
   * @returns {Promise<object>} Success message
   */
  reactivateUser: async (userId) => {
    const response = await apiClient.put(`/users/${userId}/reactivate`);
    return response.data;
  },

  /**
   * Delete user from company
   * @param {string} companyId - Company ID
   * @param {string} userId - User ID
   * @returns {Promise<object>} Success message
   */
  deleteUser: async (companyId, userId) => {
    const response = await apiClient.delete(`/users/company/${companyId}/${userId}`);
    return response.data;
  }
};

export default userAPI;
