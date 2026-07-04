/**
 * Loan Collection Routes
 * API endpoints for loan/finance collection management
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const loanCollectionRepo = require('../repositories/LoanCollectionRepository');
const constants = require('../config/constants');

// All routes require authentication
router.use(verifyToken);

// ============================================
// LINES (Loan Products) Routes
// ============================================

/**
 * Create a new line
 * POST /api/loan-collections/lines
 */
router.post('/lines', async (req, res) => {
  try {
    const userId = req.userId;
    const { lineName, lineType, interestPerHundred } = req.body;
    if (!lineName || !lineType || interestPerHundred === undefined) {
      return res.status(constants.STATUS_CODES.BAD_REQUEST).json({ success: false, message: 'lineName, lineType, and interestPerHundred are required' });
    }
    const validTypes = ['Daily', 'Weekly', 'Monthly'];
    if (!validTypes.includes(lineType)) {
      return res.status(constants.STATUS_CODES.BAD_REQUEST).json({ success: false, message: 'lineType must be Daily, Weekly, or Monthly' });
    }
    if (Number(interestPerHundred) <= 0) {
      return res.status(constants.STATUS_CODES.BAD_REQUEST).json({ success: false, message: 'interestPerHundred must be greater than 0' });
    }
    const line = await loanCollectionRepo.createLine(userId, req.body);
    
    res.status(constants.STATUS_CODES.CREATED).json({
      success: true,
      message: 'Line created successfully',
      data: line
    });
  } catch (error) {
    console.error('Error creating line:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to create line',
      error: error.message
    });
  }
});

/**
 * Get all lines for current user
 * GET /api/loan-collections/lines
 */
router.get('/lines', async (req, res) => {
  try {
    const userId = req.userId;
    const lines = await loanCollectionRepo.getLinesByUser(userId);
    
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      data: lines
    });
  } catch (error) {
    console.error('Error fetching lines:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to fetch lines',
      error: error.message
    });
  }
});

/**
 * Get a specific line
 * GET /api/loan-collections/lines/:id
 */
router.get('/lines/:id', async (req, res) => {
  try {
    const userId = req.userId;
    const line = await loanCollectionRepo.getLineById(userId, req.params.id);
    
    if (!line) {
      return res.status(constants.STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Line not found'
      });
    }
    
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      data: line
    });
  } catch (error) {
    console.error('Error fetching line:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to fetch line',
      error: error.message
    });
  }
});

/**
 * Update a line
 * PUT /api/loan-collections/lines/:id
 */
router.put('/lines/:id', async (req, res) => {
  try {
    const userId = req.userId;
    const updated = await loanCollectionRepo.updateLine(userId, req.params.id, req.body);
    
    if (!updated) {
      return res.status(constants.STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Line not found'
      });
    }
    
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: 'Line updated successfully'
    });
  } catch (error) {
    console.error('Error updating line:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to update line',
      error: error.message
    });
  }
});

/**
 * Delete a line
 * DELETE /api/loan-collections/lines/:id
 */
router.delete('/lines/:id', async (req, res) => {
  try {
    const userId = req.userId;
    const deleted = await loanCollectionRepo.deleteLine(userId, req.params.id);
    
    if (!deleted) {
      return res.status(constants.STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Line not found'
      });
    }
    
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: 'Line deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting line:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to delete line',
      error: error.message
    });
  }
});

// ============================================
// AREAS Routes
// ============================================

/**
 * Create a new area
 * POST /api/loan-collections/areas
 */
router.post('/areas', async (req, res) => {
  try {
    const userId = req.userId;
    if (!req.body.name || !req.body.lineId) {
      return res.status(constants.STATUS_CODES.BAD_REQUEST).json({ success: false, message: 'name and lineId are required' });
    }
    const area = await loanCollectionRepo.createArea(userId, req.body);
    
    res.status(constants.STATUS_CODES.CREATED).json({
      success: true,
      message: 'Area created successfully',
      data: area
    });
  } catch (error) {
    console.error('Error creating area:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to create area',
      error: error.message
    });
  }
});

