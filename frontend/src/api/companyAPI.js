import apiClient from './apiClient';

/**
 * Company API Service
 * Handles company and user management API calls
 */
export const companyAPI = {
  /**
   * Get company details
   * @param {string} companyId - Company ID
   * @returns {Promise} Company data
   */
  getCompany: async (companyId) => {
    const response = await apiClient.get(`/companies/${companyId}`);
    return response.data;
  },

  /**
   * Update company details
   * @param {string} companyId - Company ID
   * @param {Object} data - Company data to update
   * @returns {Promise} Updated company
   */
  updateCompany: async (companyId, data) => {
    const response = await apiClient.put(`/companies/${companyId}`, data);
    return response.data;
  },

  /**
   * List company users
   * @param {string} companyId - Company ID
   * @returns {Promise} List of users
   */
  listUsers: async (companyId) => {
    const response = await apiClient.get(`/companies/${companyId}/users`);
    return response.data;
  },

  /**
   * Invite user to company
   * @param {string} companyId - Company ID
   * @param {Object} data - User invitation data
   * @returns {Promise} Invitation result
   */
  inviteUser: async (companyId, data) => {
    const response = await apiClient.post(`/companies/${companyId}/users`, data);
    return response.data;
  },

  /**
   * Update user role
   * @param {string} companyId - Company ID
   * @param {string} userId - User ID
   * @param {Object} data - Role data
   * @returns {Promise} Updated user role
   */
  updateUserRole: async (companyId, userId, data) => {
    const response = await apiClient.put(`/companies/${companyId}/users/${userId}/role`, data);
    return response.data;
  },

  /**
   * Remove user from company
   * @param {string} companyId - Company ID
   * @param {string} userId - User ID
   * @returns {Promise} Remove confirmation
   */
  removeUser: async (companyId, userId) => {
    const response = await apiClient.delete(`/companies/${companyId}/users/${userId}`);
    return response.data;
  },
};

export default companyAPI;
