import express from 'express';
import { query } from '../db.js';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const r = express.Router();
r.use(auth, requireRole('manager', 'admin'));

r.get('/', async (req, res, next) => {
  try {
    const filter = req.user.role === 'manager' ? 'where e.manager_id=?' : '';
    const params = req.user.role === 'manager' ? [req.user.employeeId] : [];
    const employees = await query(`
      select e.id,e.name,e.department,coalesce(s.status,'INACTIVE') current_status,s.checked_at last_checked_at
      from employees e
      left join (
        select sl.employee_id,sl.status,sl.checked_at
        from status_logs sl
        join (select employee_id,max(checked_at) checked_at from status_logs group by employee_id) latest
          on latest.employee_id=sl.employee_id and latest.checked_at=sl.checked_at
      ) s on s.employee_id=e.id
      ${filter}
      order by e.name
    `, params);
    const activity = await query(`
      select s.id,s.checked_at,s.status,e.name
      from status_logs s
      join employees e on e.id=s.employee_id
      where s.checked_at >= CURRENT_DATE and s.checked_at < CURRENT_DATE + INTERVAL 1 DAY
      order by s.checked_at desc
      limit 50
    `);
    const alerts = await query('select CAST(count(*) AS UNSIGNED) c from alerts where triggered_at >= CURRENT_DATE and triggered_at < CURRENT_DATE + INTERVAL 1 DAY');

    res.json({
      employees: employees.rows,
      activity: activity.rows,
      metrics: {
        verified: employees.rows.filter((employee) => employee.current_status === 'VERIFIED').length,
        away: employees.rows.filter((employee) => ['AWAY', 'CAMERA_ERROR'].includes(employee.current_status)).length,
        alertsToday: alerts.rows[0].c
      }
    });
  } catch (err) {
    next(err);
  }
});

export default r;