/**
 * Get all areas for current user
 * GET /api/loan-collections/areas
 */
router.get('/areas', async (req, res) => {
  try {
    const userId = req.userId;
    const { lineId } = req.query;
    
    const areas = lineId 
      ? await loanCollectionRepo.getAreasByLine(userId, lineId)
      : await loanCollectionRepo.getAreasByUser(userId);
    
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      data: areas
    });
  } catch (error) {
    console.error('Error fetching areas:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to fetch areas',
      error: error.message
    });
  }
});

/**
 * Update an area
 * PUT /api/loan-collections/areas/:id
 */
router.put('/areas/:id', async (req, res) => {
  try {
    const userId = req.userId;
    const updated = await loanCollectionRepo.updateArea(userId, req.params.id, req.body);
    
    if (!updated) {
      return res.status(constants.STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Area not found'
      });
    }
    
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: 'Area updated successfully'
    });
  } catch (error) {
    console.error('Error updating area:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to update area',
      error: error.message
    });
  }
});

/**
 * Delete an area
 * DELETE /api/loan-collections/areas/:id
 */
router.delete('/areas/:id', async (req, res) => {
  try {
    const userId = req.userId;
    const deleted = await loanCollectionRepo.deleteArea(userId, req.params.id);
    
    if (!deleted) {
      return res.status(constants.STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Area not found'
      });
    }
    
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: 'Area deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting area:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to delete area',
      error: error.message
    });
  }
});

// ============================================
// CUSTOMERS Routes
// ============================================

/**
 * Create a new customer
 * POST /api/loan-collections/customers
 */
router.post('/customers', async (req, res) => {
  try {
    const userId = req.userId;
    if (!req.body.name || !req.body.lineId || !req.body.areaId) {
      return res.status(constants.STATUS_CODES.BAD_REQUEST).json({ success: false, message: 'name, lineId, and areaId are required' });
    }
    const customer = await loanCollectionRepo.createCustomer(userId, req.body);
    
    res.status(constants.STATUS_CODES.CREATED).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to create customer',
      error: error.message
    });
  }
});

/**
 * Get all customers for current user
 * GET /api/loan-collections/customers
 */
router.get('/customers', async (req, res) => {
  try {
    const userId = req.userId;
    const { areaId, lineId } = req.query;
    
    let customers;
    if (areaId) {
      customers = await loanCollectionRepo.getCustomersByArea(userId, areaId);
    } else if (lineId) {
      customers = await loanCollectionRepo.getCustomersByLine(userId, lineId);
    } else {
      customers = await loanCollectionRepo.getCustomersByUser(userId);
    }
    
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to fetch customers',
      error: error.message
    });
  }
});

/**
 * Update a customer
 * PUT /api/loan-collections/customers/:id
 */
router.put('/customers/:id', async (req, res) => {
  try {
    const userId = req.userId;
    const updated = await loanCollectionRepo.updateCustomer(userId, req.params.id, req.body);
    
    if (!updated) {
      return res.status(constants.STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: 'Customer updated successfully'
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to update customer',
      error: error.message
    });
  }
});

/**
 * Delete a customer
 * DELETE /api/loan-collections/customers/:id
 */
router.delete('/customers/:id', async (req, res) => {
  try {
    const userId = req.userId;
    const deleted = await loanCollectionRepo.deleteCustomer(userId, req.params.id);
    
    if (!deleted) {
      return res.status(constants.STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to delete customer',
      error: error.message
    });
  }
});

// ============================================
// LOANS Routes
// ============================================

/**
 * Create a new loan
 * POST /api/loan-collections/loans
 */
