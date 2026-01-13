-- Pocketor Mobile App - Loan Collections Schema
-- Created: 10 January 2026
-- This schema supports the loan/finance collection management system

-- ============================================
-- 1. LINES TABLE (Loan Products)
-- ============================================
CREATE TABLE IF NOT EXISTS `lines` (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  line_name VARCHAR(255) NOT NULL,
  line_type VARCHAR(50) NOT NULL, -- 'Daily', 'Weekly', 'Monthly'
  interest_per_hundred DECIMAL(10, 2) NOT NULL,
  bad_loan_days INT DEFAULT 0,
  bill_amount_per_hundred DECIMAL(10, 2) DEFAULT 0,
  close_loan_manually BOOLEAN DEFAULT false,
  enable_penalty BOOLEAN DEFAULT false,
  keep_paid_customer_in_completed_tab BOOLEAN DEFAULT false,
  no_of_installs INT DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_line_type (line_type),
  INDEX idx_created_at (created_at)
);

-- ============================================
-- 2. AREAS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `areas` (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  line_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (line_id) REFERENCES `lines`(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_line_id (line_id),
  INDEX idx_created_at (created_at)
);

-- ============================================
-- 3. CUSTOMERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `customers` (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  line_id VARCHAR(36) NOT NULL,
  area_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  status ENUM('active', 'inactive', 'completed', 'defaulted') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (line_id) REFERENCES `lines`(id) ON DELETE CASCADE,
  FOREIGN KEY (area_id) REFERENCES `areas`(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_line_id (line_id),
  INDEX idx_area_id (area_id),
  INDEX idx_status (status),
  INDEX idx_phone (phone),
  INDEX idx_created_at (created_at)
);

-- ============================================
-- 4. LOANS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `loans` (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  customer_id VARCHAR(36) NOT NULL,
  line_id VARCHAR(36) NOT NULL,
  area_id VARCHAR(36) NOT NULL,
  principal_amount DECIMAL(15, 2) NOT NULL,
  interest_rate DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(15, 2) NOT NULL,
  installment_amount DECIMAL(15, 2) NOT NULL,
  no_of_installs INT NOT NULL,
  paid_amount DECIMAL(15, 2) DEFAULT 0.00,
  balance_amount DECIMAL(15, 2) NOT NULL,
  status ENUM('active', 'completed', 'defaulted') DEFAULT 'active',
  start_date DATE NOT NULL,
  expected_end_date DATE,
  actual_end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES `customers`(id) ON DELETE CASCADE,
  FOREIGN KEY (line_id) REFERENCES `lines`(id) ON DELETE CASCADE,
  FOREIGN KEY (area_id) REFERENCES `areas`(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_customer_id (customer_id),
  INDEX idx_line_id (line_id),
  INDEX idx_area_id (area_id),
  INDEX idx_status (status),
  INDEX idx_start_date (start_date),
  INDEX idx_created_at (created_at)
);

-- ============================================
-- 5. PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `payments` (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  loan_id VARCHAR(36) NOT NULL,
  customer_id VARCHAR(36) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_type ENUM('installment', 'partial', 'full', 'penalty') DEFAULT 'installment',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (loan_id) REFERENCES `loans`(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES `customers`(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_loan_id (loan_id),
  INDEX idx_customer_id (customer_id),
  INDEX idx_payment_date (payment_date),
  INDEX idx_created_at (created_at)
);

-- ============================================
-- CREATE COMPOSITE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_areas_line_user ON `areas`(line_id, user_id);
CREATE INDEX idx_customers_area_line ON `customers`(area_id, line_id, user_id);
CREATE INDEX idx_loans_customer_status ON `loans`(customer_id, status);
CREATE INDEX idx_payments_loan_date ON `payments`(loan_id, payment_date);

-- ============================================
-- END OF LOAN COLLECTIONS SCHEMA
-- ============================================
