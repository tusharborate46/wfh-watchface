import express from 'express';
import jwt from 'jsonwebtoken';
import { findEmployeeByEmail } from '../store.js';

const router = express.Router();

router.post('/dev-login', async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim();
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const employee = await findEmployeeByEmail(email);
    if (!employee) return res.status(404).json({ error: 'No employee found for that email' });

    const token = jwt.sign(
      {
        employeeId: employee.id,
        role: employee.role,
        name: employee.name,
        managerId: employee.manager_id
      },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '8h' }
    );

    res.json({
      token,
      employee: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        department: employee.department,
        manager_id: employee.manager_id
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
