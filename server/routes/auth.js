import bcrypt from 'bcrypt';
import express from 'express';
import jwt from 'jsonwebtoken';
import {
  createEmployee,
  createManager,
  findEmployeeByCode,
  findManagerByCode,
  findManagerByCode as findMgrByCode,
  hasEnrollment
} from '../store.js';

const router = express.Router();
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

function makeToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '8h' });
}

// ─── Employee Login ───────────────────────────────────────────────────────────

router.post('/employee/login', async (req, res, next) => {
  try {
    const employee_code = String(req.body?.employee_code || '').trim();
    const password = String(req.body?.password || '');

    if (!employee_code || !password) {
      return res.status(400).json({ error: 'employee_code and password are required' });
    }

    const employee = await findEmployeeByCode(employee_code);
    if (!employee) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, employee.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const enrolled = await hasEnrollment(employee.id);

    const token = makeToken({
      employeeId: employee.id,
      role: 'employee',
      name: employee.name,
      managerId: employee.manager_id
    });

    res.json({
      token,
      enrolled,
      employee: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        employee_code: employee.employee_code,
        department: employee.department,
        role: 'employee'
      }
    });
  } catch (err) {
    next(err);
  }
});

// ─── Manager Login ────────────────────────────────────────────────────────────

router.post('/manager/login', async (req, res, next) => {
  try {
    const manager_code = String(req.body?.manager_code || '').trim();
    const password = String(req.body?.password || '');

    if (!manager_code || !password) {
      return res.status(400).json({ error: 'manager_code and password are required' });
    }

    const manager = await findManagerByCode(manager_code);
    if (!manager) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, manager.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = makeToken({
      managerId: manager.id,
      role: 'manager',
      name: manager.name
    });

    res.json({
      token,
      manager: {
        id: manager.id,
        name: manager.name,
        email: manager.email,
        manager_code: manager.manager_code,
        department: manager.department,
        role: 'manager'
      }
    });
  } catch (err) {
    next(err);
  }
});

// ─── Employee Register ────────────────────────────────────────────────────────

router.post('/employee/register', async (req, res, next) => {
  try {
    const { name, email, employee_code, password, department, manager_code } = req.body || {};

    if (!name || !email || !employee_code || !password) {
      return res.status(400).json({ error: 'name, email, employee_code, and password are required' });
    }

    // Resolve manager_id from manager_code
    let manager_id = null;
    if (manager_code) {
      const manager = await findMgrByCode(manager_code);
      if (!manager) return res.status(400).json({ error: 'No manager found with that manager_code' });
      manager_id = manager.id;
    }

    const password_hash = await bcrypt.hash(String(password), BCRYPT_ROUNDS);

    const employee = await createEmployee({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      employee_code: String(employee_code).trim().toUpperCase(),
      password_hash,
      department: department ? String(department).trim() : null,
      manager_id
    });

    res.status(201).json({ ok: true, employee });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Employee with that email or employee_code already exists' });
    }
    next(err);
  }
});

// ─── Manager Register ─────────────────────────────────────────────────────────

router.post('/manager/register', async (req, res, next) => {
  try {
    const { name, email, manager_code, password, department } = req.body || {};

    if (!name || !email || !manager_code || !password) {
      return res.status(400).json({ error: 'name, email, manager_code, and password are required' });
    }

    const password_hash = await bcrypt.hash(String(password), BCRYPT_ROUNDS);

    const manager = await createManager({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      manager_code: String(manager_code).trim().toUpperCase(),
      password_hash,
      department: department ? String(department).trim() : null
    });

    res.status(201).json({ ok: true, manager });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Manager with that email or manager_code already exists' });
    }
    next(err);
  }
});

// ─── Change Password ──────────────────────────────────────────────────────────
import { auth } from '../middleware/auth.js';
import { findEmployeeById, updateEmployeePassword } from '../store.js';

router.post('/employee/change-password', auth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'currentPassword and newPassword are required' });
    }

    const employee = await findEmployeeById(req.user.employeeId);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const valid = await bcrypt.compare(currentPassword, employee.password_hash);
    if (!valid) return res.status(400).json({ error: 'Incorrect current password' });

    const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await updateEmployeePassword(req.user.employeeId, newHash);

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
