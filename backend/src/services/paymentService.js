/**
 * ========================================================================
 * PAYMENT SERVICE - Stripe Integration
 * ========================================================================
 * 
 * Handles pay-per-report payment flow:
 * 1. Create Stripe checkout session
 * 2. Process webhook events
 * 3. Verify payment before report generation
 * 4. Track payment history
 */

import Stripe from 'stripe';
import pool from '../utils/db.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const REPORT_PRICE_CENTS = parseInt(process.env.REPORT_PRICE_CENTS || '4900'); // Default: €49.00
const CURRENCY = process.env.CURRENCY || 'EUR';

/**
 * Create Stripe checkout session for report payment
 * @param {string} companyId - Company ID
 * @param {string} reportingPeriodId - Reporting period ID
 * @param {object} metadata - Additional metadata
 * @returns {Promise<object>} Checkout session with URL
 */
export async function createCheckoutSession(companyId, reportingPeriodId, metadata = {}) {
  try {
    // Get company details
    const companyQuery = await pool.query(
      'SELECT id, name, billing_email, stripe_customer_id FROM companies WHERE id = $1',
      [companyId]
    );

    if (companyQuery.rows.length === 0) {
      throw new Error('Company not found');
    }

    const company = companyQuery.rows[0];

    // Get or create Stripe customer
    let customerId = company.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: company.billing_email,
        name: company.name,
        metadata: {
          company_id: companyId
        }
      });
      customerId = customer.id;

      // Update company with Stripe customer ID
      await pool.query(
        'UPDATE companies SET stripe_customer_id = $1, updated_at = NOW() WHERE id = $2',
        [customerId, companyId]
      );
    }

    // Get reporting period details
    const periodQuery = await pool.query(
      'SELECT period_label FROM reporting_periods WHERE id = $1',
      [reportingPeriodId]
    );

    if (periodQuery.rows.length === 0) {
      throw new Error('Reporting period not found');
    }

    const period = periodQuery.rows[0];

    // Create payment intent record
    const paymentQuery = await pool.query(
      `INSERT INTO payments 
       (company_id, reporting_period_id, amount_cents, currency, status, description, metadata)
       VALUES ($1, $2, $3, $4, 'pending', $5, $6)
       RETURNING id`,
      [
        companyId,
        reportingPeriodId,
        REPORT_PRICE_CENTS,
        CURRENCY,
        `GHG Emissions Report - ${period.period_label}`,
        JSON.stringify(metadata)
      ]
    );

    const paymentId = paymentQuery.rows[0].id;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: CURRENCY.toLowerCase(),
            product_data: {
              name: 'GHG Emissions Report',
              description: `Carbon footprint analysis for ${period.period_label}`,
            },
            unit_amount: REPORT_PRICE_CENTS,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/reports/${reportingPeriodId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/reports/${reportingPeriodId}/payment`,
      metadata: {
        company_id: companyId,
        reporting_period_id: reportingPeriodId,
        payment_id: paymentId
      }
    });

    return {
      sessionId: session.id,
      sessionUrl: session.url,
      paymentId,
      amount: REPORT_PRICE_CENTS,
      currency: CURRENCY
    };

  } catch (error) {
    console.error('[PaymentService] Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Process Stripe webhook event
 * @param {object} event - Stripe event object
 * @param {string} signature - Stripe signature header
 * @returns {Promise<void>}
 */
export async function processWebhookEvent(rawBody, signature) {
  try {
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // Log webhook event
    await pool.query(
      `INSERT INTO stripe_webhook_events 
       (stripe_event_id, event_type, event_data, created_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (stripe_event_id) DO NOTHING`,
      [event.id, event.type, JSON.stringify(event.data)]
    );

    // Handle specific event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object);
        break;

      case 'charge.refunded':
        await handleRefund(event.data.object);
        break;

      default:
        console.log(`[PaymentService] Unhandled event type: ${event.type}`);
    }

    // Mark event as processed
    await pool.query(
      `UPDATE stripe_webhook_events 
       SET processed = true, processed_at = NOW() 
       WHERE stripe_event_id = $1`,
      [event.id]
    );

    return { received: true };

  } catch (error) {
    console.error('[PaymentService] Webhook processing error:', error);

    // Log error
    if (error.message.includes('stripe_event_id')) {
      await pool.query(
        `UPDATE stripe_webhook_events 
         SET processing_error = $1 
         WHERE stripe_event_id = $2`,
        [error.message, event?.id]
      );
    }

    throw error;
  }
}

/**
 * Handle successful checkout completion
 */
async function handleCheckoutComplete(session) {
  const { payment_id, reporting_period_id } = session.metadata;

  await pool.query(
    `UPDATE payments 
     SET stripe_payment_intent_id = $1, status = 'succeeded', paid_at = NOW(), updated_at = NOW()
     WHERE id = $2`,
    [session.payment_intent, payment_id]
  );

  // Log payment history
  await pool.query(
    `INSERT INTO payment_history (payment_id, previous_status, new_status, notes)
     VALUES ($1, 'pending', 'succeeded', 'Payment completed via Stripe checkout')`,
    [payment_id]
  );

  console.log(`[PaymentService] Payment succeeded for period ${reporting_period_id}`);
}

/**
 * Handle successful payment intent
 */
async function handlePaymentSuccess(paymentIntent) {
  const paymentId = paymentIntent.metadata?.payment_id;

  if (paymentId) {
    await pool.query(
      `UPDATE payments 
       SET stripe_charge_id = $1, status = 'succeeded', paid_at = NOW(), updated_at = NOW()
       WHERE id = $2`,
      [paymentIntent.charges.data[0]?.id, paymentId]
    );

    await pool.query(
      `INSERT INTO payment_history (payment_id, previous_status, new_status, notes)
       VALUES ($1, 'pending', 'succeeded', 'Payment intent succeeded')`,
      [paymentId]
    );
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailure(paymentIntent) {
  const paymentId = paymentIntent.metadata?.payment_id;

  if (paymentId) {
    await pool.query(
      `UPDATE payments 
       SET status = 'failed', failed_at = NOW(), failure_reason = $1, updated_at = NOW()
       WHERE id = $2`,
      [paymentIntent.last_payment_error?.message || 'Payment failed', paymentId]
    );

    await pool.query(
      `INSERT INTO payment_history (payment_id, previous_status, new_status, notes)
       VALUES ($1, 'pending', 'failed', $2)`,
      [paymentId, paymentIntent.last_payment_error?.message]
    );
  }
}

/**
 * Handle refund
 */
async function handleRefund(charge) {
  await pool.query(
    `UPDATE payments 
     SET status = 'refunded', refunded_at = NOW(), 
         refund_amount_cents = $1, updated_at = NOW()
     WHERE stripe_charge_id = $2`,
    [charge.amount_refunded, charge.id]
  );

  const paymentQuery = await pool.query(
    'SELECT id FROM payments WHERE stripe_charge_id = $1',
    [charge.id]
  );

  if (paymentQuery.rows.length > 0) {
    await pool.query(
      `INSERT INTO payment_history (payment_id, previous_status, new_status, notes)
       VALUES ($1, 'succeeded', 'refunded', 'Charge refunded')`,
      [paymentQuery.rows[0].id]
    );
  }
}

/**
 * Verify payment status for a reporting period
 * @param {string} reportingPeriodId - Reporting period ID
 * @returns {Promise<object>} Payment status
 */
export async function verifyPaymentStatus(reportingPeriodId) {
  const query = await pool.query(
    `SELECT id, status, paid_at, amount_cents, currency
     FROM payments
     WHERE reporting_period_id = $1 AND status = 'succeeded'
     ORDER BY paid_at DESC
     LIMIT 1`,
    [reportingPeriodId]
  );

  if (query.rows.length === 0) {
    return { paid: false, payment: null };
  }

  return { paid: true, payment: query.rows[0] };
}

/**
 * Get payment history for a company
 * @param {string} companyId - Company ID
 * @returns {Promise<Array>} Payment history
 */
export async function getPaymentHistory(companyId) {
  const query = await pool.query(
    `SELECT p.id, p.reporting_period_id, p.amount_cents, p.currency, 
            p.status, p.description, p.paid_at, p.created_at,
            rp.period_label
     FROM payments p
     LEFT JOIN reporting_periods rp ON p.reporting_period_id = rp.id
     WHERE p.company_id = $1
     ORDER BY p.created_at DESC`,
    [companyId]
  );

  return query.rows;
}

/**
 * Create refund for a payment
 * @param {string} paymentId - Payment ID
 * @param {string} reason - Refund reason
 * @returns {Promise<object>} Refund result
 */
export async function createRefund(paymentId, reason = 'requested_by_customer') {
  try {
    // Get payment details
    const paymentQuery = await pool.query(
      'SELECT stripe_charge_id, amount_cents FROM payments WHERE id = $1',
      [paymentId]
    );

    if (paymentQuery.rows.length === 0) {
      throw new Error('Payment not found');
    }

    const payment = paymentQuery.rows[0];

    if (!payment.stripe_charge_id) {
      throw new Error('No Stripe charge ID found');
    }

    // Create refund in Stripe
    const refund = await stripe.refunds.create({
      charge: payment.stripe_charge_id,
      reason: reason
    });

    // Update payment record
    await pool.query(
      `UPDATE payments 
       SET status = 'refunded', refunded_at = NOW(), refund_reason = $1, updated_at = NOW()
       WHERE id = $2`,
      [reason, paymentId]
    );

    // Log in history
    await pool.query(
      `INSERT INTO payment_history (payment_id, previous_status, new_status, notes)
       VALUES ($1, 'succeeded', 'refunded', $2)`,
      [paymentId, `Refund created: ${reason}`]
    );

    return { success: true, refund };

  } catch (error) {
    console.error('[PaymentService] Error creating refund:', error);
    throw error;
  }
}

export default {
  createCheckoutSession,
  processWebhookEvent,
  verifyPaymentStatus,
  getPaymentHistory,
  createRefund
};
