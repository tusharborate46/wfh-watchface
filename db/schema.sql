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
  INDEX idx_employees_manager_name (manager_id, name),
  CONSTRAINT fk_employees_manager FOREIGN KEY (manager_id) REFERENCES employees(id)
);

CREATE TABLE IF NOT EXISTS face_embeddings (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  employee_id CHAR(36) NOT NULL,
  embedding_encrypted LONGBLOB NOT NULL,
  iv TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT NOW(),
  UNIQUE KEY uq_face_embeddings_employee (employee_id),
  INDEX idx_face_embeddings_employee_created (employee_id, created_at),
  CONSTRAINT fk_face_embeddings_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS status_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  employee_id CHAR(36) NOT NULL,
  status ENUM('VERIFIED','AWAY','UNKNOWN_FACE','CAMERA_ERROR') NOT NULL,
  checked_at DATETIME NOT NULL DEFAULT NOW(),
  INDEX idx_status_logs_employee_checked (employee_id, checked_at),
  INDEX idx_status_logs_checked (checked_at),
  CONSTRAINT fk_status_logs_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS alerts (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  employee_id CHAR(36) NOT NULL,
  triggered_at DATETIME NOT NULL DEFAULT NOW(),
  acknowledged TINYINT(1) NOT NULL DEFAULT 0,
  acknowledged_at DATETIME,
  INDEX idx_alerts_triggered (triggered_at),
  INDEX idx_alerts_employee_triggered (employee_id, triggered_at),
  CONSTRAINT fk_alerts_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);
