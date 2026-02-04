import apiClient from './apiClient';

/**
 * Dashboard API Service
 * Handles dashboard and analytics API calls
 */
export const dashboardAPI = {
  /**
   * Get company KPIs
   * @param {string} companyId - Company ID
   * @param {string} periodId - Optional reporting period ID
   * @returns {Promise} KPI data
   */
  getKPIs: async (companyId, periodId = null) => {
    const params = periodId ? { periodId } : {};
    const response = await apiClient.get(`/dashboard/kpis/${companyId}`, { params });
    return response.data.kpis || response.data;
  },

  /**
   * Get emissions intensity metrics
   * @param {string} companyId - Company ID
   * @param {string} periodId - Reporting period ID
   * @param {Object} data - Intensity data (revenue, employees, etc.)
   * @returns {Promise} Intensity metrics
   */
  getEmissionsIntensity: async (companyId, periodId, data) => {
    const response = await apiClient.post(
      `/dashboard/intensity/${companyId}/${periodId}`,
      data
    );
    return response.data;
  },

  /**
   * Get alerts for company
   * @param {string} companyId - Company ID
   * @param {Object} thresholds - Alert thresholds
   * @returns {Promise} List of alerts
   */
  getAlerts: async (companyId, thresholds = {}) => {
    const response = await apiClient.post(`/dashboard/alerts/${companyId}`, thresholds);
    return response.data;
  },

  /**
   * Get benchmark comparison
   * @param {string} companyId - Company ID
   * @param {string} periodId - Reporting period ID
   * @param {string} industry - Industry type
   * @returns {Promise} Benchmark data
   */
  getBenchmark: async (companyId, periodId, industry) => {
    const response = await apiClient.get(
      `/dashboard/benchmark/${companyId}/${periodId}`,
      { params: { industry } }
    );
    return response.data;
  },

  /**
   * Get target progress
   * @param {string} companyId - Company ID
   * @param {Object} targetData - Target configuration
   * @returns {Promise} Progress data
   */
  getTargetProgress: async (companyId, targetData) => {
    const response = await apiClient.post(
      `/dashboard/target-progress/${companyId}`,
      targetData
    );
    return response.data;
  },
};

export default dashboardAPI;
