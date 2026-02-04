/**
 * ========================================================================
 * DASHBOARD CONTROLLER
 * ========================================================================
 * 
 * HTTP handlers for dashboard and analytics endpoints
 */

import * as dashboardService from '../services/dashboardService.js';
import pool from '../utils/db.js';

/**
 * Get company KPIs
 * GET /api/dashboard/kpis/:companyId
 * Query params: periodId (optional)
 */
export async function getKPIs(req, res) {
  try {
    const { companyId } = req.params;
    let { periodId } = req.query;

    // Handle "current" keyword to get the current reporting period
    if (periodId === 'current') {
      const currentPeriodQuery = `
        SELECT id FROM reporting_periods 
        WHERE company_id = $1 
        AND status = 'active' 
        ORDER BY period_start_date DESC 
        LIMIT 1
      `;
      const result = await pool.query(currentPeriodQuery, [companyId]);
      if (result.rows.length > 0) {
        periodId = result.rows[0].id;
      } else {
        periodId = null; // No active period, show all data
      }
    }

    const kpis = await dashboardService.getCompanyKPIs(companyId, periodId);

    res.json({
      success: true,
      kpis
    });
  } catch (error) {
    console.error('[DashboardController] Error getting KPIs:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to retrieve KPIs. Please try again.'
    });
  }
}

/**
 * Get emissions intensity metrics
 * POST /api/dashboard/intensity/:companyId/:periodId
 * Body: { revenue, employees, squareMeters, productionUnits }
 */
export async function getEmissionsIntensity(req, res) {
  try {
    const { companyId, periodId } = req.params;
    const metricsData = req.body;

    const intensity = await dashboardService.getEmissionsIntensity(
      companyId,
      periodId,
      metricsData
    );

    res.json({
      success: true,
      intensity
    });
  } catch (error) {
    console.error('[DashboardController] Error getting emissions intensity:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to calculate emissions intensity. Please try again.'
    });
  }
}

/**
 * Generate alerts for a company
 * POST /api/dashboard/alerts/:companyId
 * Body: { highEmissionThreshold, monthlyIncreaseThreshold, scope1Threshold, scope2Threshold }
 */
export async function getAlerts(req, res) {
  try {
    const { companyId } = req.params;
    const thresholds = req.body;

    const alerts = await dashboardService.generateAlerts(companyId, thresholds);

    res.json({
      success: true,
      alerts,
      count: alerts.length
    });
  } catch (error) {
    console.error('[DashboardController] Error generating alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to generate alerts. Please try again.'
    });
  }
}

/**
 * Get benchmark comparison
 * GET /api/dashboard/benchmark/:companyId/:periodId
 * Query params: industry (required)
 */
export async function getBenchmark(req, res) {
  try {
    const { companyId, periodId } = req.params;
    const { industry } = req.query;

    if (!industry) {
      return res.status(400).json({
        success: false,
        error: 'industry parameter is required'
      });
    }

    const benchmark = await dashboardService.getBenchmarkComparison(
      companyId,
      industry,
      periodId
    );

    res.json({
      success: true,
      benchmark
    });
  } catch (error) {
    console.error('[DashboardController] Error getting benchmark:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to retrieve benchmark comparison. Please try again.'
    });
  }
}

/**
 * Get target progress
 * POST /api/dashboard/target-progress/:companyId
 * Body: { baselineYear, targetYear, reductionPercent, baselinePeriodId }
 */
export async function getTargetProgress(req, res) {
  try {
    const { companyId } = req.params;
    const targetData = req.body;

    const progress = await dashboardService.getTargetProgress(companyId, targetData);

    res.json({
      success: true,
      progress
    });
  } catch (error) {
    console.error('[DashboardController] Error getting target progress:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to retrieve target progress. Please try again.'
    });
  }
}

export default {
  getKPIs,
  getEmissionsIntensity,
  getAlerts,
  getBenchmark,
  getTargetProgress
};
