/**
 * Product Config Routes
 * Namespace: /api/product-configs
 * All routes are additive — no existing routes modified.
 */

const express = require('express');
const router  = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const productConfigRepo = require('../repositories/ProductConfigRepository');
const { calculate }     = require('../services/calcService');
const { getLedger }     = require('../services/ledgerService');
const constants         = require('../config/constants');

router.use(verifyToken);

// ── Helper ───────────────────────────────────────────────────────────────────
const notFound = (res) => res.status(constants.STATUS_CODES.NOT_FOUND).json({ success: false, message: 'Product config not found' });

// ── CRUD ─────────────────────────────────────────────────────────────────────

/** GET /api/product-configs */
router.get('/', async (req, res) => {
  try {
    const configs = await productConfigRepo.getAll(req.userId);
    res.json({ success: true, data: configs });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/** GET /api/product-configs/:id */
router.get('/:id', async (req, res) => {
  try {
    const config = await productConfigRepo.getById(req.userId, req.params.id);
    if (!config) return notFound(res);
    res.set('ETag', `"${config.etag}"`);
    res.json({ success: true, data: config });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/** POST /api/product-configs */
router.post('/', async (req, res) => {
  try {
    const { name, json_schema } = req.body;
    if (!name || !json_schema) {
      return res.status(400).json({ success: false, message: 'name and json_schema are required' });
    }

    // Feature flag gate
    const flagEnabled = await productConfigRepo.getFeatureFlag(req.userId, 'product_configs_enabled');
    if (!flagEnabled && process.env.NODE_ENV === 'production') {
      return res.status(403).json({ success: false, message: 'product_configs feature not enabled for this user' });
    }

    const config = await productConfigRepo.create(req.userId, { name, json_schema });
    res.status(constants.STATUS_CODES.CREATED).json({ success: true, data: config });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/** PUT /api/product-configs/:id */
router.put('/:id', async (req, res) => {
  try {
    const { name, json_schema } = req.body;
    const updated = await productConfigRepo.update(req.userId, req.params.id, { name, json_schema });
    if (!updated) return notFound(res);
    res.json({ success: true, data: updated });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/** DELETE /api/product-configs/:id */
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await productConfigRepo.delete(req.userId, req.params.id);
    if (!deleted) return notFound(res);
    res.json({ success: true, message: 'Product config deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── Approval / rollback ───────────────────────────────────────────────────────

/** POST /api/product-configs/:id/approve */
router.post('/:id/approve', async (req, res) => {
  try {
    const ok = await productConfigRepo.approve(req.userId, req.params.id);
    if (!ok) return notFound(res);
    res.json({ success: true, message: 'Config approved and set to active' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/** POST /api/product-configs/:id/archive  (rollback = archive current, restore previous) */
router.post('/:id/archive', async (req, res) => {
  try {
    const ok = await productConfigRepo.archive(req.userId, req.params.id);
    if (!ok) return notFound(res);
    res.json({ success: true, message: 'Config archived' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── Calculation endpoint ─────────────────────────────────────────────────────

/**
 * POST /api/product-configs/:id/calc
 * Body: { principal, startDate, noOfInstalls, ... }
 * Returns amortization schedule + summary totals.
 */
router.post('/:id/calc', async (req, res) => {
  try {
    const config = await productConfigRepo.getById(req.userId, req.params.id);
    if (!config) return notFound(res);
    if (config.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Only active configs can be used for calculation' });
    }
    const result = calculate(config.jsonSchema, req.body);
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

// ── Ledger read ───────────────────────────────────────────────────────────────

/** GET /api/product-configs/ledger?refType=payment&refId=xxx&account=cash */
router.get('/ledger/entries', async (req, res) => {
  try {
    const { refType, refId, account } = req.query;
    const entries = await getLedger(req.userId, { refType, refId, account });
    res.json({ success: true, data: entries });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
