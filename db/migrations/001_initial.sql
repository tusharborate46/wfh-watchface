CREATE DATABASE IF NOT EXISTS wfh_watchface;
USE wfh_watchface;

CREATE TABLE IF NOT EXISTS employees (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('employee','manager','admin')),
  department VARCHAR(255),
  manager_id CHAR(36),
  created_at DATETIME NOT NULL DEFAULT NOW(),
  FOREIGN KEY (manager_id) REFERENCES employees(id)
);

CREATE TABLE IF NOT EXISTS face_embeddings (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  employee_id CHAR(36) NOT NULL,
  embedding_encrypted LONGBLOB NOT NULL,
  iv TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT NOW(),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS status_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  employee_id CHAR(36) NOT NULL,
  status ENUM('VERIFIED','AWAY','UNKNOWN_FACE','CAMERA_ERROR') NOT NULL,
  checked_at DATETIME NOT NULL DEFAULT NOW(),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS alerts (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  employee_id CHAR(36) NOT NULL,
  triggered_at DATETIME NOT NULL DEFAULT NOW(),
  acknowledged TINYINT(1) NOT NULL DEFAULT 0,
  acknowledged_at DATETIME,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

DROP PROCEDURE IF EXISTS create_index_if_not_exists;
DELIMITER //
CREATE PROCEDURE create_index_if_not_exists()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'status_logs'
      AND index_name = 'idx_status_logs_employee_checked'
  ) THEN
    CREATE INDEX idx_status_logs_employee_checked ON status_logs(employee_id, checked_at DESC);
  END IF;
END //
DELIMITER ;
CALL create_index_if_not_exists();
DROP PROCEDURE IF EXISTS create_index_if_not_exists;
