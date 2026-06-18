import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DATA_FILE = path.join(__dirname, 'data', 'wfh-watchface.json');
const DATA_FILE = process.env.FILE_DB_PATH || DEFAULT_DATA_FILE;

const MANAGER_ID = '88888888-8888-4888-a888-888888888888';
const EMPLOYEE_ID = '11111111-1111-4111-a111-111111111111';
const ADMIN_ID = '99999999-9999-4999-a999-999999999999';

let writeQueue = Promise.resolve();

function nowIso() {
  return new Date().toISOString();
}

function emptyStore() {
  const createdAt = nowIso();
  return {
    employees: [
      {
        id: MANAGER_ID,
        name: 'Bob Manager',
        email: 'manager@example.com',
        role: 'manager',
        department: 'Engineering',
        manager_id: null,
        created_at: createdAt
      },
      {
        id: EMPLOYEE_ID,
        name: 'Alice Employee',
        email: 'employee@example.com',
        role: 'employee',
        department: 'Engineering',
        manager_id: MANAGER_ID,
        created_at: createdAt
      },
      {
        id: ADMIN_ID,
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        department: 'Operations',
        manager_id: null,
        created_at: createdAt
      }
    ],
    face_embeddings: [],
    status_logs: [],
    alerts: []
  };
}

function normalizeStore(data) {
  return {
    employees: Array.isArray(data?.employees) ? data.employees : emptyStore().employees,
    face_embeddings: Array.isArray(data?.face_embeddings) ? data.face_embeddings : [],
    status_logs: Array.isArray(data?.status_logs) ? data.status_logs : [],
    alerts: Array.isArray(data?.alerts) ? data.alerts : []
  };
}

async function ensureStoreFile() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(emptyStore(), null, 2));
  }
}

async function readStore() {
  await ensureStoreFile();
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  return normalizeStore(JSON.parse(raw));
}

