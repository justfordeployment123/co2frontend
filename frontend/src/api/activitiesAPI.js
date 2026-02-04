import apiClient from './apiClient';

/**
 * Activities API Service
 * Handles all activity-related API calls
 */
export const activitiesAPI = {
  /**
   * List activities by type
   * @param {string} companyId - Company ID
   * @param {string} activityType - Type of activity
   * @param {Object} params - Query parameters (periodId, limit, offset)
   * @returns {Promise} List of activities
   */
  listActivities: async (companyId, activityType, params = {}) => {
    const response = await apiClient.get(
      `/companies/${companyId}/activities/${activityType}`,
      { params }
    );
    return response.data;
  },

  /**
   * Get single activity by ID
   * @param {string} companyId - Company ID
   * @param {string} activityType - Type of activity
   * @param {string} activityId - Activity ID
   * @returns {Promise} Activity data
   */
  getActivity: async (companyId, activityType, activityId) => {
    const response = await apiClient.get(
      `/companies/${companyId}/activities/${activityType}/${activityId}`
    );
    return response.data;
  },

  /**
   * Create new activity
   * @param {string} companyId - Company ID
   * @param {string} activityType - Type of activity
   * @param {Object} data - Activity data
   * @returns {Promise} Created activity
   */
  createActivity: async (companyId, activityType, data) => {
    const response = await apiClient.post(
      `/companies/${companyId}/activities/${activityType}`,
      data
    );
    return response.data;
  },

  /**
   * Update existing activity
   * @param {string} companyId - Company ID
   * @param {string} activityType - Type of activity
   * @param {string} activityId - Activity ID
   * @param {Object} data - Updated activity data
   * @returns {Promise} Updated activity
   */
  updateActivity: async (companyId, activityType, activityId, data) => {
    const response = await apiClient.put(
      `/companies/${companyId}/activities/${activityType}/${activityId}`,
      data
    );
    return response.data;
  },

  /**
   * Delete activity
   * @param {string} companyId - Company ID
   * @param {string} activityType - Type of activity
   * @param {string} activityId - Activity ID
   * @returns {Promise} Delete confirmation
   */
  deleteActivity: async (companyId, activityType, activityId) => {
    const response = await apiClient.delete(
      `/companies/${companyId}/activities/${activityType}/${activityId}`
    );
    return response.data;
  },
};

export default activitiesAPI;
