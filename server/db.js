let pool;

async function getPool() {
  if (!pool) {
    const mysql = await import('mysql2/promise');
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'wfh_watchface',
      waitForConnections: true,
      connectionLimit: 10
    });
  }
  return pool;
}

export { pool };

export async function query(text, params) {
  const db = await getPool();
  const [rows] = await db.execute(text, params);
  return { rows };
}
