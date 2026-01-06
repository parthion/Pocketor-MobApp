/**
 * Collection Repository
 * Handles all database operations for collections
 */

const pool = require('../config/database');
const Collection = require('../models/Collection');
const { v4: uuidv4 } = require('uuid');

class CollectionRepository {
  /**
   * Get collection by ID with members and contributions
   * @param {string} id - Collection ID
   * @returns {Promise<Collection|null>}
   */
  async getById(id) {
    const connection = await pool.getConnection();
    try {
      // Get collection
      const [collectionRows] = await connection.query(
        'SELECT * FROM collections WHERE id = ?',
        [id]
      );
      
      if (collectionRows.length === 0) return null;
      
      const collection = Collection.fromDatabase(collectionRows[0]);
      
      // Get members for this collection
      const [memberRows] = await connection.query(
        `SELECT id, collection_id as collectionId, user_id as userId, name, email, phone, 
         role, joined_date as joinedDate, created_at as createdAt 
         FROM members WHERE collection_id = ?`,
        [id]
      );
      
      // Get contributions for this collection
      const [contributionRows] = await connection.query(
        `SELECT id, collection_id as collectionId, member_id as memberId, member_name as memberName,
         amount, contribution_date as contributionDate, contribution_type as contributionType,
         description, created_at as createdAt
         FROM contributions WHERE collection_id = ?
         ORDER BY contribution_date DESC`,
        [id]
      );
      
      // Attach members and contributions to collection
      const collectionData = collection.toJSON();
      collectionData.members = memberRows.map(row => ({
        id: row.id,
        collectionId: row.collectionId,
        userId: row.userId,
        name: row.name,
        email: row.email,
        phone: row.phone,
        role: row.role,
        joinedDate: row.joinedDate,
        createdAt: row.createdAt,
      }));
      
      collectionData.contributions = contributionRows.map(row => ({
        id: row.id,
        collectionId: row.collectionId,
        memberId: row.memberId,
        memberName: row.memberName,
        amount: parseFloat(row.amount),
        date: row.contributionDate,
        contributionType: row.contributionType,
        description: row.description,
        createdAt: row.createdAt,
      }));
      
      return collectionData;
    } catch (error) {
      console.error('Error getting collection by ID:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get collection by ID and User ID (for security - ensures user owns the collection)
   * Uses JOIN queries to fetch collection with members and contributions in a single efficient query
   * @param {string} id - Collection ID
   * @param {string} userId - User ID from JWT token
   * @returns {Promise<Object|null>}
   */
  async getByIdAndUserId(id, userId) {
    const connection = await pool.getConnection();
    try {
      // Single JOIN query to get collection with members and contributions
      // Only fetches if collection belongs to the logged-in user
      const [collectionRows] = await connection.query(
        `SELECT 
          c.id, c.user_id as userId, c.name, c.description, c.status,
          c.start_date as startDate, c.end_date as endDate, c.frequency,
          c.interest_rate as interestRate, c.total_amount as totalAmount,
          c.created_at as createdAt, c.updated_at as updatedAt
         FROM collections c
         WHERE c.id = ? AND c.user_id = ?
         LIMIT 1`,
        [id, userId]
      );
      
      if (collectionRows.length === 0) return null;
      
      const collectionData = collectionRows[0];
      
      // Get members for this collection using JOIN with user validation
      const [memberRows] = await connection.query(
        `SELECT 
          m.id, m.collection_id as collectionId, m.user_id as userId, 
          m.name, m.email, m.phone, m.role, m.joined_date as joinedDate, 
          m.created_at as createdAt
         FROM members m
         INNER JOIN collections c ON m.collection_id = c.id
         WHERE c.id = ? AND c.user_id = ?
         ORDER BY m.joined_date ASC`,
        [id, userId]
      );
      
      // Get contributions for this collection using JOIN with user validation
      const [contributionRows] = await connection.query(
        `SELECT 
          co.id, co.collection_id as collectionId, co.member_id as memberId,
          co.member_name as memberName, co.amount, co.contribution_date as contributionDate,
          co.contribution_type as contributionType, co.description, co.created_at as createdAt
         FROM contributions co
         INNER JOIN collections c ON co.collection_id = c.id
         WHERE c.id = ? AND c.user_id = ?
         ORDER BY co.contribution_date DESC`,
        [id, userId]
      );
      
      // Build the response object
      const result = {
        id: collectionData.id,
        name: collectionData.name,
        description: collectionData.description,
        status: collectionData.status,
        startDate: collectionData.startDate,
        endDate: collectionData.endDate,
        frequency: collectionData.frequency,
        interestRate: parseFloat(collectionData.interestRate) || 0,
        totalAmount: parseFloat(collectionData.totalAmount) || 0,
        createdAt: collectionData.createdAt,
        updatedAt: collectionData.updatedAt,
        members: memberRows.map(row => ({
          id: row.id,
          name: row.name,
          email: row.email,
          phone: row.phone,
          role: row.role,
          joinedDate: row.joinedDate,
        })),
        contributions: contributionRows.map(row => ({
          id: row.id,
          memberName: row.memberName,
          amount: parseFloat(row.amount) || 0,
          date: row.contributionDate,
          contributionType: row.contributionType,
          description: row.description,
        })),
      };
      
      return result;
    } catch (error) {
      console.error('Error getting collection by ID and User ID:', error);
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
