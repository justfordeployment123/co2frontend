/**
 * ========================================================================
 * CALCULATION ROUTES
 * ========================================================================
 * 
 * API endpoints for the calculation engine
 */

import express from 'express';
import * as calculationController from '../controllers/calculationController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

// ========================================================================
// CALCULATION ENDPOINTS (Protected - require authentication)
// ========================================================================

/**
 * Calculate emissions for different activity types
 */
router.post(
  '/calculate/stationary-combustion',
  authMiddleware,
  requireRole(['editor', 'company_admin']),
  calculationController.calculateStationaryCombustion
);

router.post(
  '/calculate/mobile-sources',
  authMiddleware,
  requireRole(['editor', 'company_admin']),
  calculationController.calculateMobileSources
);

router.post(
  '/calculate/refrigeration-ac',
  authMiddleware,
  requireRole(['editor', 'company_admin']),
  calculationController.calculateRefrigerationAC
);

router.post(
  '/calculate/electricity',
  authMiddleware,
  requireRole(['editor', 'company_admin']),
  calculationController.calculateElectricity
);

router.post(
  '/calculate/steam',
  authMiddleware,
  requireRole(['editor', 'company_admin']),
  calculationController.calculateSteam
);

router.post(
  '/calculate/waste',
  authMiddleware,
  requireRole(['editor', 'company_admin']),
  calculationController.calculateWaste
);

router.post(
  '/calculate/purchased-gases',
  authMiddleware,
  requireRole(['editor', 'company_admin']),
  calculationController.calculatePurchasedGases
);

router.post(
  '/calculate/business-travel',
  authMiddleware,
  requireRole(['editor', 'company_admin']),
  calculationController.calculateBusinessTravel
);

router.post(
  '/calculate/hotel',
  authMiddleware,
  requireRole(['editor', 'company_admin']),
  calculationController.calculateHotel
);

router.post(
  '/calculate/commuting',
  authMiddleware,
  requireRole(['editor', 'company_admin']),
  calculationController.calculateCommuting
);

router.post(
  '/calculate/transportation',
  authMiddleware,
  requireRole(['editor', 'company_admin']),
  calculationController.calculateTransportation
);

// ========================================================================
// RETRIEVE CALCULATIONS (Protected - require authentication)
// ========================================================================

/**
 * Get calculations by reporting period
 * Query params: latestOnly=true/false, activityType=<type>
 */
router.get(
  '/reporting-period/:reportingPeriodId',
  authMiddleware,
  calculationController.getCalculationsByPeriod
);

/**
 * Get calculation by ID
 */
router.get(
  '/:id',
  authMiddleware,
  calculationController.getCalculationById
);

/**
 * Get calculation history for an activity
 * Query params: limit=<number>
 */
router.get(
  '/activity/:activityId/history',
  authMiddleware,
  calculationController.getCalculationHistory
);

/**
 * Get aggregated calculations for a reporting period
 */
router.get(
  '/reporting-period/:reportingPeriodId/aggregate',
  authMiddleware,
  calculationController.getAggregatedCalculations
);

/**
 * Compare two calculations
 */
router.get(
  '/compare/:id1/:id2',
  authMiddleware,
  calculationController.compareCalculations
);

/**
 * Get calculation statistics for a reporting period
 */
router.get(
  '/reporting-period/:reportingPeriodId/stats',
  authMiddleware,
  calculationController.getCalculationStats
);

// ========================================================================
// EMISSION FACTOR UTILITIES (Protected - require authentication)
// ========================================================================

/**
 * Get available fuel types for stationary combustion
 * Query params: standard=<GHG_PROTOCOL|CSRD|ISO_14064>
 */
router.get(
  '/fuel-types',
  authMiddleware,
  calculationController.getAvailableFuelTypes
);

/**
 * Get available vehicle types for mobile sources
 * Query params: standard=<GHG_PROTOCOL|CSRD|ISO_14064>
 */
router.get(
  '/vehicle-types',
  authMiddleware,
  calculationController.getAvailableVehicleTypes
);

// ========================================================================
// CACHE MANAGEMENT (Admin only)
// ========================================================================

/**
 * Clear emission factor cache
 */
router.delete(
  '/cache',
  authMiddleware,
  requireRole(['internal_admin']),
  calculationController.clearFactorCache
);

/**
 * Get cache statistics
 */
router.get(
  '/cache/stats',
  authMiddleware,
  requireRole(['internal_admin']),
  calculationController.getCacheStats
);

export default router;
