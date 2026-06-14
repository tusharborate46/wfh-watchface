import jwt from 'jsonwebtoken';
import { query } from '../db.js';

export function auth(req,res,next){const token=(req.headers.authorization||'').replace('Bearer ','');if(!token)return res.status(401).json({error:'Missing token'});try{req.user=jwt.verify(token,process.env.JWT_SECRET||'dev-secret');next();}catch{return res.status(401).json({error:'Invalid token'});}}
export async function canAccessEmployee(req, employeeId){if(req.user.role==='admin')return true;if(req.user.employeeId===employeeId)return true;if(req.user.role==='manager'){const {rows}=await query('SELECT id FROM employees WHERE id = ? AND manager_id = ?',[employeeId,req.user.employeeId]);return rows.length>0;}return false;}
