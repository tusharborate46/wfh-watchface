import express from 'express';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import { getDashboardSnapshot } from '../store.js';

const router = express.Router();

router.use(auth, requireRole('manager', 'admin'));

router.get('/', async (req, res, next) => {
  try {
    res.json(await getDashboardSnapshot(req.user));
  } catch (err) {
    next(err);
  }
});

export default router;
