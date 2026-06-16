import crypto from 'crypto';
import express from 'express';
import { query } from '../db.js';
import { auth, canAccessEmployee } from '../middleware/auth.js';
import { sendUnknownFaceAlert } from '../services/alertService.js';

const r = express.Router();
r.use(auth);
const allowed = ['VERIFIED', 'AWAY', 'UNKNOWN_FACE', 'CAMERA_ERROR'];

r.post('/', async (req, res, next) => {
  try {
    const { employeeId, status, timestamp } = req.body;
    if (!(await canAccessEmployee(req, employeeId))) return res.status(403).json({ error: 'Forbidden' });
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const id = crypto.randomUUID();
    const checkedAt = timestamp || new Date();
    await query('insert into status_logs(id,employee_id,status,checked_at) values(?,?,?,?)', [id, employeeId, status, checkedAt]);
    const log = { id, employee_id: employeeId, status, checked_at: checkedAt };

    if (status === 'UNKNOWN_FACE') {
      await query('insert into alerts(employee_id,triggered_at) values(?,?)', [employeeId, checkedAt]);
      const people = await query('select e.*,m.email manager_email,m.name manager_name from employees e left join employees m on e.manager_id=m.id where e.id=?', [employeeId]);
      sendUnknownFaceAlert({
        employee: people.rows[0],
        manager: { email: people.rows[0]?.manager_email, name: people.rows[0]?.manager_name }
      }).catch(console.error);
    }

    res.status(201).json(log);
  } catch (err) {
    next(err);
  }
});

r.get('/:employeeId', async (req, res, next) => {
  try {
    if (!(await canAccessEmployee(req, req.params.employeeId))) return res.status(403).json({ error: 'Forbidden' });
    const { rows } = await query(
      'select * from status_logs where employee_id=? and checked_at >= CURRENT_DATE and checked_at < CURRENT_DATE + INTERVAL 1 DAY order by checked_at desc',
      [req.params.employeeId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default r;
