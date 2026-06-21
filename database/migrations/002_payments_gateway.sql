-- Migration 002: Gateway Payments Table
-- Apply AFTER migration 001
-- Run in MySQL Workbench: SOURCE database/migrations/002_payments_gateway.sql;

USE pocketor;

-- ============================================
-- 1. GATEWAY PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `gateway_payments` (
  id               VARCHAR(36)   PRIMARY KEY,
  user_id          VARCHAR(36)   NOT NULL,
  loan_id          VARCHAR(36)   NOT NULL,
  customer_id      VARCHAR(36)   NOT NULL,
  idempotency_key  VARCHAR(100)  NOT NULL UNIQUE,
  provider         VARCHAR(50)   NOT NULL,  -- 'razorpay','stripe','paystack'
  provider_ref     VARCHAR(255)  NULL,      -- provider's transaction/order id
  amount           DECIMAL(15,2) NOT NULL,
  currency         VARCHAR(10)   NOT NULL DEFAULT 'INR',
  status           ENUM('initiated','pending','success','failed','refunded') DEFAULT 'initiated',
  webhook_verified BOOLEAN       DEFAULT FALSE,
  webhook_payload  JSON          NULL,
  metadata         JSON          NULL,
  created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(id)      ON DELETE CASCADE,
  FOREIGN KEY (loan_id)     REFERENCES `loans`(id)    ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES `customers`(id) ON DELETE CASCADE,
  INDEX idx_gp_user_id    (user_id),
  INDEX idx_gp_loan_id    (loan_id),
  INDEX idx_gp_status     (status),
  INDEX idx_gp_provider   (provider, provider_ref),
  INDEX idx_gp_created    (created_at)
);

-- ============================================
-- END OF MIGRATION 002
-- ============================================
