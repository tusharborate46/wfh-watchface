import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  acknowledgeAlert,
  getAlertsForManager,
  getEmployeesForManager
} from '../store.js';

const router = express.Router();
router.use(auth);

// Ensure only managers can use these routes
function requireManager(req, res, next) {
  if (req.user.role !== 'manager') {
    return res.status(403).json({ error: 'Manager access required' });
  }
  next();
}

router.use(requireManager);

// GET /api/manager/employees — list all employees under this manager
router.get('/employees', async (req, res, next) => {
  try {
    const employees = await getEmployeesForManager(req.user.managerId);
    res.json(employees);
  } catch (err) {
    next(err);
  }
});

// GET /api/manager/alerts — list all alerts for this manager's employees
router.get('/alerts', async (req, res, next) => {
  try {
    const alerts = await getAlertsForManager(req.user.managerId);
    res.json(alerts);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/manager/alerts/:id — acknowledge an alert
router.patch('/alerts/:id', async (req, res, next) => {
  try {
    const result = await acknowledgeAlert(req.params.id, req.user.managerId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
