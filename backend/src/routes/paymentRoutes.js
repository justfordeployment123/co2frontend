/**
 * ========================================================================
 * PAYMENT ROUTES
 * ========================================================================
 * 
 * Stripe payment and monetization endpoints
 */

import { Router } from 'express';
import * as paymentController from '../controllers/paymentController.js';
import { authMiddleware } from '../middleware/auth.js';
import pool from '../utils/db.js';

const router = Router();

// Middleware to attach database connection
router.use((req, res, next) => {
  req.db = pool;
  next();
});

/**
 * POST /api/payments/create-checkout-session
 * Create Stripe checkout session for report payment
 * Requires authentication
 */
router.post('/create-checkout-session', authMiddleware, paymentController.createCheckoutSession);

/**
 * POST /api/payments/webhook
 * Stripe webhook endpoint (no authentication required)
 * IMPORTANT: Must use raw body for signature verification
 */
router.post('/webhook', paymentController.handleWebhook);

/**
 * GET /api/payments/verify/:reportingPeriodId
 * Verify payment status for a reporting period
 * Requires authentication
 */
router.get('/verify/:reportingPeriodId', authMiddleware, paymentController.verifyPayment);

/**
 * GET /api/payments/history
 * Get payment history for authenticated user's company
 * Requires authentication
 */
router.get('/history', authMiddleware, paymentController.getPaymentHistory);

/**
 * GET /api/payments/:paymentId
 * Get payment details by ID
 * Requires authentication
 */
router.get('/:paymentId', authMiddleware, paymentController.getPaymentDetails);

/**
 * POST /api/payments/:paymentId/refund
 * Create refund for a payment (internal admin only)
 * Requires authentication + internal admin role
 */
router.post('/:paymentId/refund', authMiddleware, paymentController.createRefund);

export default router;
