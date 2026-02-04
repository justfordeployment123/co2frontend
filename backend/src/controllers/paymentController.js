/**
 * ========================================================================
 * PAYMENT CONTROLLER
 * ========================================================================
 * 
 * HTTP handlers for Stripe payment endpoints
 */

import * as paymentService from '../services/paymentService.js';

/**
 * Create Stripe checkout session
 * POST /api/payments/create-checkout-session
 * Body: { reportingPeriodId, metadata }
 */
export async function createCheckoutSession(req, res) {
  try {
    const { reportingPeriodId, metadata } = req.body;
    // Verify user has access to this reporting period
    const { rows } = await req.db.query(
      'SELECT id, company_id FROM reporting_periods WHERE id = $1',
      [reportingPeriodId]
    );

    if (rows.length === 0) {
       return res.status(404).json({
         success: false,
         error: 'Reporting period not found'
       });
    }
    
    const reportingPeriod = rows[0];
    const rpCompanyId = reportingPeriod.company_id;

    const hasAccess = req.user.roles && req.user.roles.some(r => 
      r.company_id === rpCompanyId || r.companyId === rpCompanyId || r.role === 'internal_admin'
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const result = await paymentService.createCheckoutSession(
      rpCompanyId,
      reportingPeriodId,
      metadata
    );

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('[PaymentController] Error creating checkout session:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create checkout session'
    });
  }
}

/**
 * Handle Stripe webhook events
 * POST /api/payments/webhook
 * Headers: stripe-signature
 */
export async function handleWebhook(req, res) {
  try {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing stripe-signature header'
      });
    }

    // Process webhook with raw body
    await paymentService.processWebhookEvent(req.rawBody, signature);

    res.json({ received: true });

  } catch (error) {
    console.error('[PaymentController] Webhook error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Webhook processing failed'
    });
  }
}

/**
 * Verify payment status for a reporting period
 * GET /api/payments/verify/:reportingPeriodId
 */
export async function verifyPayment(req, res) {
  try {
    const { reportingPeriodId } = req.params;
    // Verify user has access to this reporting period
    const { rows } = await req.db.query(
      'SELECT id, company_id FROM reporting_periods WHERE id = $1',
      [reportingPeriodId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Reporting period not found'
      });
    }

    const reportingPeriod = rows[0];
    const rpCompanyId = reportingPeriod.company_id;

    const hasAccess = req.user.roles && req.user.roles.some(r => 
      r.company_id === rpCompanyId || r.companyId === rpCompanyId || r.role === 'internal_admin'
    );

    if (!hasAccess) {
      return res.status(403).json({
         success: false,
         error: 'Access denied'
      });
    }

    const paymentStatus = await paymentService.verifyPaymentStatus(reportingPeriodId);

    res.json({
      success: true,
      ...paymentStatus
    });

  } catch (error) {
    console.error('[PaymentController] Error verifying payment:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify payment'
    });
  }
}

/**
 * Get payment history for company
 * GET /api/payments/history
 */
export async function getPaymentHistory(req, res) {
  try {
    const companyId = req.user.company_id;

    const history = await paymentService.getPaymentHistory(companyId);

    res.json({
      success: true,
      payments: history,
      count: history.length
    });

  } catch (error) {
    console.error('[PaymentController] Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch payment history'
    });
  }
}

/**
 * Create refund (internal admin only)
 * POST /api/payments/:paymentId/refund
 * Body: { reason }
 */
export async function createRefund(req, res) {
  try {
    const { paymentId } = req.params;
    const { reason } = req.body;

    // Only internal admins can create refunds
    if (req.user.role !== 'internal_admin') {
      return res.status(403).json({
        success: false,
        error: 'Only internal admins can create refunds'
      });
    }

    const result = await paymentService.createRefund(paymentId, reason);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('[PaymentController] Error creating refund:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create refund'
    });
  }
}

/**
 * Get payment details by ID
 * GET /api/payments/:paymentId
 */
export async function getPaymentDetails(req, res) {
  try {
    const { paymentId } = req.params;
    const companyId = req.user.company_id;

    const query = await req.db.query(
      `SELECT p.*, rp.period_label
       FROM payments p
       LEFT JOIN reporting_periods rp ON p.reporting_period_id = rp.id
       WHERE p.id = $1 AND p.company_id = $2`,
      [paymentId, companyId]
    );

    if (query.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    // Get payment history
    const historyQuery = await req.db.query(
      `SELECT * FROM payment_history WHERE payment_id = $1 ORDER BY created_at DESC`,
      [paymentId]
    );

    res.json({
      success: true,
      payment: query.rows[0],
      history: historyQuery.rows
    });

  } catch (error) {
    console.error('[PaymentController] Error fetching payment details:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch payment details'
    });
  }
}

export default {
  createCheckoutSession,
  handleWebhook,
  verifyPayment,
  getPaymentHistory,
  createRefund,
  getPaymentDetails
};
