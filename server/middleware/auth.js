import jwt from 'jsonwebtoken';
export function auth(req,res,next){const token=(req.headers.authorization||'').replace('Bearer ','');if(!token)return res.status(401).json({error:'Missing token'});try{req.user=jwt.verify(token,process.env.JWT_SECRET||'dev-secret');next();}catch{return res.status(401).json({error:'Invalid token'});}}
export function canAccessEmployee(req, employeeId){return req.user.role==='admin'||req.user.employeeId===employeeId||req.user.team?.includes(employeeId)}
