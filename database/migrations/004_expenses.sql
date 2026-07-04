-- Migration 004: Expenses Table
-- Tracks business expenses per user (agent/admin)

CREATE TABLE IF NOT EXISTS expenses (
  id           VARCHAR(36)    PRIMARY KEY,
  user_id      VARCHAR(36)    NOT NULL,
  title        VARCHAR(255)   NOT NULL,
  amount       DECIMAL(15,2)  NOT NULL CHECK (amount > 0),
  category     VARCHAR(50)    NOT NULL DEFAULT 'Other',
  note         TEXT,
  expense_date DATE           NOT NULL,
  created_at   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_expenses_user   (user_id),
  INDEX idx_expenses_date   (user_id, expense_date),
  INDEX idx_expenses_cat    (user_id, category)
);
