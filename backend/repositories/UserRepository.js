/**
 * User Repository
 * Handles all database operations for users
 */

const pool = require('../config/database');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class UserRepository {
  /**
   * Get user by ID
   * @param {string} id - User ID
   * @returns {Promise<User|null>}
   */
  async getById(id) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        'SELECT * FROM users WHERE id = ?',
        [id]
      );
      if (rows.length === 0) return null;
      return User.fromDatabase(rows[0]);
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get user by email
   * @param {string} email - User email
   * @returns {Promise<User|null>}
   */
  async getByEmail(email) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
      if (rows.length === 0) return null;
      return User.fromDatabase(rows[0]);
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get all users
   * @param {number} page - Page number
   * @param {number} limit - Results per page
   * @returns {Promise<Array>}
   */
  async getAll(page = 1, limit = 10) {
    const connection = await pool.getConnection();
    try {
      const offset = (page - 1) * limit;
      const [rows] = await connection.query(
        'SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );
      return rows.map(row => User.fromDatabase(row));
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  async getCount() {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query('SELECT COUNT(*) AS count FROM users');
      return rows[0]?.count || 0;
    } catch (error) {
      console.error('Error counting users:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Create new user
   * @param {object} userData - User data
   * @returns {Promise<User>}
   */
  async create(userData) {
    const connection = await pool.getConnection();
    try {
      const id = uuidv4();
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      await connection.query(
        'INSERT INTO users (id, email, name, phone, password_hash, role, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          id,
          userData.email,
          userData.name,
          userData.phone,
          hashedPassword,
          userData.role || 'agent',
          userData.createdBy || null,
        ]
      );

      return await this.getById(id);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Update user
   * @param {string} id - User ID
   * @param {object} userData - Updated user data
   * @returns {Promise<User|null>}
   */
  async update(id, userData) {
    const connection = await pool.getConnection();
    try {
      const updates = [];
      const values = [];

      // Only update provided fields
      Object.keys(userData).forEach(key => {
        if (userData[key] !== undefined && userData[key] !== null) {
          updates.push(`${key} = ?`);
          values.push(userData[key]);
        }
      });

      if (updates.length === 0) return null;

      values.push(id);
      const query = `UPDATE users SET ${updates.join(
        ', '
      )} WHERE id = ?`;
      await connection.query(query, values);

      return await this.getById(id);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Delete user
   * @param {string} id - User ID
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    const connection = await pool.getConnection();
    try {
      const result = await connection.query(
        'DELETE FROM users WHERE id = ?',
        [id]
      );
      return result[0].affectedRows > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Verify user password
   * @param {string} userId - User ID
   * @param {string} password - Password to verify
   * @returns {Promise<boolean>}
   */
  async verifyPassword(userId, password) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        'SELECT password_hash FROM users WHERE id = ?',
        [userId]
      );

      if (rows.length === 0) return false;

      const isValid = await bcrypt.compare(password, rows[0].password_hash);
      return isValid;
    } catch (error) {
      console.error('Error verifying password:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Check if email exists
   * @param {string} email - Email to check
   * @returns {Promise<boolean>}
   */
  async emailExists(email) {
    const user = await this.getByEmail(email);
    return user !== null;
  }

  /**
   * Check if phone exists
   * @param {string} phone - Phone to check
   * @returns {Promise<boolean>}
   */
  async phoneExists(phone) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        'SELECT id FROM users WHERE phone = ?',
        [phone]
      );
      return rows.length > 0;
    } catch (error) {
      console.error('Error checking phone:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get user by phone
   * @param {string} phone - User phone number
   * @returns {Promise<User|null>}
   */
  async getByPhone(phone) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        'SELECT * FROM users WHERE phone = ?',
        [phone]
      );
      if (rows.length === 0) return null;
      return User.fromDatabase(rows[0]);
    } catch (error) {
      console.error('Error getting user by phone:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Update user password
   * @param {string} id - User ID
   * @param {string} hashedPassword - Hashed password
   * @returns {Promise<boolean>}
   */
  async updatePassword(id, hashedPassword) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query(
        'UPDATE users SET password_hash = ? WHERE id = ?',
        [hashedPassword, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Store refresh token
   * @param {string} userId - User ID
   * @param {string} token - Refresh token
   * @param {Date} expiresAt - Expiry date
   * @returns {Promise<object>}
   */
  async storeRefreshToken(userId, token, expiresAt) {
    const connection = await pool.getConnection();
    try {
      const id = uuidv4();
      await connection.query(
        'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
        [id, userId, token, expiresAt]
      );
      return { id, userId, token, expiresAt };
    } catch (error) {
      console.error('Error storing refresh token:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get refresh token record
   * @param {string} token - Refresh token
   * @returns {Promise<object|null>}
   */
  async getRefreshToken(token) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        'SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > NOW()',
        [token]
      );
      if (rows.length === 0) return null;
      return rows[0];
    } catch (error) {
      console.error('Error getting refresh token:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Delete refresh token
   * @param {string} token - Refresh token
   * @returns {Promise<boolean>}
   */
  async deleteRefreshToken(token) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query(
        'DELETE FROM refresh_tokens WHERE token = ?',
        [token]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting refresh token:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = new UserRepository();
