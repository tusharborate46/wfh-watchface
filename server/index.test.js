import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';
import { setMockQuery } from './db.js';
import { decryptEmbedding, encryptEmbedding } from './services/encryptionService.js';

// Setup key and secret for tests
process.env.JWT_SECRET = 'test-secret-at-least-32-chars-long';
process.env.EMBEDDING_ENCRYPTION_KEY = 'test-encryption-key-must-be-32-b';
process.env.BCRYPT_ROUNDS = '4'; // fast bcrypt for tests

// ─── Test 1: Encryption Roundtrip ────────────────────────────────────────────
test('embedding encryption round-trips without plaintext storage', () => {
  const embedding = Array.from({ length: 128 }, (_, i) => i / 128);
  const out = encryptEmbedding(embedding);

  assert.ok(Buffer.isBuffer(out.encrypted));
  assert.notEqual(out.encrypted.toString('utf8'), JSON.stringify(embedding));
  assert.deepEqual(decryptEmbedding(out.encrypted, out.iv), embedding);
});

// ─── Test 2: API integration using in-memory database mock ──────────────────
test('API supports manager/employee registration, login, status checks, dashboard, alerts, enrollment, and deletion', async (t) => {
  // In-memory database tables
  const db = {
    managers: [],
    employees: [],
    face_embeddings: [],
    status_logs: [],
    alerts: []
  };

  // Mock implementation of query
  setMockQuery(async (text, params) => {
    const queryLower = text.toLowerCase();

    // Helper function to normalise query comparisons by collapsing whitespace
    const norm = (s) => s.replace(/\s+/g, ' ').trim();
    const queryNorm = norm(queryLower);

    // ─── Managers ───
    if (queryNorm.includes('insert into managers')) {
      const [name, email, manager_code, password_hash, department] = params;
      const id = crypto.randomUUID();
      const manager = { id, name, email, manager_code, password_hash, department, created_at: new Date().toISOString() };
      db.managers.push(manager);
      return { rows: [manager] };
    }
    if (queryNorm.includes('select * from managers') && queryNorm.includes('manager_code = $1')) {
      const code = params[0];
      const match = db.managers.find(m => m.manager_code.toLowerCase() === code.toLowerCase());
      return { rows: match ? [match] : [] };
    }
    if (queryNorm.includes('select * from managers') && queryNorm.includes('lower(email) = lower($1)')) {
      const email = params[0];
      const match = db.managers.find(m => m.email.toLowerCase() === email.toLowerCase());
      return { rows: match ? [match] : [] };
    }
    if (queryNorm.includes('select * from managers') && queryNorm.includes('id = $1')) {
      const id = params[0];
      const match = db.managers.find(m => m.id === id);
      return { rows: match ? [match] : [] };
    }

    // ─── Employees ───
    if (queryNorm.includes('insert into employees')) {
      const [name, email, employee_code, password_hash, department, manager_id] = params;
      const id = crypto.randomUUID();
      const employee = { id, name, email, employee_code, password_hash, department, manager_id, created_at: new Date().toISOString() };
      db.employees.push(employee);
      return { rows: [employee] };
    }
    if (queryNorm.includes('select * from employees') && queryNorm.includes('employee_code = $1')) {
      const code = params[0];
      const match = db.employees.find(e => e.employee_code.toLowerCase() === code.toLowerCase());
      return { rows: match ? [match] : [] };
    }
    if (queryNorm.includes('select * from employees') && queryNorm.includes('lower(email) = lower($1)')) {
      const email = params[0];
      const match = db.employees.find(e => e.email.toLowerCase() === email.toLowerCase());
      return { rows: match ? [match] : [] };
    }
    if (queryNorm.includes('select * from employees') && queryNorm.includes('id = $1') && !queryNorm.includes('left join')) {
      const id = params[0];
      const match = db.employees.find(e => e.id === id);
      return { rows: match ? [match] : [] };
    }
    if (queryNorm.includes('select id from employees where id = $1 and manager_id = $2')) {
      const [id, manager_id] = params;
      const match = db.employees.find(e => e.id === id && e.manager_id === manager_id);
      return { rows: match ? [{ id: match.id }] : [] };
    }
    if (queryNorm.includes('update employees set password_hash = $1 where id = $2')) {
      const [hash, id] = params;
      const employee = db.employees.find(e => e.id === id);
      if (employee) {
        employee.password_hash = hash;
      }
      return { rows: [] };
    }

    // ─── Face Embeddings ───
    if (queryNorm.includes('delete from face_embeddings where employee_id = $1')) {
      const employee_id = params[0];
      db.face_embeddings = db.face_embeddings.filter(fe => fe.employee_id !== employee_id);
      return { rows: [] };
    }
    if (queryNorm.includes('insert into face_embeddings')) {
      const [employee_id, embedding_encrypted, iv] = params;
      const id = crypto.randomUUID();
      const row = { id, employee_id, embedding_encrypted, iv, created_at: new Date().toISOString() };
      db.face_embeddings.push(row);
      return { rows: [row] };
    }
    if (queryNorm.includes('select embedding_encrypted, iv from face_embeddings')) {
      const employee_id = params[0];
      const matches = db.face_embeddings
        .filter(fe => fe.employee_id === employee_id)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return { rows: matches[0] ? [matches[0]] : [] };
    }
    if (queryNorm.includes('select id from face_embeddings where employee_id = $1')) {
      const employee_id = params[0];
      const exists = db.face_embeddings.some(fe => fe.employee_id === employee_id);
      return { rows: exists ? [{ id: 'some-id' }] : [] };
    }

    // ─── Status Logs ───
    if (queryNorm.includes('insert into status_logs')) {
      const [employee_id, status, checked_at] = params;
      const id = crypto.randomUUID();
      const log = { id, employee_id, status, checked_at };
      db.status_logs.push(log);
      return { rows: [log] };
    }
    if (queryNorm.includes('select id, employee_id, status, checked_at from status_logs') || queryNorm.includes('from status_logs')) {
      // Handles getStatusHistory
      if (!queryNorm.includes('join') && !queryNorm.includes('distinct on') && !queryNorm.includes('count(*)')) {
        const employee_id = params[0];
        const logs = db.status_logs
          .filter(sl => sl.employee_id === employee_id)
          .sort((a, b) => new Date(b.checked_at) - new Date(a.checked_at));
        return { rows: logs };
      }
    }

    // ─── Alerts ───
    if (queryNorm.includes('insert into alerts')) {
      const [employee_id, triggered_at] = params;
      const id = crypto.randomUUID();
      db.alerts.push({ id, employee_id, triggered_at, acknowledged: false, acknowledged_at: null });
      return { rows: [] };
    }
    if (queryNorm.includes('update alerts a set acknowledged = true')) {
      const [alertId, managerId] = params;
      const alert = db.alerts.find(a => a.id === alertId);
      if (alert) {
        alert.acknowledged = true;
        alert.acknowledged_at = new Date().toISOString();
        return { rows: [{ id: alert.id }] };
      }
      return { rows: [] };
    }

    // ─── Joint Lookups ───
    if (queryNorm.includes('left join managers')) {
      const id = params[0];
      const employee = db.employees.find(e => e.id === id);
      if (!employee) return { rows: [] };
      const manager = db.managers.find(m => m.id === employee.manager_id);
      return {
        rows: [{
          id: employee.id,
          name: employee.name,
          email: employee.email,
          department: employee.department,
          manager_id: employee.manager_id,
          manager_name: manager?.name || null,
          manager_email: manager?.email || null
        }]
      };
    }
    if (queryNorm.includes('exists(select 1 from face_embeddings')) {
      const manager_id = params[0];
      const filtered = db.employees
        .filter(e => e.manager_id === manager_id)
        .map(e => ({
          ...e,
          enrolled: db.face_embeddings.some(fe => fe.employee_id === e.id)
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      return { rows: filtered };
    }
    if (queryNorm.includes('join employees e on e.id = a.employee_id')) {
      const manager_id = params[0];
      const matchingAlerts = db.alerts
        .filter(a => {
          const emp = db.employees.find(e => e.id === a.employee_id);
          return emp && emp.manager_id === manager_id;
        })
        .map(a => {
          const emp = db.employees.find(e => e.id === a.employee_id);
          return {
            id: a.id,
            employee_id: a.employee_id,
            triggered_at: a.triggered_at,
            acknowledged: a.acknowledged,
            acknowledged_at: a.acknowledged_at,
            employee_name: emp?.name,
            department: emp?.department
          };
        })
        .sort((a, b) => new Date(b.triggered_at) - new Date(a.triggered_at));
      return { rows: matchingAlerts };
    }
    if (queryNorm.includes('distinct on (employee_id)')) {
      const ids = params[0];
      const result = [];
      for (const empId of ids) {
        const sortedLogs = db.status_logs
          .filter(sl => sl.employee_id === empId)
          .sort((a, b) => new Date(b.checked_at) - new Date(a.checked_at));
        if (sortedLogs[0]) {
          result.push(sortedLogs[0]);
        }
      }
      return { rows: result };
    }
    if (queryNorm.includes('join employees e on e.id = sl.employee_id')) {
      const ids = params[0];
      const filteredLogs = db.status_logs
        .filter(sl => ids.includes(sl.employee_id))
        .map(sl => {
          const emp = db.employees.find(e => e.id === sl.employee_id);
          return {
            id: sl.id,
            checked_at: sl.checked_at,
            status: sl.status,
            name: emp?.name
          };
        })
        .sort((a, b) => new Date(b.checked_at) - new Date(a.checked_at));
      return { rows: filteredLogs };
    }
    if (queryNorm.includes('select count(*) as cnt from alerts')) {
      const ids = params[0];
      const count = db.alerts.filter(a => ids.includes(a.employee_id)).length;
      return { rows: [{ cnt: count }] };
    }

    throw new Error(`Unhandled mock query: ${text}`);
  });

  const { default: app } = await import(`./app.js?case=${crypto.randomUUID()}`);
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  // 1. Register Manager
  const mgrRegister = await jsonFetch(`${baseUrl}/api/auth/manager/register`, {
    method: 'POST',
    body: {
      name: 'Bob Manager',
      email: 'manager@example.com',
      manager_code: 'MGR001',
      password: 'password123',
      department: 'Engineering'
    }
  });
  assert.equal(mgrRegister.status, 201);
  assert.equal(mgrRegister.body.ok, true);

  // 2. Login Manager
  const mgrLogin = await jsonFetch(`${baseUrl}/api/auth/manager/login`, {
    method: 'POST',
    body: {
      manager_code: 'MGR001',
      password: 'password123'
    }
  });
  assert.equal(mgrLogin.status, 200);
  assert.ok(mgrLogin.body.token);
  assert.equal(mgrLogin.body.manager.name, 'Bob Manager');
  const mgrHeaders = authHeaders(mgrLogin.body.token);

  // 3. Register Employee
  const empRegister = await jsonFetch(`${baseUrl}/api/auth/employee/register`, {
    method: 'POST',
    body: {
      name: 'Alice Employee',
      email: 'employee@example.com',
      employee_code: 'EMP001',
      password: 'password123',
      department: 'Engineering',
      manager_code: 'MGR001'
    }
  });
  assert.equal(empRegister.status, 201);
  assert.equal(empRegister.body.ok, true);

  // 4. Login Employee
  const empLogin = await jsonFetch(`${baseUrl}/api/auth/employee/login`, {
    method: 'POST',
    body: {
      employee_code: 'EMP001',
      password: 'password123'
    }
  });
  assert.equal(empLogin.status, 200);
  assert.ok(empLogin.body.token);
  assert.equal(empLogin.body.employee.name, 'Alice Employee');
  assert.equal(empLogin.body.enrolled, false);
  const empHeaders = authHeaders(empLogin.body.token);

  // 5. Enroll Face Embedding
  const testEmbedding = Array.from({ length: 128 }, (_, i) => Number((i / 1000).toFixed(3)));
  const enrollRes = await jsonFetch(`${baseUrl}/api/enrollment`, {
    method: 'POST',
    headers: empHeaders,
    body: { embedding: testEmbedding }
  });
  assert.equal(enrollRes.status, 201);
  assert.equal(enrollRes.body.ok, true);

  // 6. Get Face Embedding (Verification)
  const getEnrollRes = await jsonFetch(`${baseUrl}/api/enrollment/me`, {
    headers: empHeaders
  });
  assert.equal(getEnrollRes.status, 200);
  assert.deepEqual(getEnrollRes.body.embedding, testEmbedding);

  // 7. Post Status check
  const statusRes = await jsonFetch(`${baseUrl}/api/status`, {
    method: 'POST',
    headers: empHeaders,
    body: { status: 'VERIFIED' }
  });
  assert.equal(statusRes.status, 201);
  assert.equal(statusRes.body.status, 'VERIFIED');

  // 8. Get Status History
  const historyRes = await jsonFetch(`${baseUrl}/api/status/${empLogin.body.employee.id}`, {
    headers: empHeaders
  });
  assert.equal(historyRes.status, 200);
  assert.equal(historyRes.body.length, 1);
  assert.equal(historyRes.body[0].status, 'VERIFIED');

  // 9. Get Manager Dashboard Snapshot
  const dashboardRes = await jsonFetch(`${baseUrl}/api/dashboard`, {
    headers: mgrHeaders
  });
  assert.equal(dashboardRes.status, 200);
  assert.equal(dashboardRes.body.employees.length, 1);
  assert.equal(dashboardRes.body.employees[0].current_status, 'VERIFIED');
  assert.equal(dashboardRes.body.metrics.verified, 1);

  // 10. Post alert-triggering status (UNKNOWN_FACE)
  const alertStatusRes = await jsonFetch(`${baseUrl}/api/status`, {
    method: 'POST',
    headers: empHeaders,
    body: { status: 'UNKNOWN_FACE' }
  });
  assert.equal(alertStatusRes.status, 201);

  // 11. Get Manager Alerts list
  const alertsRes = await jsonFetch(`${baseUrl}/api/manager/alerts`, {
    headers: mgrHeaders
  });
  assert.equal(alertsRes.status, 200);
  assert.equal(alertsRes.body.length, 1);
  assert.equal(alertsRes.body[0].employee_name, 'Alice Employee');
  assert.equal(alertsRes.body[0].acknowledged, false);
  const alertId = alertsRes.body[0].id;

  // 12. Acknowledge Alert
  const ackRes = await jsonFetch(`${baseUrl}/api/manager/alerts/${alertId}`, {
    method: 'PATCH',
    headers: mgrHeaders
  });
  assert.equal(ackRes.status, 200);
  assert.equal(ackRes.body.ok, true);

  // 13. Delete enrollment
  const deleteRes = await jsonFetch(`${baseUrl}/api/enrollment/me`, {
    method: 'DELETE',
    headers: empHeaders
  });
  assert.equal(deleteRes.status, 200);
  assert.equal(deleteRes.body.ok, true);

  // Verify deleted enrollment response
  const postDeleteRes = await jsonFetch(`${baseUrl}/api/enrollment/me`, {
    headers: empHeaders
  });
  assert.equal(postDeleteRes.status, 404);

  // 14. Change Password (Success and Error paths)
  const wrongPwRes = await jsonFetch(`${baseUrl}/api/auth/employee/change-password`, {
    method: 'POST',
    headers: empHeaders,
    body: { currentPassword: 'wrong-password', newPassword: 'new-password123' }
  });
  assert.equal(wrongPwRes.status, 400);

  const rightPwRes = await jsonFetch(`${baseUrl}/api/auth/employee/change-password`, {
    method: 'POST',
    headers: empHeaders,
    body: { currentPassword: 'password123', newPassword: 'new-password123' }
  });
  assert.equal(rightPwRes.status, 200);
  assert.equal(rightPwRes.body.ok, true);

  // Verify login with new password works
  const newLoginRes = await jsonFetch(`${baseUrl}/api/auth/employee/login`, {
    method: 'POST',
    body: { employee_code: 'EMP001', password: 'new-password123' }
  });
  assert.equal(newLoginRes.status, 200);
  assert.ok(newLoginRes.body.token);
});

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

async function jsonFetch(url, { method = 'GET', headers = {}, body } = {}) {
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });

  return {
    status: res.status,
    body: await res.json()
  };
}
