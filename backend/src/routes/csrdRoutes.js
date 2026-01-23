/**
 * ========================================================================
 * CSRD ROUTES
 * ========================================================================
 * 
 * Routes for CSRD (Corporate Sustainability Reporting Directive) compliance
 */

import express from 'express';
import * as csrdController from '../controllers/csrdController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Public routes (information about CSRD)
router.get('/requirements', csrdController.getCSRDRequirements);
router.get('/standards/comparison', csrdController.getStandardsComparison);

// Protected routes (require authentication)
router.get(
  '/reporting-periods/:reportingPeriodId/emissions',
  authMiddleware,
  csrdController.getCSRDEmissions
);

router.get(
  '/reporting-periods/:reportingPeriodId/disclosure',
  authMiddleware,
  csrdController.getCSRDDisclosure
);

router.get(
  '/reporting-periods/:reportingPeriodId/validate',
  authMiddleware,
  csrdController.validateCSRDCompliance
);

// ESRS E1-5: Energy consumption
router.get(
  '/reporting-periods/:reportingPeriodId/energy',
  authMiddleware,
  csrdController.getEnergyConsumption
);

// ESRS E1-4: Climate targets
router.get(
  '/companies/:companyId/targets',
  authMiddleware,
  csrdController.getClimateTargets
);

// ESRS E1-7: GHG removals
router.get(
  '/reporting-periods/:reportingPeriodId/removals',
  authMiddleware,
  csrdController.getGHGRemovals
);

export default router;
