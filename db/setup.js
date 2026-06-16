import 'dotenv/config';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const conn = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root123',
  multipleStatements: true
});

const sql = fs.readFileSync(path.join(__dirname, 'migrations/001_initial.sql'), 'utf8');
await conn.query(sql);

await conn.query('USE wfh_watchface');

const [indexes] = await conn.query(`
  SELECT index_name FROM information_schema.statistics
  WHERE table_schema = 'wfh_watchface'
  AND table_name = 'status_logs'
  AND index_name = 'idx_status_logs_employee_checked'
`);

if (indexes.length === 0) {
  await conn.query('CREATE INDEX idx_status_logs_employee_checked ON status_logs(employee_id, checked_at DESC)');
  console.log('Index created.');
} else {
  console.log('Index already exists, skipping.');
}

console.log('Database and tables created.');
await conn.end();