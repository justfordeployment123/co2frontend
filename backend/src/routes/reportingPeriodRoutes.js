// ========================================================================
// REPORTING PERIOD ROUTES
// Manage reporting periods and their activities
// ========================================================================

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';
import {
  createReportingPeriod,
  getReportingPeriod,
  listReportingPeriods,
  updateReportingPeriod,
  deleteReportingPeriod,
} from '../controllers/reportingPeriodController.js';
import activityRoutes from './activityRoutes.js';
import boundaryRoutes from './boundaryRoutes.js';

const router = Router({ mergeParams: true });

// Middleware: Require authentication
router.use(authMiddleware);
router.use(requireRole(['viewer', 'editor', 'company_admin', 'internal_admin']));

/**
 * POST /api/companies/:companyId/reporting-periods
 * Create reporting period (EDITOR+ only)
 */
router.post(
  '/',
  requireRole(['editor', 'company_admin', 'internal_admin']),
  createReportingPeriod
);

/**
 * GET /api/companies/:companyId/reporting-periods
 * List reporting periods
 */
router.get('/', listReportingPeriods);

/**
 * GET /api/companies/:companyId/reporting-periods/:periodId
 * Get specific reporting period
 */
router.get('/:periodId', getReportingPeriod);

/**
 * PUT /api/companies/:companyId/reporting-periods/:periodId
 * Update reporting period (EDITOR+ only)
 */
router.put(
  '/:periodId',
  requireRole(['editor', 'company_admin', 'internal_admin']),
  updateReportingPeriod
);

/**
 * DELETE /api/companies/:companyId/reporting-periods/:periodId
 * Delete reporting period (EDITOR+ only)
 */
router.delete(
  '/:periodId',
  requireRole(['editor', 'company_admin', 'internal_admin']),
  deleteReportingPeriod
);

// Sub-routes
router.use('/:periodId/activities', activityRoutes);
router.use('/:periodId', boundaryRoutes);

export default router;
