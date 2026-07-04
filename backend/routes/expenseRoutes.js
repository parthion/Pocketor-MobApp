const express = require('express');
const router = express.Router();
const { verifyToken: authenticateToken } = require('../middleware/authMiddleware');
const expenseRepo = require('../repositories/ExpenseRepository');

// All expense routes require authentication
router.use(authenticateToken);

// GET /api/expenses — list with optional filters: ?category=Travel&startDate=2026-01-01&endDate=2026-12-31&limit=50&offset=0
router.get('/', async (req, res) => {
  try {
    const { category, startDate, endDate, limit, offset } = req.query;
    const result = await expenseRepo.getByUser(req.userId, { category, startDate, endDate, limit, offset });
    res.json({ success: true, data: result.expenses, total: result.total });
  } catch (err) {
    console.error('GET /expenses error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch expenses' });
  }
});

// GET /api/expenses/summary — totals grouped by category
router.get('/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const summary = await expenseRepo.getSummaryByCategory(req.userId, startDate, endDate);
    res.json({ success: true, data: summary });
  } catch (err) {
    console.error('GET /expenses/summary error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch summary' });
  }
});

// GET /api/expenses/:id
router.get('/:id', async (req, res) => {
  try {
    const expense = await expenseRepo.getById(req.userId, req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, data: expense });
  } catch (err) {
    console.error('GET /expenses/:id error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch expense' });
  }
});

// POST /api/expenses
router.post('/', async (req, res) => {
  try {
    const { title, amount, category, note, expenseDate } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
    }
    const dateToUse = expenseDate || new Date().toISOString().split('T')[0];
    const expense = await expenseRepo.create(req.userId, {
      title: title.trim(),
      amount: parsedAmount,
      category: category || 'Other',
      note: note ? note.trim() : null,
      expenseDate: dateToUse,
    });
    res.status(201).json({ success: true, data: expense, message: 'Expense created' });
  } catch (err) {
    console.error('POST /expenses error:', err);
    res.status(500).json({ success: false, message: 'Failed to create expense' });
  }
});

// PUT /api/expenses/:id
router.put('/:id', async (req, res) => {
  try {
    const { title, amount, category, note, expenseDate } = req.body;
    if (amount !== undefined) {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
      }
    }
    const updated = await expenseRepo.update(req.userId, req.params.id, {
      title: title ? title.trim() : undefined,
      amount: amount !== undefined ? parseFloat(amount) : undefined,
      category,
      note: note !== undefined ? (note ? note.trim() : null) : undefined,
      expenseDate,
    });
    if (!updated) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, data: updated, message: 'Expense updated' });
  } catch (err) {
    console.error('PUT /expenses/:id error:', err);
    res.status(500).json({ success: false, message: 'Failed to update expense' });
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await expenseRepo.delete(req.userId, req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, message: 'Expense deleted' });
  } catch (err) {
    console.error('DELETE /expenses/:id error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete expense' });
  }
});

module.exports = router;