async function writeStore(data) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  const tmp = `${DATA_FILE}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(normalizeStore(data), null, 2));
  await fs.rename(tmp, DATA_FILE);
}

function updateStore(mutator) {
  writeQueue = writeQueue.then(async () => {
    const data = await readStore();
    const result = await mutator(data);
    await writeStore(data);
    return result;
  });
  return writeQueue;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function isToday(value) {
  const checkedAt = new Date(value);
  const start = startOfToday();
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return checkedAt >= start && checkedAt < end;
}

function latestTodayStatus(statusLogs, employeeId) {
  return statusLogs
    .filter((log) => log.employee_id === employeeId && isToday(log.checked_at))
    .sort((a, b) => new Date(b.checked_at) - new Date(a.checked_at))[0];
}

function scopedEmployees(data, user) {
  return data.employees
    .filter((employee) => employee.role === 'employee')
    .filter((employee) => {
      if (user.role === 'admin') return true;
      if (user.role === 'manager') return employee.manager_id === user.employeeId;
      return employee.id === user.employeeId;
    });
}

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

export async function findEmployeeByEmail(email) {
  const data = await readStore();
  return data.employees.find((employee) => employee.email.toLowerCase() === String(email).toLowerCase()) || null;
}

export async function findEmployeeById(employeeId) {
  const data = await readStore();
  return data.employees.find((employee) => employee.id === employeeId) || null;
}

export async function canUserAccessEmployee(user, employeeId) {
  if (!employeeId) return false;
  if (user.role === 'admin' || user.employeeId === employeeId) return true;
  if (user.role !== 'manager') return false;

  const employee = await findEmployeeById(employeeId);
  return employee?.manager_id === user.employeeId;
}

export async function saveEnrollment(employeeId, encrypted, iv) {
  return updateStore((data) => {
    if (!data.employees.some((employee) => employee.id === employeeId)) {
      throw httpError(404, 'Employee not found');
    }

    data.face_embeddings = data.face_embeddings.filter((row) => row.employee_id !== employeeId);
    data.face_embeddings.push({
      id: crypto.randomUUID(),
      employee_id: employeeId,
      embedding_encrypted: Buffer.from(encrypted).toString('base64'),
      iv,
      created_at: nowIso()
    });

    return { ok: true };
  });
}

export async function getEnrollment(employeeId) {
  const data = await readStore();
  const row = data.face_embeddings
    .filter((entry) => entry.employee_id === employeeId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

  if (!row) return null;
  return {
    embedding_encrypted: Buffer.from(row.embedding_encrypted, 'base64'),
    iv: row.iv
  };
}

export async function deleteEnrollment(employeeId) {
  return updateStore((data) => {
    data.face_embeddings = data.face_embeddings.filter((row) => row.employee_id !== employeeId);
    return { ok: true };
  });
}

export async function addStatus({ employeeId, status, timestamp }) {
  return updateStore((data) => {
    if (!data.employees.some((employee) => employee.id === employeeId)) {
      throw httpError(404, 'Employee not found');
    }

    const checkedAt = timestamp && !Number.isNaN(Date.parse(timestamp))
      ? new Date(timestamp).toISOString()
      : nowIso();

    const log = {
      id: crypto.randomUUID(),
      employee_id: employeeId,
      status,
      checked_at: checkedAt
    };

    data.status_logs.push(log);

    if (status === 'UNKNOWN_FACE') {
      data.alerts.push({
        id: crypto.randomUUID(),
        employee_id: employeeId,
        triggered_at: checkedAt,
        acknowledged: false,
        acknowledged_at: null
      });
    }

    return log;
  });
}

export async function getStatusHistory(employeeId) {
  const data = await readStore();
  return data.status_logs
    .filter((log) => log.employee_id === employeeId && isToday(log.checked_at))
    .sort((a, b) => new Date(b.checked_at) - new Date(a.checked_at));
}

export async function getEmployeeWithManager(employeeId) {
  const data = await readStore();
  const employee = data.employees.find((row) => row.id === employeeId);
  if (!employee) return null;

  const manager = data.employees.find((row) => row.id === employee.manager_id);
  return {
    employee,
    manager: manager ? { email: manager.email, name: manager.name } : null
  };
}

export async function getDashboardSnapshot(user) {
  const data = await readStore();
  const employees = scopedEmployees(data, user).map((employee) => {
    const latest = latestTodayStatus(data.status_logs, employee.id);
    return {
      id: employee.id,
      name: employee.name,
      department: employee.department,
      current_status: latest?.status || 'INACTIVE',
      last_checked_at: latest?.checked_at || null
    };
  });

  const scopedIds = new Set(employees.map((employee) => employee.id));
  const activity = data.status_logs
    .filter((log) => scopedIds.has(log.employee_id) && isToday(log.checked_at))
    .sort((a, b) => new Date(b.checked_at) - new Date(a.checked_at))
    .slice(0, 50)
    .map((log) => {
      const employee = data.employees.find((row) => row.id === log.employee_id);
      return {
        id: log.id,
        checked_at: log.checked_at,
        status: log.status,
        name: employee?.name || 'Unknown employee'
      };
    });

  const alertsToday = data.alerts.filter((alert) => scopedIds.has(alert.employee_id) && isToday(alert.triggered_at)).length;

  return {
    employees: employees.sort((a, b) => a.name.localeCompare(b.name)),
    activity,
    metrics: {
      verified: employees.filter((employee) => employee.current_status === 'VERIFIED').length,
      away: employees.filter((employee) => employee.current_status === 'AWAY').length,
      unknown: employees.filter((employee) => employee.current_status === 'UNKNOWN_FACE').length,
      inactive: employees.filter((employee) => employee.current_status === 'INACTIVE').length,
      alertsToday
    }
  };
}

export async function resetStoreForTests(data = emptyStore()) {
  await writeStore(data);
}
