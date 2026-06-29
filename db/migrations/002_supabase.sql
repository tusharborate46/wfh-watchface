-- WFH WatchFace — Supabase PostgreSQL Schema
-- Run this in the Supabase SQL Editor for your project

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Managers table
CREATE TABLE IF NOT EXISTS managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  manager_code VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  department VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  employee_code VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  department VARCHAR(255),
  manager_id UUID REFERENCES managers(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Face embeddings (encrypted)
CREATE TABLE IF NOT EXISTS face_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  embedding_encrypted BYTEA NOT NULL,
  iv TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Status logs
CREATE TABLE IF NOT EXISTS status_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('VERIFIED','AWAY','UNKNOWN_FACE','CAMERA_ERROR')),
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Alerts (triggered on UNKNOWN_FACE)
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_status_logs_employee
  ON status_logs(employee_id, checked_at DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_employee
  ON alerts(employee_id, triggered_at DESC);

CREATE INDEX IF NOT EXISTS idx_face_embeddings_employee
  ON face_embeddings(employee_id, created_at DESC);
