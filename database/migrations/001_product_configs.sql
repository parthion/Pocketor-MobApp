-- Migration 001: Product Configs, Feature Flags, Ledger Entries
-- Apply AFTER schema.sql and loan-collections-schema.sql
-- Run in MySQL Workbench: SOURCE database/migrations/001_product_configs.sql;

USE pocketor;

-- ============================================
-- 1. PRODUCT CONFIGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `product_configs` (
  id           VARCHAR(36)  PRIMARY KEY,
  user_id      VARCHAR(36)  NOT NULL,
  name         VARCHAR(255) NOT NULL,
  json_schema  JSON         NOT NULL,
  version      INT          NOT NULL DEFAULT 1,
  status       ENUM('draft','active','archived') DEFAULT 'draft',
  created_by   VARCHAR(36)  NOT NULL,
  approved_by  VARCHAR(36)  NULL,
  approved_at  DATETIME     NULL,
  etag         VARCHAR(64)  NOT NULL,
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_pc_user_id (user_id),
  INDEX idx_pc_status  (status),
  INDEX idx_pc_version (user_id, version)
);

-- ============================================
-- 2. FEATURE FLAGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `feature_flags` (
  id         VARCHAR(36)  PRIMARY KEY,
  user_id    VARCHAR(36)  NOT NULL,
  flag_key   VARCHAR(100) NOT NULL,
  enabled    BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_flag_per_user (user_id, flag_key),
  INDEX idx_ff_user_id (user_id)
);

-- Seed default flags for all existing users (safe to re-run)
INSERT IGNORE INTO `feature_flags` (id, user_id, flag_key, enabled)
SELECT UUID(), id, 'product_configs_enabled', FALSE FROM users;

INSERT IGNORE INTO `feature_flags` (id, user_id, flag_key, enabled)
SELECT UUID(), id, 'payment_gateway_enabled', FALSE FROM users;

-- ============================================
-- 3. LEDGER ENTRIES TABLE (double-entry)
-- ============================================
CREATE TABLE IF NOT EXISTS `ledger_entries` (
  id          VARCHAR(36)               PRIMARY KEY,
  user_id     VARCHAR(36)               NOT NULL,
  ref_type    VARCHAR(50)               NOT NULL,  -- 'payment','adjustment','fee'
  ref_id      VARCHAR(36)               NOT NULL,  -- id from payments or loans
  entry_type  ENUM('debit','credit')    NOT NULL,
  account     VARCHAR(100)              NOT NULL,  -- 'cash','loan_receivable','interest_income'
  amount      DECIMAL(15,2)             NOT NULL,
  description TEXT,
  created_at  TIMESTAMP                 DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_le_user_id (user_id),
  INDEX idx_le_ref     (ref_type, ref_id),
  INDEX idx_le_account (user_id, account),
  INDEX idx_le_created (created_at)
);

-- ============================================
-- END OF MIGRATION 001
-- ============================================
