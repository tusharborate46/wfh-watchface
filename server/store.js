/**
 * store.js — PostgreSQL-backed data access layer
 * Replaces the old JSON flat-file store.
 * All functions maintain the same exported signatures as before.
 */
import { query } from './db.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

// ─── Employee Lookups ─────────────────────────────────────────────────────────

export async function findEmployeeByCode(code) {
  const { rows } = await query(
    'SELECT * FROM employees WHERE employee_code = $1 LIMIT 1',
    [String(code).trim()]
  );
  return rows[0] || null;
}

export async function findEmployeeByEmail(email) {
  const { rows } = await query(
    'SELECT * FROM employees WHERE LOWER(email) = LOWER($1) LIMIT 1',
    [String(email).trim()]
  );
  return rows[0] || null;
}

export async function findEmployeeById(employeeId) {
  const { rows } = await query(
    'SELECT * FROM employees WHERE id = $1 LIMIT 1',
    [employeeId]
  );
  return rows[0] || null;
}

export async function createEmployee({ name, email, employee_code, password_hash, department, manager_id }) {
  const { rows } = await query(
    `INSERT INTO employees (name, email, employee_code, password_hash, department, manager_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, email, employee_code, department, manager_id, created_at`,
    [name, email, employee_code, password_hash, department || null, manager_id || null]
  );
  return rows[0];
}

export async function updateEmployeePassword(id, passwordHash) {
  await query(
    'UPDATE employees SET password_hash = $1 WHERE id = $2',
    [passwordHash, id]
  );
}

// ─── Manager Lookups ──────────────────────────────────────────────────────────

export async function findManagerByCode(code) {
  const { rows } = await query(
    'SELECT * FROM managers WHERE manager_code = $1 LIMIT 1',
    [String(code).trim()]
  );
  return rows[0] || null;
}

export async function findManagerByEmail(email) {
  const { rows } = await query(
    'SELECT * FROM managers WHERE LOWER(email) = LOWER($1) LIMIT 1',
    [String(email).trim()]
  );
  return rows[0] || null;
}

export async function findManagerById(managerId) {
  const { rows } = await query(
    'SELECT * FROM managers WHERE id = $1 LIMIT 1',
    [managerId]
  );
  return rows[0] || null;
}

export async function createManager({ name, email, manager_code, password_hash, department }) {
  const { rows } = await query(
    `INSERT INTO managers (name, email, manager_code, password_hash, department)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, manager_code, department, created_at`,
    [name, email, manager_code, password_hash, department || null]
  );
  return rows[0];
}

// ─── Access Control ───────────────────────────────────────────────────────────

export async function canUserAccessEmployee(user, employeeId) {
  if (!employeeId) return false;
  // employee can only access their own data
  if (user.role === 'employee') return user.employeeId === employeeId;
  // manager can access employees they manage
  if (user.role === 'manager') {
    const { rows } = await query(
      'SELECT id FROM employees WHERE id = $1 AND manager_id = $2',
      [employeeId, user.managerId]
    );
    return rows.length > 0;
  }
  return false;
}

// ─── Enrollment ───────────────────────────────────────────────────────────────

export async function saveEnrollment(employeeId, encrypted, iv) {
  // encrypted is a Buffer
  const encryptedHex = Buffer.isBuffer(encrypted)
    ? encrypted
    : Buffer.from(encrypted);

  // Delete existing enrollment first
  await query('DELETE FROM face_embeddings WHERE employee_id = $1', [employeeId]);

  await query(
    `INSERT INTO face_embeddings (employee_id, embedding_encrypted, iv)
     VALUES ($1, $2, $3)`,
    [employeeId, encryptedHex, iv]
  );

  return { ok: true };
}

export async function getEnrollment(employeeId) {
  const { rows } = await query(
    `SELECT embedding_encrypted, iv FROM face_embeddings
     WHERE employee_id = $1
     ORDER BY created_at DESC LIMIT 1`,
    [employeeId]
  );
  if (!rows[0]) return null;
  return {
    embedding_encrypted: rows[0].embedding_encrypted, // already a Buffer via pg
    iv: rows[0].iv
  };
}

export async function deleteEnrollment(employeeId) {
  await query('DELETE FROM face_embeddings WHERE employee_id = $1', [employeeId]);
  return { ok: true };
}

export async function hasEnrollment(employeeId) {
  const { rows } = await query(
    'SELECT id FROM face_embeddings WHERE employee_id = $1 LIMIT 1',
    [employeeId]
  );
  return rows.length > 0;
}

// ─── Status Logs ──────────────────────────────────────────────────────────────

export async function addStatus({ employeeId, status, timestamp }) {
  const checkedAt = timestamp && !Number.isNaN(Date.parse(timestamp))
    ? new Date(timestamp).toISOString()
    : new Date().toISOString();

  const { rows } = await query(
    `INSERT INTO status_logs (employee_id, status, checked_at)
     VALUES ($1, $2, $3)
     RETURNING id, employee_id, status, checked_at`,
    [employeeId, status, checkedAt]
  );

  const log = rows[0];

  if (status === 'UNKNOWN_FACE') {
    await query(
      `INSERT INTO alerts (employee_id, triggered_at)
       VALUES ($1, $2)`,
      [employeeId, checkedAt]
    );
  }

  return log;
}

