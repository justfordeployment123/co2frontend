/**
 * ========================================================================
 * REPORTING ROUTES
 * ========================================================================
 * 
 * Advanced reporting and analytics endpoints
 */

import express from 'express';
import * as reportingController from '../controllers/reportingController.js';
import * as reportHistoryController from '../controllers/reportHistoryController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All reporting endpoints require authentication
router.use(authMiddleware);

/**
 * Get emissions trends across multiple periods
 * GET /api/reports/trends
 * Query params: startDate, endDate, groupBy, activityType
 */
router.get(
  '/trends',
  reportingController.getEmissionsTrends
);

/**
 * Get detailed scope breakdown for a period
 * GET /api/reports/scope-breakdown/:periodId
 */
router.get(
  '/scope-breakdown/:periodId',
  reportingController.getScopeBreakdown
);

/**
 * Compare two reporting periods
 * GET /api/reports/compare/:periodId1/:periodId2
 */
router.get(
  '/compare/:periodId1/:periodId2',
  reportingController.comparePeriods
);

/**
 * Get emission intensity metrics
 * POST /api/reports/intensity/:periodId
 * Body: { revenue, employees, floorArea, production, currency, productionUnit }
 */
router.post(
  '/intensity/:periodId',
  reportingController.getEmissionIntensity
);

/**
 * Get goal tracking progress
 * GET /api/reports/goal-progress
 * Query params: baselineYear
 */
router.get(
  '/goal-progress',
  reportingController.getGoalProgress
);

/**
 * Get report details by ID
 * GET /api/reports/:reportId
 */
router.get(
  '/:reportId',
  reportHistoryController.getReportById
);

/**
 * Delete a report
 * DELETE /api/reports/:reportId
 */
router.delete(
  '/:reportId',
  reportHistoryController.deleteReport
);

export default router;
