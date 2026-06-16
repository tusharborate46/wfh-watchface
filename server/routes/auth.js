import express from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';

const r = express.Router();

// Development only: remove this endpoint or protect it behind a trusted internal auth layer before production use.
r.post('/dev-login', async (req, res, next) => {
  try {
    const { email } = req.body;
    const { rows } = await query('select id,name,email,role,manager_id from employees where email=?', [email]);
    if (!rows[0]) return res.status(404).json({ error: 'No employee' });

    const employee = rows[0];
    const token = jwt.sign(
      { employeeId: employee.id, role: employee.role, name: employee.name, managerId: employee.manager_id },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '8h' }
    );
    res.json({ token, employee });
  } catch (err) {
    next(err);
  }
});

export default r;
