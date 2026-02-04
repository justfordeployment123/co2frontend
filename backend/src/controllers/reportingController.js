/**
 * ========================================================================
 * REPORTING CONTROLLER
 * ========================================================================
 * 
 * Advanced reporting endpoints
 */

import * as reportingService from '../services/reportingService.js';
import pool from '../utils/db.js';

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
    res.status(500).json({ success: false, error: 'Unable to generate emissions trends report. Please try again.' });
  }
}

/**
 * Get scope breakdown
 * GET /api/reports/scope-breakdown/:periodId
 */
async function getScopeBreakdown(req, res) {
  try {
    const { periodId } = req.params;
    
    // Handle "current" keyword to get the current reporting period
    let actualPeriodId = periodId;
    if (periodId === 'current') {
      // 1. Try to find active period
      let result = await pool.query(`
        SELECT id FROM reporting_periods 
        WHERE company_id = $1 
        AND status = 'active' 
        ORDER BY period_start_date DESC 
        LIMIT 1
      `, [req.user.company_id]);

      // 2. Fallback to any latest period
      if (result.rows.length === 0) {
        result = await pool.query(`
          SELECT id FROM reporting_periods 
          WHERE company_id = $1 
          ORDER BY period_start_date DESC 
          LIMIT 1
        `, [req.user.company_id]);
      }

      if (result.rows.length === 0) {
        // No periods exist at all - return empty structure
        return res.json({ 
          success: true, 
          breakdown: {
            scope1: { total: 0, breakdown: {} },
            scope2: { total: 0, breakdown: {} },
            scope3: { total: 0, breakdown: {} },
            total: 0
          }
        });
      }
      actualPeriodId = result.rows[0].id;
    }
    
    // Check if UUID is valid to prevent PostgreSQL error
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(actualPeriodId)) {
       return res.status(400).json({ success: false, error: 'Invalid period ID' });
    }
    
    const breakdown = await reportingService.getScopeBreakdown(actualPeriodId);
    
    res.json({ success: true, breakdown });
  } catch (error) {
    console.error('[ReportingController] Error in getScopeBreakdown:', error);
    res.status(500).json({ success: false, error: 'Unable to generate scope breakdown report. Please try again.' });
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
    res.status(500).json({ success: false, error: 'Unable to compare periods. Please try again.' });
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
    res.status(500).json({ success: false, error: 'Unable to calculate emission intensity. Please try again.' });
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
    res.status(500).json({ success: false, error: 'Unable to retrieve goal progress. Please try again.' });
  }
}

export {
  getEmissionsTrends,
  getScopeBreakdown,
  comparePeriods,
  getEmissionIntensity,
  getGoalProgress
};
