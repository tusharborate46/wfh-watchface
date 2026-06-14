import express from 'express';import jwt from 'jsonwebtoken';import { query } from '../db.js';const r=express.Router();
r.post('/dev-login',async(req,res)=>{const {email}=req.body;const {rows}=await query('select id,name,email,role from employees where email=?',[email]);if(!rows[0])return res.status(404).json({error:'No employee'});const token=jwt.sign({employeeId:rows[0].id,role:rows[0].role,name:rows[0].name},process.env.JWT_SECRET||'dev-secret',{expiresIn:'8h'});res.json({token,employee:rows[0]});});
export default r;
