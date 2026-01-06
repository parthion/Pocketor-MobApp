/**
 * Collection Repository
 * Handles all database operations for collections
 */

const pool = require('../config/database');
const Collection = require('../models/Collection');
const { v4: uuidv4 } = require('uuid');

class CollectionRepository {
  /**
   * Get collection by ID
   * @param {string} id - Collection ID
   * @returns {Promise<Collection|null>}
   */
  async getById(id) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        'SELECT * FROM collections WHERE id = ?',
        [id]
      );
      if (rows.length === 0) return null;
      return Collection.fromDatabase(rows[0]);
    } catch (error) {
      console.error('Error getting collection by ID:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get all collections by user ID
   * @param {string} userId - User ID
   * @param {number} page - Page number
   * @param {number} limit - Results per page
   * @returns {Promise<Array>}
   */
  async getByUserId(userId, page = 1, limit = 10) {
    const connection = await pool.getConnection();
    try {
      const offset = (page - 1) * limit;
      const [rows] = await connection.query(
        'SELECT * FROM collections WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [userId, limit, offset]
      );
      return rows.map(row => Collection.fromDatabase(row));
    } catch (error) {
      console.error('Error getting collections by user ID:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get all collections
   * @param {number} page - Page number
   * @param {number} limit - Results per page
   * @returns {Promise<Array>}
   */
  async getAll(page = 1, limit = 10) {
    const connection = await pool.getConnection();
    try {
      const offset = (page - 1) * limit;
      const [rows] = await connection.query(
        'SELECT * FROM collections ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );
      return rows.map(row => Collection.fromDatabase(row));
    } catch (error) {
      console.error('Error getting all collections:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Create new collection
   * @param {object} collectionData - Collection data
   * @returns {Promise<Collection>}
   */
  async create(collectionData) {
    const connection = await pool.getConnection();
    try {
      const id = uuidv4();

      await connection.query(
        `INSERT INTO collections 
        (id, user_id, name, description, status, start_date, end_date, frequency, interest_rate, total_amount) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          collectionData.userId,
          collectionData.name,
          collectionData.description || '',
          collectionData.status || 'active',
          collectionData.startDate,
          collectionData.endDate || null,
          collectionData.frequency,
          collectionData.interestRate || 0,
          collectionData.totalAmount,
        ]
      );

      return await this.getById(id);
    } catch (error) {
      console.error('Error creating collection:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Update collection
   * @param {string} id - Collection ID
   * @param {object} collectionData - Updated collection data
   * @returns {Promise<Collection|null>}
   */
  async update(id, collectionData) {
    const connection = await pool.getConnection();
    try {
      const updates = [];
      const values = [];

      Object.keys(collectionData).forEach(key => {
        if (collectionData[key] !== undefined && collectionData[key] !== null) {
          updates.push(`${key} = ?`);
          values.push(collectionData[key]);
        }
      });

      if (updates.length === 0) return null;

      values.push(id);
      const query = `UPDATE collections SET ${updates.join(', ')} WHERE id = ?`;
      await connection.query(query, values);

      return await this.getById(id);
    } catch (error) {
      console.error('Error updating collection:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Delete collection
   * @param {string} id - Collection ID
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    const connection = await pool.getConnection();
    try {
      const result = await connection.query(
        'DELETE FROM collections WHERE id = ?',
        [id]
      );
      return result[0].affectedRows > 0;
    } catch (error) {
      console.error('Error deleting collection:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get total collections count
   * @returns {Promise<number>}
   */
  async getTotalCount() {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        'SELECT COUNT(*) as count FROM collections'
      );
      return rows[0].count;
    } catch (error) {
      console.error('Error getting total count:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get collections by status
   * @param {string} userId - User ID
   * @param {string} status - Collection status
   * @returns {Promise<Array>}
   */
  async getByStatus(userId, status) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        'SELECT * FROM collections WHERE user_id = ? AND status = ? ORDER BY created_at DESC',
        [userId, status]
      );
      return rows.map(row => Collection.fromDatabase(row));
    } catch (error) {
      console.error('Error getting collections by status:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = new CollectionRepository();
