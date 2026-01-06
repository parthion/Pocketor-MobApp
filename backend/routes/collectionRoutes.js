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
      data: collection.toJSON(),
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

    const collections = await CollectionRepository.getByUserId(
      req.userId,
      page,
      limit
    );

    // Return paginated response format
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      data: {
        data: collections.map(c => c.toJSON()),
        page,
        limit,
        total: collections.length,
      },
    });
  } catch (error) {
    console.error('Get collections error:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
      success: false,
      message: constants.MESSAGES.ERROR,
      error: error.message,
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
      data: updatedCollection.toJSON(),
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

module.exports = router;
