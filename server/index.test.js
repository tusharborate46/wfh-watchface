import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { decryptEmbedding, encryptEmbedding } from './services/encryptionService.js';

test('embedding encryption round-trips without plaintext storage', () => {
  const embedding = Array.from({ length: 128 }, (_, i) => i / 128);
  const out = encryptEmbedding(embedding);

  assert.ok(Buffer.isBuffer(out.encrypted));
  assert.notEqual(out.encrypted.toString('utf8'), JSON.stringify(embedding));
  assert.deepEqual(decryptEmbedding(out.encrypted, out.iv), embedding);
});

test('API supports local login, status checks, dashboard, enrollment, and delete', async (t) => {
  const file = path.join(os.tmpdir(), `wfh-watchface-${crypto.randomUUID()}.json`);
  process.env.FILE_DB_PATH = file;
  process.env.JWT_SECRET = 'test-secret';
  process.env.EMBEDDING_ENCRYPTION_KEY = 'test-encryption-key';

  const { default: app } = await import(`./app.js?case=${crypto.randomUUID()}`);
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(file, { force: true });
  });

  const employeeLogin = await jsonFetch(`${baseUrl}/api/auth/dev-login`, {
    method: 'POST',
    body: { email: 'employee@example.com' }
  });

  assert.equal(employeeLogin.status, 200);
  assert.equal(employeeLogin.body.employee.role, 'employee');

  const employeeHeaders = authHeaders(employeeLogin.body.token);
  const statusResult = await jsonFetch(`${baseUrl}/api/status`, {
    method: 'POST',
    headers: employeeHeaders,
    body: { status: 'AWAY' }
  });

  assert.equal(statusResult.status, 201);
  assert.equal(statusResult.body.employee_id, employeeLogin.body.employee.id);
  assert.equal(statusResult.body.status, 'AWAY');

  const history = await jsonFetch(`${baseUrl}/api/status/${employeeLogin.body.employee.id}`, {
    headers: employeeHeaders
  });

  assert.equal(history.status, 200);
  assert.equal(history.body.length, 1);

  const embedding = Array.from({ length: 128 }, (_, i) => Number((i / 1000).toFixed(3)));
  const enroll = await jsonFetch(`${baseUrl}/api/enrollment`, {
    method: 'POST',
    headers: employeeHeaders,
    body: { embedding }
  });

  assert.equal(enroll.status, 201);

  const rawStore = await fs.readFile(file, 'utf8');
  assert.ok(!rawStore.includes(JSON.stringify(embedding)));

  const enrollment = await jsonFetch(`${baseUrl}/api/enrollment/me`, {
    headers: employeeHeaders
  });

  assert.equal(enrollment.status, 200);
  assert.deepEqual(enrollment.body.embedding, embedding);

  const managerLogin = await jsonFetch(`${baseUrl}/api/auth/dev-login`, {
    method: 'POST',
    body: { email: 'manager@example.com' }
  });

  const dashboard = await jsonFetch(`${baseUrl}/api/dashboard`, {
    headers: authHeaders(managerLogin.body.token)
  });

  assert.equal(dashboard.status, 200);
  assert.equal(dashboard.body.employees.length, 1);
  assert.equal(dashboard.body.employees[0].current_status, 'AWAY');
  assert.equal(dashboard.body.metrics.away, 1);

  const deleted = await jsonFetch(`${baseUrl}/api/enrollment/me`, {
    method: 'DELETE',
    headers: employeeHeaders
  });

  assert.equal(deleted.status, 200);
  assert.equal(deleted.body.ok, true);
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
