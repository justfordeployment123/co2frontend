// ========================================================================
// BOUNDARY QUESTIONS ROUTES
// Scope determination (Scope 1, 2, 3 boundaries)
// ========================================================================

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';
import {
  createOrUpdateBoundaryQuestions,
  getBoundaryQuestions,
  getBoundarySummary,
  getEnabledActivityTypes,
  getAllBoundaryQuestions,
  submitBoundaryAnswers,
  getUserBoundaryAnswers,
  checkOnboardingStatus,
  getCompanyBoundaryAnswers,
  saveCompanyBoundaryAnswers
} from '../controllers/boundaryController.js';

const router = Router({ mergeParams: true });

// Middleware: Require authentication
router.use(authMiddleware);

// Company boundary settings (organizational scope)
router.get('/company-answers', getCompanyBoundaryAnswers);
router.post('/company-answers', saveCompanyBoundaryAnswers);

// Note: requireRole is NOT applied globally because some routes (like onboarding-status)
// do not have :companyId in the URL. Apply requireRole per-route where needed.

/**
 * GET /api/boundaries/questions
 * Get all available boundary questions for onboarding wizard
 */
router.get('/questions', getAllBoundaryQuestions);

/**
 * POST /api/boundaries/answers
 * Submit user's boundary question answers
 * Body: { companyId, answers: [ { boundary_question_id, answer } ] }
 */
router.post('/answers', submitBoundaryAnswers);

/**
 * GET /api/boundaries/answers/:userId
 * Get user's boundary answers
 */
router.get('/answers/:userId', getUserBoundaryAnswers);

/**
 * GET /api/boundaries/onboarding-status
 * Check if user has completed onboarding
 */
router.get('/onboarding-status', checkOnboardingStatus);

/**
 * POST /api/companies/:companyId/reporting-periods/:periodId/boundary-questions
 * Create or update boundary questions (EDITOR+ only)
 */
router.post(
  '/boundary-questions',
  requireRole(['editor', 'company_admin', 'internal_admin']),
  createOrUpdateBoundaryQuestions
);

/**
 * GET /api/companies/:companyId/reporting-periods/:periodId/boundary-questions
 * Get boundary questions
 */
router.get(
  '/boundary-questions', 
  requireRole(['viewer', 'editor', 'company_admin', 'internal_admin']),
  getBoundaryQuestions
);

/**
 * GET /api/companies/:companyId/reporting-periods/:periodId/boundary-summary
 * Get summary of enabled scopes/modules
 */
router.get(
  '/boundary-summary', 
  requireRole(['viewer', 'editor', 'company_admin', 'internal_admin']), 
  getBoundarySummary
);

/**
 * GET /api/boundaries/enabled-activity-types/:companyId
 * Get list of enabled activity types based on boundary answers
 */
router.get(
  '/enabled-activity-types/:companyId',
  getEnabledActivityTypes
);

export default router;
