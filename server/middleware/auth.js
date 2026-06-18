import jwt from 'jsonwebtoken';
import { canUserAccessEmployee } from '../store.js';

export function auth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) return res.status(401).json({ error: 'Missing token' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export async function canAccessEmployee(req, employeeId) {
  return canUserAccessEmployee(req.user, employeeId);
}
