/**
 * Collection Model/Entity
 * Represents a collection (saving group) in the system
 */

class Collection {
  constructor(
    id,
    userId,
    name,
    description = '',
    status = 'active',
    startDate = new Date(),
    endDate = null,
    frequency = 'monthly',
    interestRate = 0,
    totalAmount = 0,
    createdAt = new Date()
  ) {
    this.id = id;
    this.userId = userId;
    this.name = name;
    this.description = description;
    this.status = status;
    this.startDate = startDate;
    this.endDate = endDate;
    this.frequency = frequency;
    this.interestRate = interestRate;
    this.totalAmount = totalAmount;
    this.createdAt = createdAt;
  }

  /**
   * Convert database row to Collection object
   * @param {object} row - Database row
   * @returns {Collection} Collection instance
   */
  static fromDatabase(row) {
    return new Collection(
      row.id,
      row.user_id,
      row.name,
      row.description,
      row.status,
      row.start_date,
      row.end_date,
      row.frequency,
      row.interest_rate,
      row.total_amount,
      row.created_at
    );
  }

  /**
   * Convert to JSON (for API response)
   * Never expose userId or id to frontend for security
   * @returns {object} JSON object
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      status: this.status,
      startDate: this.startDate,
      endDate: this.endDate,
      frequency: this.frequency,
      interestRate: this.interestRate,
      totalAmount: this.totalAmount,
      createdAt: this.createdAt,
    };
  }
}

module.exports = Collection;
