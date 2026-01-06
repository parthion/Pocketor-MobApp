/**
 * User Model/Entity
 * Represents a user in the system
 */

class User {
  constructor(
    id,
    email,
    name,
    phone,
    emailVerified = false,
    phoneVerified = false,
    createdAt = new Date()
  ) {
    this.id = id;
    this.email = email;
    this.name = name;
    this.phone = phone;
    this.emailVerified = emailVerified;
    this.phoneVerified = phoneVerified;
    this.createdAt = createdAt;
  }

  /**
   * Convert database row to User object
   * @param {object} row - Database row
   * @returns {User} User instance
   */
  static fromDatabase(row) {
    return new User(
      row.id,
      row.email,
      row.name,
      row.phone,
      row.email_verified,
      row.phone_verified,
      row.created_at
    );
  }

  /**
   * Convert to JSON (for API response)
   * @returns {object} JSON object
   */
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      phone: this.phone,
      emailVerified: this.emailVerified,
      phoneVerified: this.phoneVerified,
      createdAt: this.createdAt,
    };
  }
}

module.exports = User;