export async function getStatusHistory(employeeId) {
  const { rows } = await query(
    `SELECT id, employee_id, status, checked_at
     FROM status_logs
     WHERE employee_id = $1
       AND checked_at >= NOW()::date
     ORDER BY checked_at DESC`,
    [employeeId]
  );
  return rows;
}

// ─── Employee + Manager info ───────────────────────────────────────────────────

export async function getEmployeeWithManager(employeeId) {
  const { rows } = await query(
    `SELECT e.id, e.name, e.email, e.department, e.manager_id,
            m.name AS manager_name, m.email AS manager_email
     FROM employees e
     LEFT JOIN managers m ON m.id = e.manager_id
     WHERE e.id = $1`,
    [employeeId]
  );
  if (!rows[0]) return null;
  const row = rows[0];
  return {
    employee: { id: row.id, name: row.name, email: row.email, department: row.department },
    manager: row.manager_name ? { name: row.manager_name, email: row.manager_email } : null
  };
}

// ─── Manager-scoped employee list ─────────────────────────────────────────────

export async function getEmployeesForManager(managerId) {
  const { rows } = await query(
    `SELECT e.id, e.name, e.email, e.employee_code, e.department, e.created_at,
            EXISTS(SELECT 1 FROM face_embeddings fe WHERE fe.employee_id = e.id) AS enrolled
     FROM employees e
     WHERE e.manager_id = $1
     ORDER BY e.name`,
    [managerId]
  );
  return rows;
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

export async function getAlertsForManager(managerId) {
  const { rows } = await query(
    `SELECT a.id, a.employee_id, a.triggered_at, a.acknowledged, a.acknowledged_at,
            e.name AS employee_name, e.department
     FROM alerts a
     JOIN employees e ON e.id = a.employee_id
     WHERE e.manager_id = $1
     ORDER BY a.triggered_at DESC
     LIMIT 200`,
    [managerId]
  );
  return rows;
}

export async function acknowledgeAlert(alertId, managerId) {
  // Verify the alert belongs to a manager's employee
  const { rows } = await query(
    `UPDATE alerts a
     SET acknowledged = TRUE, acknowledged_at = NOW()
     FROM employees e
     WHERE a.id = $1 AND a.employee_id = e.id AND e.manager_id = $2
     RETURNING a.id`,
    [alertId, managerId]
  );
  if (!rows[0]) throw httpError(404, 'Alert not found');
  return { ok: true };
}

// ─── Dashboard Snapshot ───────────────────────────────────────────────────────

export async function getDashboardSnapshot(user) {
  // user has { role, managerId }
  const employees = await getEmployeesForManager(user.managerId);

  const employeeIds = employees.map((e) => e.id);

  let statusMap = {};
  if (employeeIds.length > 0) {
    // Get latest status for today for each employee
    const { rows: statusRows } = await query(
      `SELECT DISTINCT ON (employee_id) employee_id, status, checked_at
       FROM status_logs
       WHERE employee_id = ANY($1::uuid[])
         AND checked_at >= NOW()::date
       ORDER BY employee_id, checked_at DESC`,
      [employeeIds]
    );
    statusMap = Object.fromEntries(statusRows.map((r) => [r.employee_id, r]));
  }

  const enriched = employees.map((e) => {
    const latest = statusMap[e.id];
    return {
      id: e.id,
      name: e.name,
      department: e.department,
      enrolled: e.enrolled,
      current_status: latest?.status || 'INACTIVE',
      last_checked_at: latest?.checked_at || null
    };
  });

  let activity = [];
  if (employeeIds.length > 0) {
    const { rows: actRows } = await query(
      `SELECT sl.id, sl.checked_at, sl.status, e.name
       FROM status_logs sl
       JOIN employees e ON e.id = sl.employee_id
       WHERE sl.employee_id = ANY($1::uuid[])
         AND sl.checked_at >= NOW()::date
       ORDER BY sl.checked_at DESC
       LIMIT 50`,
      [employeeIds]
    );
    activity = actRows;
  }

  let alertsToday = 0;
  if (employeeIds.length > 0) {
    const { rows: alertRows } = await query(
      `SELECT COUNT(*) AS cnt FROM alerts
       WHERE employee_id = ANY($1::uuid[])
         AND triggered_at >= NOW()::date`,
      [employeeIds]
    );
    alertsToday = parseInt(alertRows[0]?.cnt || '0', 10);
  }

  return {
    employees: enriched.sort((a, b) => a.name.localeCompare(b.name)),
    activity,
    metrics: {
      verified: enriched.filter((e) => e.current_status === 'VERIFIED').length,
      away: enriched.filter((e) => e.current_status === 'AWAY').length,
      unknown: enriched.filter((e) => e.current_status === 'UNKNOWN_FACE').length,
      inactive: enriched.filter((e) => e.current_status === 'INACTIVE').length,
      alertsToday
    }
  };
}
