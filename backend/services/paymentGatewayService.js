/**
 * Payment Gateway Service
 * Scaffold for payment initiation and webhook verification.
 *
 * Recommended providers by region:
 *   India        → Razorpay  (first implementation — widely adopted, easy sandbox)
 *   Africa       → Paystack / Flutterwave
 *   Global       → Stripe
 *   South Asia   → Razorpay / Stripe
 *
 * First implementation: Razorpay (provider = 'razorpay')
 * Set PAYMENT_PROVIDER=razorpay in .env to activate.
 */

const crypto = require('crypto');
const pool   = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { recordPaymentLedger } = require('./ledgerService');
const loanRepo = require('../repositories/LoanCollectionRepository');

// ── Provider adapters ────────────────────────────────────────────────────────

const providers = {
  razorpay: {
    async initiateOrder({ amount, currency, receipt, notes }) {
      // Lazily require so server starts without razorpay SDK installed
      const Razorpay = require('razorpay');
      const rz = new Razorpay({
        key_id:     process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
      const order = await rz.orders.create({
        amount:   Math.round(amount * 100), // paise
        currency: currency || 'INR',
        receipt,
        notes,
      });
      return { providerRef: order.id, providerPayload: order };
    },

    verifyWebhookSignature(rawBody, signature) {
      const expected = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    },

    extractStatus(payload) {
      const event = payload.event;
      if (event === 'payment.captured') return 'success';
      if (event === 'payment.failed')   return 'failed';
      return 'pending';
    },
  },

  // Stripe stub — add STRIPE_SECRET_KEY to .env when activating
  stripe: {
    async initiateOrder({ amount, currency }) {
      const Stripe = require('stripe');
      const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
      const intent = await stripe.paymentIntents.create({
        amount:   Math.round(amount * 100),
        currency: (currency || 'inr').toLowerCase(),
      });
      return { providerRef: intent.id, providerPayload: intent };
    },

    verifyWebhookSignature(rawBody, signature) {
      const Stripe = require('stripe');
      const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
      // throws if invalid
      stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
      return true;
    },

    extractStatus(payload) {
      if (payload.type === 'payment_intent.succeeded') return 'success';
      if (payload.type === 'payment_intent.payment_failed') return 'failed';
      return 'pending';
    },
  },
};

function getProvider() {
  const name = process.env.PAYMENT_PROVIDER || 'razorpay';
  if (!providers[name]) throw new Error(`Unsupported payment provider: ${name}`);
  return { name, adapter: providers[name] };
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Initiate a payment order. Idempotent via idempotency_key.
 */
async function initiatePayment({ userId, loanId, customerId, amount, currency, idempotencyKey, metadata }) {
  const conn = await pool.getConnection();
  try {
    // Idempotency check
    const [existing] = await conn.execute(
      'SELECT * FROM gateway_payments WHERE idempotency_key = ?',
      [idempotencyKey]
    );
    if (existing.length) return existing[0];

    const { name, adapter } = getProvider();
    const id      = uuidv4();
    const receipt = `pocketor_${id.slice(0, 8)}`;

    const { providerRef, providerPayload } = await adapter.initiateOrder({
      amount, currency, receipt, notes: metadata,
    });

    await conn.execute(
      `INSERT INTO gateway_payments
         (id, user_id, loan_id, customer_id, idempotency_key, provider, provider_ref, amount, currency, status, metadata)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [id, userId, loanId, customerId, idempotencyKey, name, providerRef,
       amount, currency || 'INR', 'initiated', JSON.stringify(metadata || {})]
    );

    return { id, providerRef, providerPayload, status: 'initiated' };
  } finally {
    conn.release();
  }
}

/**
 * Handle inbound webhook from payment provider.
 * Verifies signature, updates payment status, writes ledger entries.
 */
async function handleWebhook(rawBody, signature, payload) {
  const { name, adapter } = getProvider();

  const verified = adapter.verifyWebhookSignature(rawBody, signature);
  if (!verified) throw new Error('Webhook signature verification failed');

  const providerRef = payload.payment?.entity?.order_id   // razorpay
                   || payload.data?.object?.id             // stripe
                   || null;
  if (!providerRef) throw new Error('Cannot extract provider_ref from webhook');

  const newStatus = adapter.extractStatus(payload);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.execute(
      'SELECT * FROM gateway_payments WHERE provider = ? AND provider_ref = ?',
      [name, providerRef]
    );
    if (!rows.length) { await conn.rollback(); return { skipped: true }; }

    const gp = rows[0];

    // Idempotency — skip if already in terminal state
    if (gp.status === 'success' || gp.status === 'failed') {
      await conn.rollback();
      return { skipped: true, reason: 'already_processed' };
    }

    await conn.execute(
      'UPDATE gateway_payments SET status=?, webhook_verified=TRUE, webhook_payload=? WHERE id=?',
      [newStatus, JSON.stringify(payload), gp.id]
    );

    if (newStatus === 'success') {
      // Record payment in existing payments table
      const paymentId = uuidv4();
      await conn.execute(
        `INSERT INTO payments (id, user_id, loan_id, customer_id, amount, payment_date, payment_type, notes)
         VALUES (?,?,?,?,?,CURDATE(),'installment','gateway payment')`,
        [paymentId, gp.user_id, gp.loan_id, gp.customer_id, gp.amount]
      );
      // Update loan balances
      await conn.execute(
        'UPDATE loans SET paid_amount = paid_amount + ?, balance_amount = balance_amount - ? WHERE id = ?',
        [gp.amount, gp.amount, gp.loan_id]
      );
      // Auto-complete loan if balance reaches zero
      await conn.execute(
        "UPDATE loans SET status = 'completed', actual_end_date = CURDATE() WHERE id = ? AND balance_amount <= 0 AND status = 'active'",
        [gp.loan_id]
      );
      // Write ledger
      await recordPaymentLedger(conn, { userId: gp.user_id, paymentId, amount: gp.amount });
    }

    await conn.commit();
    return { processed: true, status: newStatus };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { initiatePayment, handleWebhook };
