/**
 * Payments Gateway Routes
 * Namespace: /api/payments
 * Additive only — existing /api/loan-collections/payments untouched.
 */

const express = require('express');
const router  = express.Router();
const { verifyToken }                       = require('../middleware/authMiddleware');
const { initiatePayment, handleWebhook }    = require('../services/paymentGatewayService');
const constants                             = require('../config/constants');

// ── Initiate payment (authenticated) ─────────────────────────────────────────

/**
 * POST /api/payments/initiate
 * Body: { loanId, customerId, amount, currency?, idempotencyKey, metadata? }
 */
router.post('/initiate', verifyToken, async (req, res) => {
  try {
    const { loanId, customerId, amount, currency, idempotencyKey, metadata } = req.body;
    if (!loanId || !customerId || !amount || !idempotencyKey) {
      return res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false, message: 'loanId, customerId, amount, idempotencyKey are required',
      });
    }
    const result = await initiatePayment({
      userId: req.userId, loanId, customerId, amount, currency, idempotencyKey, metadata,
    });
    res.status(constants.STATUS_CODES.CREATED).json({ success: true, data: result });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── Webhook (no auth — verified by signature) ─────────────────────────────────

/**
 * POST /api/payments/webhook
 * Provider posts here; signature in X-Razorpay-Signature or Stripe-Signature header.
 * IMPORTANT: raw body must be preserved for HMAC — mounted with express.raw() below.
 */
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      const signature = req.headers['x-razorpay-signature']
                     || req.headers['stripe-signature']
                     || '';
      const rawBody   = req.body;                      // Buffer from express.raw
      const payload   = JSON.parse(rawBody.toString());

      const result = await handleWebhook(rawBody, signature, payload);
      res.json({ success: true, ...result });
    } catch (e) {
      console.error('Webhook error:', e.message);
      // Always 200 to provider to avoid retries on validation errors
      res.status(200).json({ success: false, message: e.message });
    }
  }
);

module.exports = router;
