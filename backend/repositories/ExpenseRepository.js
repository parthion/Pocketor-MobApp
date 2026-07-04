const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class ExpenseRepository {
  async create(userId, data) {
    const conn = await pool.getConnection();
    try {
      const id = uuidv4();
      await conn.execute(
        `INSERT INTO expenses (id, user_id, title, amount, category, note, expense_date)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, userId, data.title, data.amount, data.category || 'Other', data.note || null, data.expenseDate]
      );
      const [rows] = await conn.execute('SELECT * FROM expenses WHERE id = ?', [id]);
      return this._format(rows[0]);
    } finally {
      conn.release();
    }
  }

  async getByUser(userId, { category, startDate, endDate, limit = 100, offset = 0 } = {}) {
    const conn = await pool.getConnection();
    try {
      let where = 'WHERE user_id = ?';
      const params = [userId];
      if (category && category !== 'All') { where += ' AND category = ?'; params.push(category); }
      if (startDate) { where += ' AND expense_date >= ?'; params.push(startDate); }
      if (endDate)   { where += ' AND expense_date <= ?'; params.push(endDate); }

      const [[{ total }]] = await conn.execute(
        `SELECT COUNT(*) AS total FROM expenses ${where}`, params
      );
      const [rows] = await conn.execute(
        `SELECT * FROM expenses ${where} ORDER BY expense_date DESC, created_at DESC LIMIT ? OFFSET ?`,
        [...params, Number(limit), Number(offset)]
      );
      return { expenses: rows.map(r => this._format(r)), total };
    } finally {
      conn.release();
    }
  }

  async getById(userId, id) {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.execute(
        'SELECT * FROM expenses WHERE id = ? AND user_id = ?', [id, userId]
      );
      return rows.length > 0 ? this._format(rows[0]) : null;
    } finally {
      conn.release();
    }
  }

  async update(userId, id, data) {
    const conn = await pool.getConnection();
    try {
      const fields = [];
      const params = [];
      if (data.title !== undefined)       { fields.push('title = ?');        params.push(data.title); }
      if (data.amount !== undefined)      { fields.push('amount = ?');       params.push(data.amount); }
      if (data.category !== undefined)    { fields.push('category = ?');     params.push(data.category); }
      if (data.note !== undefined)        { fields.push('note = ?');         params.push(data.note); }
      if (data.expenseDate !== undefined) { fields.push('expense_date = ?'); params.push(data.expenseDate); }

      if (fields.length === 0) return this.getById(userId, id);

      params.push(id, userId);
      const [result] = await conn.execute(
        `UPDATE expenses SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`, params
      );
      if (result.affectedRows === 0) return null;
      return this.getById(userId, id);
    } finally {
      conn.release();
    }
  }

  async delete(userId, id) {
    const conn = await pool.getConnection();
    try {
      const [result] = await conn.execute(
        'DELETE FROM expenses WHERE id = ? AND user_id = ?', [id, userId]
      );
      return result.affectedRows > 0;
    } finally {
      conn.release();
    }
  }

  async getSummaryByCategory(userId, startDate, endDate) {
    const conn = await pool.getConnection();
    try {
      let where = 'WHERE user_id = ?';
      const params = [userId];
      if (startDate) { where += ' AND expense_date >= ?'; params.push(startDate); }
      if (endDate)   { where += ' AND expense_date <= ?'; params.push(endDate); }

      const [rows] = await conn.execute(
        `SELECT category, SUM(amount) AS total, COUNT(*) AS count
         FROM expenses ${where}
         GROUP BY category ORDER BY total DESC`,
        params
      );
      return rows;
    } finally {
      conn.release();
    }
  }

  _format(row) {
    return {
      id:          row.id,
      userId:      row.user_id,
      title:       row.title,
      amount:      parseFloat(row.amount),
      category:    row.category,
      note:        row.note || '',
      expenseDate: row.expense_date instanceof Date
        ? row.expense_date.toISOString().split('T')[0]
        : row.expense_date,
      createdAt:   row.created_at,
      updatedAt:   row.updated_at,
    };
  }
}

module.exports = new ExpenseRepository();
