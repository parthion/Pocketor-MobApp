/**
 * Ledger Service
 * Creates double-entry ledger records on payment/adjustment events.
 * Each payment produces two balanced rows: debit cash + credit loan_receivable.
 */

const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Write a debit/credit pair atomically.
 * @param {object} conn  - active mysql2 connection (within transaction)
 * @param {object} entry - { userId, refType, refId, amount, debitAccount, creditAccount, description }
 */
async function writeEntry(conn, { userId, refType, refId, amount, debitAccount, creditAccount, description }) {
  const base = [userId, refType, refId, amount, description || null];
  await conn.execute(
    'INSERT INTO ledger_entries (id, user_id, ref_type, ref_id, entry_type, account, amount, description) VALUES (?,?,?,?,?,?,?,?)',
    [uuidv4(), ...base.slice(0, 3), base[3], 'debit',  debitAccount,  base[3], base[4]]
  );
  await conn.execute(
    'INSERT INTO ledger_entries (id, user_id, ref_type, ref_id, entry_type, account, amount, description) VALUES (?,?,?,?,?,?,?,?)',
    [uuidv4(), ...base.slice(0, 3), base[3], 'credit', creditAccount, base[3], base[4]]
  );
}

/**
 * Record ledger entries for a loan payment.
 * Debit: cash   | Credit: loan_receivable
 * If interest portion provided, also:
 * Debit: loan_receivable | Credit: interest_income
 */
async function recordPaymentLedger(conn, { userId, paymentId, amount, interestAmount = 0 }) {
  const principalAmount = parseFloat((amount - interestAmount).toFixed(2));

  // Cash received
  await writeEntry(conn, {
    userId, refType: 'payment', refId: paymentId,
    amount, debitAccount: 'cash', creditAccount: 'loan_receivable',
    description: 'Loan installment received',
  });

  // Interest income split (only if interest > 0)
  if (interestAmount > 0) {
    await writeEntry(conn, {
      userId, refType: 'payment', refId: paymentId,
      amount: interestAmount, debitAccount: 'loan_receivable', creditAccount: 'interest_income',
      description: 'Interest portion of installment',
    });
  }
}

/**
 * Record ledger for a fee charge.
 * Debit: cash | Credit: fee_income
 */
async function recordFeeLedger(conn, { userId, refId, amount, description }) {
  await writeEntry(conn, {
    userId, refType: 'fee', refId,
    amount, debitAccount: 'cash', creditAccount: 'fee_income',
    description: description || 'Processing fee',
  });
}

/**
 * Fetch ledger entries for a user (with optional filters).
 */
async function getLedger(userId, { refType, refId, account } = {}) {
  const conn = await pool.getConnection();
  try {
    let query = 'SELECT * FROM ledger_entries WHERE user_id = ?';
    const params = [userId];
    if (refType) { query += ' AND ref_type = ?'; params.push(refType); }
    if (refId)   { query += ' AND ref_id = ?';   params.push(refId); }
    if (account) { query += ' AND account = ?';   params.push(account); }
    query += ' ORDER BY created_at DESC';
    const [rows] = await conn.execute(query, params);
    return rows;
  } finally {
    conn.release();
  }
}

module.exports = { recordPaymentLedger, recordFeeLedger, getLedger, writeEntry };
