/**
 * Collection Routes
 * Endpoints for collection operations (CRUD)
 */

const express = require('express');
const router = express.Router();
const CollectionRepository = require('../repositories/CollectionRepository');
const { verifyToken } = require('../middleware/authMiddleware');
const constants = require('../config/constants');

/**
 * POST /api/collections
 * Create a new collection
 */
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, description, startDate, frequency, interestRate, totalAmount } = req.body;

    // Validation
    if (!name || !startDate || !frequency || !totalAmount) {
      return res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Required fields missing (name, startDate, frequency, totalAmount)',
      });
    }

    if (totalAmount <= 0) {
      return res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Total amount must be greater than 0',
      });
    }

    // Create collection
    const collection = await CollectionRepository.create({
      userId: req.userId,
      name,
      description,
      startDate,
      frequency,
      interestRate: interestRate || 0,
      totalAmount,
    });

    res.status(constants.STATUS_CODES.CREATED).json({
      success: true,
      message: 'Collection created successfully',
      data: collection,
    });
  } catch (error) {
    console.error('Create collection error:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
      success: false,
      message: constants.MESSAGES.ERROR,
      error: error.message,
    });
  }
});

/**
 * GET /api/collections
 * Get all collections for authenticated user
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const [countResult] = await require('../config/database').query(
      'SELECT COUNT(*) as count FROM collections WHERE user_id = ?', [req.userId]
    );
    const total = countResult[0].count;

    const collections = await CollectionRepository.getByUserId(req.userId, page, limit);

    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      data: {
        data: collections.map(c => c.toJSON()),
        page,
        limit,
        total,
      },
    });
  } catch (error) {
    console.error('Get collections error:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
      success: false,
      message: constants.MESSAGES.ERROR,
    });
  }
});

/**
 * GET /api/collections/:id
 * Get collection by ID with members and contributions
 * Only returns collection if it belongs to the authenticated user
 */
router.get('/:id', verifyToken, async (req, res) => {
  try {
    // Fetch collection using both ID and userId from JWT token
    const collection = await CollectionRepository.getByIdAndUserId(
      req.params.id,
      req.userId
    );

    if (!collection) {
      return res.status(constants.STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: constants.MESSAGES.COLLECTION_NOT_FOUND,
      });
    }

    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      data: collection, // Already includes members and contributions
    });
  } catch (error) {
    console.error('Get collection error:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
      success: false,
      message: constants.MESSAGES.ERROR,
      error: error.message,
    });
  }
});

/**
 * PUT /api/collections/:id
 * Update collection
 * Only updates if collection belongs to the authenticated user
 */
router.put('/:id', verifyToken, async (req, res) => {
  try {
    // Verify collection exists and belongs to user
    const collection = await CollectionRepository.getByIdAndUserId(
      req.params.id,
      req.userId
    );

    if (!collection) {
      return res.status(constants.STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: constants.MESSAGES.COLLECTION_NOT_FOUND,
      });
    }

    // Update collection
    const updatedCollection = await CollectionRepository.update(
      req.params.id,
      req.body
    );

    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: 'Collection updated successfully',
      data: updatedCollection,
    });
  } catch (error) {
    console.error('Update collection error:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
      success: false,
      message: constants.MESSAGES.ERROR,
      error: error.message,
    });
  }
});

/**
 * DELETE /api/collections/:id
 * Delete collection
 * Only deletes if collection belongs to the authenticated user
 */
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    // Verify collection exists and belongs to user
    const collection = await CollectionRepository.getByIdAndUserId(
      req.params.id,
      req.userId
    );

    if (!collection) {
      return res.status(constants.STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: constants.MESSAGES.COLLECTION_NOT_FOUND,
      });
    }

    // Delete collection
    const deleted = await CollectionRepository.delete(req.params.id);

    if (!deleted) {
      return res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
        success: false,
        message: 'Failed to delete collection',
      });
    }

    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: 'Collection deleted successfully',
    });
  } catch (error) {
    console.error('Delete collection error:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
      success: false,
      message: constants.MESSAGES.ERROR,
      error: error.message,
    });
  }
});

/**
 * GET /api/collections/status/:status
 * Get collections by status
 */
router.get('/status/:status', verifyToken, async (req, res) => {
  try {
    const validStatuses = Object.values(constants.COLLECTION_STATUS);
    if (!validStatuses.includes(req.params.status)) {
      return res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const collections = await CollectionRepository.getByStatus(
      req.userId,
      req.params.status
    );

    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      data: collections.map(c => c.toJSON()),
    });
  } catch (error) {
    console.error('Get collections by status error:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
      success: false,
      message: constants.MESSAGES.ERROR,
      error: error.message,
    });
  }
});

// GET /api/collections/:id/members
router.get('/:id/members', verifyToken, async (req, res) => {
  try {
    const collection = await CollectionRepository.getByIdAndUserId(req.params.id, req.userId);
    if (!collection) return res.status(constants.STATUS_CODES.NOT_FOUND).json({ success: false, message: constants.MESSAGES.COLLECTION_NOT_FOUND });
    res.status(constants.STATUS_CODES.OK).json({ success: true, data: collection.members || [] });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({ success: false, message: constants.MESSAGES.ERROR });
  }
});

