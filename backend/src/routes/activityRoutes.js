// ========================================================================
// ACTIVITY ROUTES
// POST/GET/PUT/DELETE for all 11 activity types
// ========================================================================

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';
import {
  createActivity,
  getActivity,
  listActivities,
  updateActivity,
  deleteActivity,
  listAllActivitiesByPeriod,
  getActivityCountsByPeriod,
} from '../controllers/activityController.js';

const router = Router({ mergeParams: true });

// Middleware: Require at least VIEWER role
router.use(authMiddleware);
router.use(requireRole(['viewer', 'editor', 'company_admin', 'internal_admin']));

/**
 * POST /api/companies/:companyId/activities/:activityType
 * Create activity (EDITOR+ only)
 */
router.post('/:activityType', requireRole(['editor', 'company_admin', 'internal_admin']), createActivity);

/**
 * GET /api/companies/:companyId/activities/:activityType
 * List activities by type
 */
router.get('/:activityType', listActivities);

/**
 * GET /api/companies/:companyId/activities/:activityType/:id
 * Get specific activity
 */
router.get('/:activityType/:id', getActivity);

/**
 * PUT /api/companies/:companyId/activities/:activityType/:id
 * Update activity (EDITOR+ only)
 */
router.put(
  '/:activityType/:id',
  requireRole(['editor', 'company_admin', 'internal_admin']),
  updateActivity
);

/**
 * DELETE /api/companies/:companyId/activities/:activityType/:id
 * Delete activity (EDITOR+ only)
 */
router.delete(
  '/:activityType/:id',
  requireRole(['editor', 'company_admin', 'internal_admin']),
  deleteActivity
);

/**
 * GET /api/companies/:companyId/reporting-periods/:periodId/activities/counts
 * Get count of activities per type
 */
router.get('/counts', getActivityCountsByPeriod);

/**
 * GET /api/companies/:companyId/reporting-periods/:periodId/activities/all
 * List all activities across all types
 */
router.get('/all', listAllActivitiesByPeriod);

export default router;
