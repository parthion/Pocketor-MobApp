/**
 * ProductConfig Repository
 * CRUD + versioning + approval for product_configs table
 */

const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

const makeEtag = (data) => crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');

class ProductConfigRepository {
  async create(userId, { name, json_schema }) {
    const conn = await pool.getConnection();
    try {
      const id = uuidv4();
      const etag = makeEtag({ name, json_schema, v: 1 });
      await conn.execute(
        'INSERT INTO product_configs (id, user_id, name, json_schema, version, status, created_by, etag) VALUES (?,?,?,?,1,"draft",?,?)',
        [id, userId, name, JSON.stringify(json_schema), userId, etag]
      );
      return this.getById(userId, id);
    } finally {
      conn.release();
    }
  }

  async getAll(userId) {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.execute(
        'SELECT * FROM product_configs WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );
      return rows.map(this._format);
    } finally {
      conn.release();
    }
  }

  async getById(userId, id) {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.execute(
        'SELECT * FROM product_configs WHERE id = ? AND user_id = ?',
        [id, userId]
      );
      return rows.length ? this._format(rows[0]) : null;
    } finally {
      conn.release();
    }
  }

  async update(userId, id, { name, json_schema }) {
    const conn = await pool.getConnection();
    try {
      // bump version and reset to draft on each edit
      const existing = await this.getById(userId, id);
      if (!existing) return null;
      const newVersion = existing.version + 1;
      const etag = makeEtag({ name, json_schema, v: newVersion });
      await conn.execute(
        'UPDATE product_configs SET name=?, json_schema=?, version=?, status="draft", etag=? WHERE id=? AND user_id=?',
        [name, JSON.stringify(json_schema), newVersion, etag, id, userId]
      );
      return this.getById(userId, id);
    } finally {
      conn.release();
    }
  }

  async approve(userId, id) {
    const conn = await pool.getConnection();
    try {
      const [result] = await conn.execute(
        'UPDATE product_configs SET status="active", approved_by=?, approved_at=NOW() WHERE id=? AND user_id=?',
        [userId, id, userId]
      );
      return result.affectedRows > 0;
    } finally {
      conn.release();
    }
  }

  async archive(userId, id) {
    const conn = await pool.getConnection();
    try {
      const [result] = await conn.execute(
        'UPDATE product_configs SET status="archived" WHERE id=? AND user_id=?',
        [id, userId]
      );
      return result.affectedRows > 0;
    } finally {
      conn.release();
    }
  }

  async delete(userId, id) {
    const conn = await pool.getConnection();
    try {
      const [result] = await conn.execute(
        'DELETE FROM product_configs WHERE id=? AND user_id=?',
        [id, userId]
      );
      return result.affectedRows > 0;
    } finally {
      conn.release();
    }
  }

  async getFeatureFlag(userId, flagKey) {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.execute(
        'SELECT enabled FROM feature_flags WHERE user_id=? AND flag_key=?',
        [userId, flagKey]
      );
      return rows.length ? Boolean(rows[0].enabled) : false;
    } finally {
      conn.release();
    }
  }

  _format(row) {
    return {
      id:         row.id,
      userId:     row.user_id,
      name:       row.name,
      jsonSchema: typeof row.json_schema === 'string' ? JSON.parse(row.json_schema) : row.json_schema,
      version:    row.version,
      status:     row.status,
      createdBy:  row.created_by,
      approvedBy: row.approved_by,
      approvedAt: row.approved_at,
      etag:       row.etag,
      createdAt:  row.created_at,
      updatedAt:  row.updated_at,
    };
  }
}

module.exports = new ProductConfigRepository();
