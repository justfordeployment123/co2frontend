/**
 * ========================================================================
 * DASHBOARD ROUTES
 * ========================================================================
 * 
 * API routes for dashboard and analytics
 */

import express from 'express';
import * as dashboardController from '../controllers/dashboardController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// All dashboard routes require authentication
router.use(authMiddleware);

/**
 * Get company KPIs
 * GET /api/dashboard/kpis/:companyId
 * Query params: periodId (optional)
 */
router.get('/kpis/:companyId', dashboardController.getKPIs);

/**
 * Get emissions intensity metrics
 * POST /api/dashboard/intensity/:companyId/:periodId
 * Body: { revenue, employees, squareMeters, productionUnits }
 */
router.post('/intensity/:companyId/:periodId', dashboardController.getEmissionsIntensity);

/**
 * Generate alerts for a company
 * POST /api/dashboard/alerts/:companyId
 * Body: { highEmissionThreshold, monthlyIncreaseThreshold, scope1Threshold, scope2Threshold }
 */
router.post('/alerts/:companyId', dashboardController.getAlerts);

/**
 * Get benchmark comparison
 * GET /api/dashboard/benchmark/:companyId/:periodId
 * Query params: industry (required)
 */
router.get('/benchmark/:companyId/:periodId', dashboardController.getBenchmark);

/**
 * Get target progress
 * POST /api/dashboard/target-progress/:companyId
 * Body: { baselineYear, targetYear, reductionPercent, baselinePeriodId }
 */
router.post('/target-progress/:companyId', dashboardController.getTargetProgress);

export default router;
