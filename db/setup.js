import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

const conn = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true
});

const sql = fs.readFileSync(path.resolve('db/migrations/001_initial.sql'), 'utf8');
await conn.query(sql);
console.log('Database and tables created.');
await conn.end();
