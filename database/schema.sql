-- ============================================================
-- FinApp - Esquema MySQL
-- Migración desde Firebase/Firestore
-- ============================================================

CREATE DATABASE IF NOT EXISTS finapp
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE finapp;

-- -----------------------------------------------------------
-- 1. users
-- -----------------------------------------------------------
CREATE TABLE users (
  id          CHAR(36)     NOT NULL PRIMARY KEY,          -- UUID
  email       VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name        VARCHAR(120) NOT NULL DEFAULT '',
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 2. accounts
-- -----------------------------------------------------------
CREATE TABLE accounts (
  id              CHAR(36)     NOT NULL PRIMARY KEY,
  user_id         CHAR(36)     NOT NULL,
  name            VARCHAR(120) NOT NULL,
  type            ENUM('cash','bank','savings','other') NOT NULL DEFAULT 'cash',
  initial_balance DECIMAL(14,2) NOT NULL DEFAULT 0,
  color           VARCHAR(7)   DEFAULT '#12C2A2',
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_accounts_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 3. products
-- -----------------------------------------------------------
CREATE TABLE products (
  id          CHAR(36)      NOT NULL PRIMARY KEY,
  user_id     CHAR(36)      NOT NULL,
  name        VARCHAR(100)  NOT NULL,
  stock       INT           NOT NULL DEFAULT 0,
  price       DECIMAL(14,2) NOT NULL DEFAULT 0,
  cost        DECIMAL(14,2) NOT NULL DEFAULT 0,
  min_stock   INT           DEFAULT 5,
  category    VARCHAR(80)   DEFAULT '',
  unit        VARCHAR(40)   DEFAULT 'Unidad',
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_products_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 4. movements
-- -----------------------------------------------------------
CREATE TABLE movements (
  id            CHAR(36)      NOT NULL PRIMARY KEY,
  user_id       CHAR(36)      NOT NULL,
  type          ENUM('ingreso','gasto') NOT NULL,
  amount        DECIMAL(14,2) NOT NULL,
  category      VARCHAR(80)   NOT NULL DEFAULT '',
  description   VARCHAR(200)  DEFAULT '',
  date          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  account_id    CHAR(36)      DEFAULT NULL,
  customer_id   CHAR(36)      DEFAULT NULL,
  supplier_id   CHAR(36)      DEFAULT NULL,
  payment_method ENUM('cash','credit','bank') DEFAULT 'cash',
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)   REFERENCES users(id)     ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
  INDEX idx_movements_user (user_id),
  INDEX idx_movements_date (date),
  INDEX idx_movements_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 5. movement_items  (items dentro de una venta/compra)
-- -----------------------------------------------------------
CREATE TABLE movement_items (
  id          CHAR(36)      NOT NULL PRIMARY KEY,
  movement_id CHAR(36)      NOT NULL,
  product_id  CHAR(36)      DEFAULT NULL,
  quantity    INT           NOT NULL DEFAULT 1,
  price       DECIMAL(14,2) NOT NULL DEFAULT 0,
  cost        DECIMAL(14,2) DEFAULT 0,
  FOREIGN KEY (movement_id) REFERENCES movements(id) ON DELETE CASCADE,
  INDEX idx_movement_items_movement (movement_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 6. customers
-- -----------------------------------------------------------
CREATE TABLE customers (
  id                CHAR(36)     NOT NULL PRIMARY KEY,
  user_id           CHAR(36)     NOT NULL,
  name              VARCHAR(100) NOT NULL,
  email             VARCHAR(255) DEFAULT '',
  phone             VARCHAR(20)  DEFAULT '',
  accepted_receipt  TINYINT(1)   NOT NULL DEFAULT 0,
  accepted_promotions TINYINT(1) NOT NULL DEFAULT 0,
  last_updated      TIMESTAMP    NULL,
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_customers_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 7. suppliers
-- -----------------------------------------------------------
CREATE TABLE suppliers (
  id         CHAR(36)     NOT NULL PRIMARY KEY,
  user_id    CHAR(36)     NOT NULL,
  name       VARCHAR(100) NOT NULL,
  phone      VARCHAR(20)  DEFAULT '',
  email      VARCHAR(255) DEFAULT '',
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_suppliers_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 8. accounts_payable
-- -----------------------------------------------------------
CREATE TABLE accounts_payable (
  id            CHAR(36)      NOT NULL PRIMARY KEY,
  user_id       CHAR(36)      NOT NULL,
  supplier_id   CHAR(36)      DEFAULT NULL,
  supplier_name VARCHAR(120)  NOT NULL,
  amount        DECIMAL(14,2) NOT NULL,
  paid_amount   DECIMAL(14,2) NOT NULL DEFAULT 0,
  date          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  due_date      DATE          DEFAULT NULL,
  status        ENUM('pending','partial','paid') NOT NULL DEFAULT 'pending',
  description   VARCHAR(200)  DEFAULT '',
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_ap_user (user_id),
  INDEX idx_ap_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 9. accounts_receivable
-- -----------------------------------------------------------
CREATE TABLE accounts_receivable (
  id            CHAR(36)      NOT NULL PRIMARY KEY,
  user_id       CHAR(36)      NOT NULL,
  customer_id   CHAR(36)      DEFAULT NULL,
  customer_name VARCHAR(120)  NOT NULL,
  amount        DECIMAL(14,2) NOT NULL,
  paid_amount   DECIMAL(14,2) NOT NULL DEFAULT 0,
  date          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  due_date      DATE          DEFAULT NULL,
  status        ENUM('pending','partial','paid') NOT NULL DEFAULT 'pending',
  description   VARCHAR(200)  DEFAULT '',
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_ar_user (user_id),
  INDEX idx_ar_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 10. lesson_progress
-- -----------------------------------------------------------
CREATE TABLE lesson_progress (
  id         CHAR(36)     NOT NULL PRIMARY KEY,
  user_id    CHAR(36)     NOT NULL,
  lesson_id  VARCHAR(80)  NOT NULL,
  status     VARCHAR(20)  NOT NULL DEFAULT 'pending',
  progress   TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_lp_user (user_id),
  UNIQUE KEY uq_lesson_user (user_id, lesson_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 11. sessions  (control single-device)
-- -----------------------------------------------------------
CREATE TABLE sessions (
  id              CHAR(36)     NOT NULL PRIMARY KEY,
  user_id         CHAR(36)     NOT NULL,
  active_session_id VARCHAR(80) DEFAULT NULL,
  last_login      TIMESTAMP    NULL,
  device          VARCHAR(255) DEFAULT '',
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sessions_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 12. sync_queue  (cola offline-first)
-- -----------------------------------------------------------
CREATE TABLE sync_queue (
  id          CHAR(36)      NOT NULL PRIMARY KEY,
  user_id     CHAR(36)      NOT NULL,
  table_name  VARCHAR(80)   NOT NULL,
  operation   ENUM('INSERT','UPDATE','DELETE') NOT NULL,
  payload     JSON          NOT NULL,
  synced_at   TIMESTAMP     NULL DEFAULT NULL,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sync_user (user_id),
  INDEX idx_sync_synced (synced_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