// POST /api/collections/:id/members
router.post('/:id/members', verifyToken, async (req, res) => {
  try {
    const collection = await CollectionRepository.getByIdAndUserId(req.params.id, req.userId);
    if (!collection) return res.status(constants.STATUS_CODES.NOT_FOUND).json({ success: false, message: constants.MESSAGES.COLLECTION_NOT_FOUND });
    const { name, email, phone, role } = req.body;
    if (!name) return res.status(constants.STATUS_CODES.BAD_REQUEST).json({ success: false, message: 'name is required' });
    const { v4: uuidv4 } = require('uuid');
    const pool = require('../config/database');
    const memberId = uuidv4();
    await pool.execute(
      'INSERT INTO members (id, collection_id, user_id, name, email, phone, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [memberId, req.params.id, req.userId, name, email || null, phone || null, role || 'member']
    );
    res.status(constants.STATUS_CODES.CREATED).json({ success: true, data: { id: memberId, collectionId: req.params.id, name, email, phone, role: role || 'member' } });
  } catch (error) {
    console.error('Create member error:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({ success: false, message: constants.MESSAGES.ERROR });
  }
});

// PUT /api/collections/:id/members/:memberId
router.put('/:id/members/:memberId', verifyToken, async (req, res) => {
  try {
    const collection = await CollectionRepository.getByIdAndUserId(req.params.id, req.userId);
    if (!collection) return res.status(constants.STATUS_CODES.NOT_FOUND).json({ success: false, message: constants.MESSAGES.COLLECTION_NOT_FOUND });
    const { name, email, phone, role } = req.body;
    const pool = require('../config/database');
    const [result] = await pool.execute(
      'UPDATE members SET name = COALESCE(?, name), email = COALESCE(?, email), phone = COALESCE(?, phone), role = COALESCE(?, role) WHERE id = ? AND collection_id = ?',
      [name || null, email || null, phone || null, role || null, req.params.memberId, req.params.id]
    );
    if (!result.affectedRows) return res.status(constants.STATUS_CODES.NOT_FOUND).json({ success: false, message: 'Member not found' });
    res.status(constants.STATUS_CODES.OK).json({ success: true, message: 'Member updated' });
  } catch (error) {
    console.error('Update member error:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({ success: false, message: constants.MESSAGES.ERROR });
  }
});

// DELETE /api/collections/:id/members/:memberId
router.delete('/:id/members/:memberId', verifyToken, async (req, res) => {
  try {
    const collection = await CollectionRepository.getByIdAndUserId(req.params.id, req.userId);
    if (!collection) return res.status(constants.STATUS_CODES.NOT_FOUND).json({ success: false, message: constants.MESSAGES.COLLECTION_NOT_FOUND });
    const pool = require('../config/database');
    const [result] = await pool.execute(
      'DELETE FROM members WHERE id = ? AND collection_id = ?',
      [req.params.memberId, req.params.id]
    );
    if (!result.affectedRows) return res.status(constants.STATUS_CODES.NOT_FOUND).json({ success: false, message: 'Member not found' });
    res.status(constants.STATUS_CODES.OK).json({ success: true, message: 'Member removed' });
  } catch (error) {
    console.error('Delete member error:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({ success: false, message: constants.MESSAGES.ERROR });
  }
});

// GET /api/collections/:id/contributions
router.get('/:id/contributions', verifyToken, async (req, res) => {
  try {
    const collection = await CollectionRepository.getByIdAndUserId(req.params.id, req.userId);
    if (!collection) return res.status(constants.STATUS_CODES.NOT_FOUND).json({ success: false, message: constants.MESSAGES.COLLECTION_NOT_FOUND });
    res.status(constants.STATUS_CODES.OK).json({ success: true, data: collection.contributions || [] });
  } catch (error) {
    console.error('Get contributions error:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({ success: false, message: constants.MESSAGES.ERROR });
  }
});

// POST /api/collections/:id/contributions
router.post('/:id/contributions', verifyToken, async (req, res) => {
  try {
    const collection = await CollectionRepository.getByIdAndUserId(req.params.id, req.userId);
    if (!collection) return res.status(constants.STATUS_CODES.NOT_FOUND).json({ success: false, message: constants.MESSAGES.COLLECTION_NOT_FOUND });
    const { memberId, memberName, amount, contributionDate, contributionType, description } = req.body;
    if (!memberId || !memberName || !amount || !contributionDate) {
      return res.status(constants.STATUS_CODES.BAD_REQUEST).json({ success: false, message: 'memberId, memberName, amount, and contributionDate are required' });
    }
    if (Number(amount) <= 0) {
      return res.status(constants.STATUS_CODES.BAD_REQUEST).json({ success: false, message: 'amount must be greater than 0' });
    }
    const { v4: uuidv4 } = require('uuid');
    const pool = require('../config/database');
    const contributionId = uuidv4();
    const validTypes = ['regular', 'interest', 'penalty'];
    const cType = validTypes.includes(contributionType) ? contributionType : 'regular';
    await pool.execute(
      'INSERT INTO contributions (id, collection_id, member_id, member_name, amount, contribution_date, contribution_type, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [contributionId, req.params.id, memberId, memberName, amount, contributionDate, cType, description || null]
    );
    res.status(constants.STATUS_CODES.CREATED).json({
      success: true,
      data: { id: contributionId, collectionId: req.params.id, memberId, memberName, amount: Number(amount), contributionDate, contributionType: cType, description },
    });
  } catch (error) {
    console.error('Create contribution error:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({ success: false, message: constants.MESSAGES.ERROR });
  }
});

module.exports = router;
