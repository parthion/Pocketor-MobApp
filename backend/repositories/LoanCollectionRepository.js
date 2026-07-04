/**
 * Loan Collection Repository
 * Data access layer for loan collection operations
 */

const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class LoanCollectionRepository {
  // ============================================
  // LINES (Loan Products) Operations
  // ============================================

  async createLine(userId, lineData) {
    const connection = await pool.getConnection();
    try {
      const id = uuidv4();
      const query = 'INSERT INTO `lines` (id, user_id, line_name, line_type, interest_per_hundred, bad_loan_days, bill_amount_per_hundred, close_loan_manually, enable_penalty, keep_paid_customer_in_completed_tab, no_of_installs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
      
      await connection.execute(query, [
        id,
        userId,
        lineData.lineName,
        lineData.lineType,
        lineData.interestPerHundred,
        lineData.badLoanDays || 0,
        lineData.billAmountPerHundred || 0,
        lineData.closeLoanManually || false,
        lineData.enablePenalty || false,
        lineData.keepPaidCustomerInCompletedTab || false,
        lineData.noOfInstalls || 1
      ]);

      return { id, ...lineData };
    } finally {
      connection.release();
    }
  }

  async getLinesByUser(userId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM `lines` WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );
      return rows.map(this.formatLineRow);
    } finally {
      connection.release();
    }
  }

  async getLineById(userId, lineId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM `lines` WHERE id = ? AND user_id = ?',
        [lineId, userId]
      );
      return rows.length > 0 ? this.formatLineRow(rows[0]) : null;
    } finally {
      connection.release();
    }
  }

  async updateLine(userId, lineId, lineData) {
    const connection = await pool.getConnection();
    try {
      const query = 'UPDATE `lines` SET line_name = ?, line_type = ?, interest_per_hundred = ?, bad_loan_days = ?, bill_amount_per_hundred = ?, close_loan_manually = ?, enable_penalty = ?, keep_paid_customer_in_completed_tab = ?, no_of_installs = ? WHERE id = ? AND user_id = ?';
      
      const [result] = await connection.execute(query, [
        lineData.lineName,
        lineData.lineType,
        lineData.interestPerHundred,
        lineData.badLoanDays,
        lineData.billAmountPerHundred,
        lineData.closeLoanManually,
        lineData.enablePenalty,
        lineData.keepPaidCustomerInCompletedTab,
        lineData.noOfInstalls,
        lineId,
        userId
      ]);

      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  async deleteLine(userId, lineId) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(
        'DELETE FROM `lines` WHERE id = ? AND user_id = ?',
        [lineId, userId]
      );
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  formatLineRow(row) {
    return {
      id: row.id,
      lineName: row.line_name,
      lineType: row.line_type,
      interestPerHundred: parseFloat(row.interest_per_hundred),
      badLoanDays: row.bad_loan_days,
      billAmountPerHundred: parseFloat(row.bill_amount_per_hundred),
      closeLoanManually: Boolean(row.close_loan_manually),
      enablePenalty: Boolean(row.enable_penalty),
      keepPaidCustomerInCompletedTab: Boolean(row.keep_paid_customer_in_completed_tab),
      noOfInstalls: row.no_of_installs,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // ============================================
  // AREAS Operations
  // ============================================

  async createArea(userId, areaData) {
    const connection = await pool.getConnection();
    try {
      const id = uuidv4();
      const query = 'INSERT INTO `areas` (id, user_id, line_id, name) VALUES (?, ?, ?, ?)';
      
      await connection.execute(query, [id, userId, areaData.lineId, areaData.name]);
      return { id, ...areaData };
    } finally {
      connection.release();
    }
  }

  async getAreasByUser(userId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM `areas` WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  async getAreasByLine(userId, lineId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM `areas` WHERE user_id = ? AND line_id = ? ORDER BY created_at DESC',
        [userId, lineId]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  async updateArea(userId, areaId, areaData) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(
        'UPDATE `areas` SET name = ?, line_id = ? WHERE id = ? AND user_id = ?',
        [areaData.name, areaData.lineId, areaId, userId]
      );
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  async deleteArea(userId, areaId) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(
        'DELETE FROM `areas` WHERE id = ? AND user_id = ?',
        [areaId, userId]
      );
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  // ============================================
  // CUSTOMERS Operations
  // ============================================

  async createCustomer(userId, customerData) {
    const connection = await pool.getConnection();
    try {
      const id = uuidv4();
      const query = 'INSERT INTO `customers` (id, user_id, line_id, area_id, name, phone, address, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
      
      await connection.execute(query, [
        id,
        userId,
        customerData.lineId,
        customerData.areaId,
        customerData.name,
        customerData.phone || null,
        customerData.address || null,
        customerData.status || 'active'
      ]);

      return { id, ...customerData };
    } finally {
      connection.release();
    }
  }

  async getCustomersByUser(userId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM `customers` WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  async getCustomersByArea(userId, areaId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM `customers` WHERE user_id = ? AND area_id = ? ORDER BY created_at DESC',
        [userId, areaId]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  async getCustomersByLine(userId, lineId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM `customers` WHERE user_id = ? AND line_id = ? ORDER BY created_at DESC',
        [userId, lineId]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  async updateCustomer(userId, customerId, customerData) {
    const connection = await pool.getConnection();
    try {
      const query = 'UPDATE `customers` SET name = ?, phone = ?, address = ?, status = ?, line_id = ?, area_id = ? WHERE id = ? AND user_id = ?';
      
      const [result] = await connection.execute(query, [
        customerData.name,
        customerData.phone,
        customerData.address,
        customerData.status,
        customerData.lineId,
        customerData.areaId,
        customerId,
        userId
      ]);

      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  async deleteCustomer(userId, customerId) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(
        'DELETE FROM `customers` WHERE id = ? AND user_id = ?',
        [customerId, userId]
      );
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  // ============================================
  // LOANS Operations
  // ============================================

  async createLoan(userId, loanData) {
    const connection = await pool.getConnection();
    try {
      const id = uuidv4();
      const query = 'INSERT INTO `loans` (id, user_id, customer_id, line_id, area_id, principal_amount, interest_rate, total_amount, installment_amount, no_of_installs, paid_amount, balance_amount, status, start_date, expected_end_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
      
      await connection.execute(query, [
        id,
        userId,
        loanData.customerId,
        loanData.lineId,
        loanData.areaId,
        loanData.principalAmount,
        loanData.interestRate,
        loanData.totalAmount,
        loanData.installmentAmount,
        loanData.noOfInstalls,
        loanData.paidAmount || 0,
        loanData.balanceAmount || loanData.totalAmount,
        loanData.status || 'active',
        loanData.startDate,
        loanData.expectedEndDate || null
      ]);

      return { id, ...loanData };
    } finally {
      connection.release();
    }
  }

  async getLoansByUser(userId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM `loans` WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );
      return rows.map(this.formatLoanRow);
    } finally {
      connection.release();
    }
  }

  async getLoanById(userId, loanId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM `loans` WHERE id = ? AND user_id = ?',
        [loanId, userId]
      );
      return rows.length > 0 ? this.formatLoanRow(rows[0]) : null;
    } finally {
      connection.release();
    }
  }

  async getLoansByCustomer(userId, customerId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM `loans` WHERE user_id = ? AND customer_id = ? ORDER BY created_at DESC',
        [userId, customerId]
      );
      return rows.map(this.formatLoanRow);
    } finally {
      connection.release();
    }
  }

  async updateLoan(userId, loanId, loanData) {
    const connection = await pool.getConnection();
    try {
      const query = 'UPDATE `loans` SET principal_amount = ?, interest_rate = ?, total_amount = ?, installment_amount = ?, no_of_installs = ?, paid_amount = ?, balance_amount = ?, status = ? WHERE id = ? AND user_id = ?';
      
      const [result] = await connection.execute(query, [
        loanData.principalAmount,
        loanData.interestRate,
        loanData.totalAmount,
        loanData.installmentAmount,
        loanData.noOfInstalls,
        loanData.paidAmount,
        loanData.balanceAmount,
        loanData.status,
        loanId,
        userId
      ]);

      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  async deleteLoan(userId, loanId) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(
        'DELETE FROM `loans` WHERE id = ? AND user_id = ?',
        [loanId, userId]
      );
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  formatLoanRow(row) {
    return {
      id: row.id,
      customerId: row.customer_id,
      lineId: row.line_id,
      areaId: row.area_id,
      principalAmount: parseFloat(row.principal_amount),
      interestRate: parseFloat(row.interest_rate),
      totalAmount: parseFloat(row.total_amount),
      installmentAmount: parseFloat(row.installment_amount),
      noOfInstalls: row.no_of_installs,
      paidAmount: parseFloat(row.paid_amount),
      balanceAmount: parseFloat(row.balance_amount),
      status: row.status,
      startDate: row.start_date,
      expectedEndDate: row.expected_end_date,
      actualEndDate: row.actual_end_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // ============================================
  // PAYMENTS Operations
  // ============================================

  async recordPayment(userId, paymentData) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [loanRows] = await connection.execute('SELECT balance_amount, status FROM loans WHERE id = ? AND user_id = ?', [paymentData.loanId, userId]);
      if (!loanRows.length) throw new Error('Loan not found');
      const loan = loanRows[0];
      if (loan.status !== 'active') throw new Error('Cannot record payment on a non-active loan');
      if (Number(paymentData.amount) > Number(loan.balance_amount)) throw new Error('Payment amount exceeds outstanding balance');

      const paymentId = uuidv4();
      const insertQuery = 'INSERT INTO `payments` (id, user_id, loan_id, customer_id, amount, payment_date, payment_type, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
      
      await connection.execute(insertQuery, [
        paymentId,
        userId,
        paymentData.loanId,
        paymentData.customerId,
        paymentData.amount,
        paymentData.paymentDate,
        paymentData.paymentType || 'installment',
        paymentData.notes || null
      ]);

      const updateLoanQuery = 'UPDATE `loans` SET paid_amount = paid_amount + ?, balance_amount = balance_amount - ? WHERE id = ? AND user_id = ?';
      
      await connection.execute(updateLoanQuery, [
        paymentData.amount,
        paymentData.amount,
        paymentData.loanId,
        userId
      ]);

      // Auto-complete loan if balance reaches zero
      await connection.execute(
        "UPDATE loans SET status = 'completed', actual_end_date = CURDATE() WHERE id = ? AND user_id = ? AND balance_amount <= 0 AND status = 'active'",
        [paymentData.loanId, userId]
      );

      await connection.commit();
      return { id: paymentId, ...paymentData };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async getPaymentsByLoan(userId, loanId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM `payments` WHERE user_id = ? AND loan_id = ? ORDER BY payment_date DESC',
        [userId, loanId]
      );
      return rows.map(this.formatPaymentRow);
    } finally {
      connection.release();
    }
  }

  async getPaymentsByCustomer(userId, customerId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM `payments` WHERE user_id = ? AND customer_id = ? ORDER BY payment_date DESC',
        [userId, customerId]
      );
      return rows.map(this.formatPaymentRow);
    } finally {
      connection.release();
    }
  }

  async deletePayment(userId, paymentId) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      // Get payment details first
      const [payRows] = await connection.execute(
        'SELECT * FROM payments WHERE id = ? AND user_id = ?',
        [paymentId, userId]
      );
      if (!payRows.length) { await connection.rollback(); return false; }
      const payment = payRows[0];
      // Delete payment record
      await connection.execute('DELETE FROM payments WHERE id = ? AND user_id = ?', [paymentId, userId]);
      // Reverse the loan balance update
      await connection.execute(
        'UPDATE loans SET paid_amount = paid_amount - ?, balance_amount = balance_amount + ?, status = CASE WHEN status = "completed" THEN "active" ELSE status END WHERE id = ? AND user_id = ?',
        [payment.amount, payment.amount, payment.loan_id, userId]
      );
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  formatPaymentRow(row) {
    return {
      id: row.id,
      loanId: row.loan_id,
      customerId: row.customer_id,
      amount: parseFloat(row.amount),
      paymentDate: row.payment_date,
      paymentType: row.payment_type,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

module.exports = new LoanCollectionRepository();
