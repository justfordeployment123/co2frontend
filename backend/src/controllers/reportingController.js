/**
 * ========================================================================
 * REPORTING CONTROLLER
 * ========================================================================
 * 
 * Advanced reporting endpoints
 */

import * as reportingService from '../services/reportingService.js';

/**
 * Get emissions trends
 * GET /api/reports/trends
 */
async function getEmissionsTrends(req, res) {
  try {
    const companyId = req.user.companyId;
    const { startDate, endDate, groupBy, activityType } = req.query;
    
    const trends = await reportingService.getEmissionsTrends(companyId, {
      startDate,
      endDate,
      groupBy,
      activityType
    });
    
    res.json({ success: true, trends });
  } catch (error) {
    console.error('[ReportingController] Error in getEmissionsTrends:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Get scope breakdown
 * GET /api/reports/scope-breakdown/:periodId
 */
async function getScopeBreakdown(req, res) {
  try {
    const { periodId } = req.params;
    
    const breakdown = await reportingService.getScopeBreakdown(periodId);
    
    res.json({ success: true, breakdown });
  } catch (error) {
    console.error('[ReportingController] Error in getScopeBreakdown:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Compare two periods
 * GET /api/reports/compare/:periodId1/:periodId2
 */
async function comparePeriods(req, res) {
  try {
    const { periodId1, periodId2 } = req.params;
    
    const comparison = await reportingService.comparePeriods(periodId1, periodId2);
    
    res.json({ success: true, comparison });
  } catch (error) {
    console.error('[ReportingController] Error in comparePeriods:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Get emission intensity metrics
 * POST /api/reports/intensity/:periodId
 */
async function getEmissionIntensity(req, res) {
  try {
    const { periodId } = req.params;
    const { revenue, employees, floorArea, production, currency, productionUnit } = req.body;
    
    const intensity = await reportingService.getEmissionIntensity(periodId, {
      revenue,
      employees,
      floorArea,
      production,
      currency,
      productionUnit
    });
    
    res.json({ success: true, intensity });
  } catch (error) {
    console.error('[ReportingController] Error in getEmissionIntensity:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Get goal progress
 * GET /api/reports/goal-progress
 */
async function getGoalProgress(req, res) {
  try {
    const companyId = req.user.companyId;
    const { baselineYear } = req.query;
    
    if (!baselineYear) {
      return res.status(400).json({ success: false, error: 'baselineYear is required' });
    }
    
    const progress = await reportingService.getGoalProgress(companyId, parseInt(baselineYear));
    
    res.json({ success: true, progress });
  } catch (error) {
    console.error('[ReportingController] Error in getGoalProgress:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export {
  getEmissionsTrends,
  getScopeBreakdown,
  comparePeriods,
  getEmissionIntensity,
  getGoalProgress
};
