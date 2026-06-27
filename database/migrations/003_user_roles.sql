-- Migration 003: Add admin/agent role support to users
-- Run in MySQL Workbench: SOURCE database/migrations/003_user_roles.sql;

USE pocketor;

ALTER TABLE users
  ADD COLUMN role ENUM('admin','agent') NOT NULL DEFAULT 'agent',
  ADD COLUMN created_by VARCHAR(36) NULL AFTER phone,
  ADD CONSTRAINT fk_users_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_by ON users(created_by);
