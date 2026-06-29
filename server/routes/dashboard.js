import express from 'express';
import { auth } from '../middleware/auth.js';
import { getDashboardSnapshot } from '../store.js';

const router = express.Router();

// Require manager role
router.use(auth, (req, res, next) => {
  if (req.user.role !== 'manager') {
    return res.status(403).json({ error: 'Manager access required' });
  }
  next();
});

router.get('/', async (req, res, next) => {
  try {
    res.json(await getDashboardSnapshot(req.user));
  } catch (err) {
    next(err);
  }
});

export default router;