router.post('/loans', async (req, res) => {
  try {
    const userId = req.userId;
    const { customerId, lineId, areaId, principalAmount, totalAmount, installmentAmount, noOfInstalls, startDate } = req.body;
    if (!customerId || !lineId || !areaId || !principalAmount || !totalAmount || !installmentAmount || !noOfInstalls || !startDate) {
      return res.status(constants.STATUS_CODES.BAD_REQUEST).json({ success: false, message: 'customerId, lineId, areaId, principalAmount, totalAmount, installmentAmount, noOfInstalls, startDate are required' });
    }
    if (Number(principalAmount) <= 0 || Number(totalAmount) <= 0 || Number(installmentAmount) <= 0 || Number(noOfInstalls) <= 0) {
      return res.status(constants.STATUS_CODES.BAD_REQUEST).json({ success: false, message: 'Amounts and installments must be positive numbers' });
    }
    const loan = await loanCollectionRepo.createLoan(userId, req.body);
    
    res.status(constants.STATUS_CODES.CREATED).json({
      success: true,
      message: 'Loan created successfully',
      data: loan
    });
  } catch (error) {
    console.error('Error creating loan:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to create loan',
      error: error.message
    });
  }
});

/**
 * Get all loans for current user
 * GET /api/loan-collections/loans
 */
router.get('/loans', async (req, res) => {
  try {
    const userId = req.userId;
    const { customerId } = req.query;
    
    const loans = customerId
      ? await loanCollectionRepo.getLoansByCustomer(userId, customerId)
      : await loanCollectionRepo.getLoansByUser(userId);
    
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      data: loans
    });
  } catch (error) {
    console.error('Error fetching loans:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to fetch loans',
      error: error.message
    });
  }
});

/**
 * Get a specific loan
 * GET /api/loan-collections/loans/:id
 */
router.get('/loans/:id', async (req, res) => {
  try {
    const userId = req.userId;
    const loan = await loanCollectionRepo.getLoanById(userId, req.params.id);
    
    if (!loan) {
      return res.status(constants.STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Loan not found'
      });
    }
    
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      data: loan
    });
  } catch (error) {
    console.error('Error fetching loan:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to fetch loan',
      error: error.message
    });
  }
});

/**
 * Update a loan
 * PUT /api/loan-collections/loans/:id
 */
router.put('/loans/:id', async (req, res) => {
  try {
    const userId = req.userId;
    const updated = await loanCollectionRepo.updateLoan(userId, req.params.id, req.body);
    
    if (!updated) {
      return res.status(constants.STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Loan not found'
      });
    }
    
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: 'Loan updated successfully'
    });
  } catch (error) {
    console.error('Error updating loan:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to update loan',
      error: error.message
    });
  }
});

/**
 * Delete a loan
 * DELETE /api/loan-collections/loans/:id
 */
router.delete('/loans/:id', async (req, res) => {
  try {
    const userId = req.userId;
    const deleted = await loanCollectionRepo.deleteLoan(userId, req.params.id);
    
    if (!deleted) {
      return res.status(constants.STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Loan not found'
      });
    }
    
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: 'Loan deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting loan:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to delete loan',
      error: error.message
    });
  }
});

// ============================================
// PAYMENTS Routes
// ============================================

/**
 * Record a payment
 * POST /api/loan-collections/payments
 */
router.post('/payments', async (req, res) => {
  try {
    const userId = req.userId;
    if (!req.body.loanId || !req.body.customerId || !req.body.amount || !req.body.paymentDate) {
      return res.status(constants.STATUS_CODES.BAD_REQUEST).json({ success: false, message: 'loanId, customerId, amount, and paymentDate are required' });
    }
    if (Number(req.body.amount) <= 0) {
      return res.status(constants.STATUS_CODES.BAD_REQUEST).json({ success: false, message: 'Payment amount must be greater than 0' });
    }
    const payment = await loanCollectionRepo.recordPayment(userId, req.body);
    
    res.status(constants.STATUS_CODES.CREATED).json({
      success: true,
      message: 'Payment recorded successfully',
      data: payment
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to record payment',
      error: error.message
    });
  }
});

router.get('/areas/by-line/:lineId', async (req, res) => {
  try {
    const areas = await loanCollectionRepo.getAreasByLine(req.userId, req.params.lineId);
    res.status(constants.STATUS_CODES.OK).json({ success: true, data: areas });
  } catch (error) {
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({ success: false, message: 'Failed to fetch areas', error: error.message });
  }
});

