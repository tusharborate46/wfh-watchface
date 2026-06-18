export function requireRole(...roles) {
  return (req, res, next) => {
    if (roles.includes(req.user.role)) return next();
    return res.status(403).json({ error: 'Forbidden' });
  };
}
