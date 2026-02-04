// ========================================================================
// REPORTING PERIODS API
// API functions for managing reporting periods
// ========================================================================

import apiClient from './apiClient';

export const reportingPeriodsAPI = {
  /**
   * Get all reporting periods for a company
   */
  async listPeriods(companyId) {
    const response = await apiClient.get(`/companies/${companyId}/reporting-periods`);
    return response.data;
  },

  /**
   * Get a specific reporting period
   */
  async getPeriod(companyId, periodId) {
    const response = await apiClient.get(`/companies/${companyId}/reporting-periods/${periodId}`);
    return response.data;
  },

  /**
   * Create a new reporting period
   */
  async createPeriod(companyId, periodData) {
    const response = await apiClient.post(`/companies/${companyId}/reporting-periods`, periodData);
    return response.data;
  },

  /**
   * Update a reporting period
   */
  async updatePeriod(companyId, periodId, periodData) {
    const response = await apiClient.put(`/companies/${companyId}/reporting-periods/${periodId}`, periodData);
    return response.data;
  },

  /**
   * Delete a reporting period
   */
  async deletePeriod(companyId, periodId) {
    const response = await apiClient.delete(`/companies/${companyId}/reporting-periods/${periodId}`);
    return response.data;
  },
};