router.get('/customers/by-area/:areaId', async (req, res) => {
  // Verify the area belongs to this user
  try {
    const [areaRows] = await require('../config/database').execute('SELECT id FROM areas WHERE id = ? AND user_id = ?', [req.params.areaId, req.userId]);
    if (!areaRows.length) return res.status(constants.STATUS_CODES.NOT_FOUND).json({ success: false, message: 'Area not found' });
    const customers = await loanCollectionRepo.getCustomersByArea(req.userId, req.params.areaId);
    res.status(constants.STATUS_CODES.OK).json({ success: true, data: customers });
  } catch (error) {
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({ success: false, message: 'Failed to fetch customers', error: error.message });
  }
});

router.get('/customers/by-line/:lineId', async (req, res) => {
  try {
    const [lineRows] = await require('../config/database').execute('SELECT id FROM lines WHERE id = ? AND user_id = ?', [req.params.lineId, req.userId]);
    if (!lineRows.length) return res.status(constants.STATUS_CODES.NOT_FOUND).json({ success: false, message: 'Line not found' });
    const customers = await loanCollectionRepo.getCustomersByLine(req.userId, req.params.lineId);
    res.status(constants.STATUS_CODES.OK).json({ success: true, data: customers });
  } catch (error) {
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({ success: false, message: 'Failed to fetch customers', error: error.message });
  }
});

router.get('/loans/by-customer/:customerId', async (req, res) => {
  try {
    const [custRows] = await require('../config/database').execute('SELECT id FROM customers WHERE id = ? AND user_id = ?', [req.params.customerId, req.userId]);
    if (!custRows.length) return res.status(constants.STATUS_CODES.NOT_FOUND).json({ success: false, message: 'Customer not found' });
    const loans = await loanCollectionRepo.getLoansByCustomer(req.userId, req.params.customerId);
    res.status(constants.STATUS_CODES.OK).json({ success: true, data: loans });
  } catch (error) {
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({ success: false, message: 'Failed to fetch loans', error: error.message });
  }
});

// Alias routes that match what mobile calls
router.get('/payments/by-loan/:loanId', async (req, res) => {
  try {
    const payments = await loanCollectionRepo.getPaymentsByLoan(req.userId, req.params.loanId);
    res.status(constants.STATUS_CODES.OK).json({ success: true, data: payments });
  } catch (error) {
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({ success: false, message: 'Failed to fetch payments', error: error.message });
  }
});

router.get('/payments/by-customer/:customerId', async (req, res) => {
  try {
    const payments = await loanCollectionRepo.getPaymentsByCustomer(req.userId, req.params.customerId);
    res.status(constants.STATUS_CODES.OK).json({ success: true, data: payments });
  } catch (error) {
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({ success: false, message: 'Failed to fetch payments', error: error.message });
  }
});

// Delete/reverse a payment
router.delete('/payments/:id', async (req, res) => {
  try {
    const deleted = await loanCollectionRepo.deletePayment(req.userId, req.params.id);
    if (!deleted) return res.status(constants.STATUS_CODES.NOT_FOUND).json({ success: false, message: 'Payment not found' });
    res.status(constants.STATUS_CODES.OK).json({ success: true, message: 'Payment reversed successfully' });
  } catch (error) {
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({ success: false, message: 'Failed to reverse payment', error: error.message });
  }
});

/**
 * Get payments by loan
 * GET /api/loan-collections/payments/loan/:loanId
 */
router.get('/payments/loan/:loanId', async (req, res) => {
  try {
    const userId = req.userId;
    const payments = await loanCollectionRepo.getPaymentsByLoan(userId, req.params.loanId);
    
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to fetch payments',
      error: error.message
    });
  }
});

/**
 * Get payments by customer
 * GET /api/loan-collections/payments/customer/:customerId
 */
router.get('/payments/customer/:customerId', async (req, res) => {
  try {
    const userId = req.userId;
    const payments = await loanCollectionRepo.getPaymentsByCustomer(userId, req.params.customerId);
    
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to fetch payments',
      error: error.message
    });
  }
});

module.exports = router;
