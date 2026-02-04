// ========================================================================
// REFERENCE DATA ROUTES
// Provides dropdown lists and reference data for activities
// ========================================================================

import { Router } from 'express';
import {
  getActivityTypesReference,
  getDropdownsReference,
  getDropdownByName,
  getBoundaryQuestionsReference,
} from '../controllers/referenceController.js';

const router = Router();

/**
 * GET /api/reference/activity-types
 * Get all activity types
 */
router.get('/activity-types', getActivityTypesReference);

/**
 * GET /api/reference/dropdowns
 * Get all dropdowns
 */
router.get('/dropdowns', getDropdownsReference);

/**
 * GET /api/reference/boundary-questions
 * Get all boundary questions
 */
router.get('/boundary-questions', getBoundaryQuestionsReference);

/**
 * GET /api/reference/dropdowns/:name
 * Get specific dropdown
 */
router.get('/dropdowns/:name', getDropdownByName);

export default router;
