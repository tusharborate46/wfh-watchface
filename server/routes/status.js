import express from 'express';
import { auth } from '../middleware/auth.js';
import { sendUnknownFaceAlert } from '../services/alertService.js';
import {
  addStatus,
  canUserAccessEmployee,
  getEmployeeWithManager,
  getStatusHistory
} from '../store.js';

const router = express.Router();
const ALLOWED_STATUSES = new Set(['VERIFIED', 'AWAY', 'UNKNOWN_FACE', 'CAMERA_ERROR']);

router.use(auth);

router.post('/', async (req, res, next) => {
  try {
    const status = req.body?.status;
    const employeeId = req.body?.employeeId || req.user.employeeId;

    if (!ALLOWED_STATUSES.has(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    if (!(await canUserAccessEmployee(req.user, employeeId))) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const log = await addStatus({
      employeeId,
      status,
      timestamp: req.body?.timestamp
    });

    if (status === 'UNKNOWN_FACE') {
      const people = await getEmployeeWithManager(employeeId);
      if (people) {
        sendUnknownFaceAlert(people).catch((err) => {
          console.error('[alert]', err);
        });
      }
    }

    res.status(201).json(log);
  } catch (err) {
    next(err);
  }
});

router.get('/:employeeId', async (req, res, next) => {
  try {
    if (!(await canUserAccessEmployee(req.user, req.params.employeeId))) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(await getStatusHistory(req.params.employeeId));
  } catch (err) {
    next(err);
  }
});

export default router;
