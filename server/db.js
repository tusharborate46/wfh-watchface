import pg from 'pg';

const { Pool } = pg;

export let pool = null;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
}

export let query = async (text, params) => {
  if (!pool) {
    throw new Error('Database pool not initialized. DATABASE_URL is missing.');
  }
  const { rows } = await pool.query(text, params);
  return { rows };
};

export function setMockQuery(mockFn) {
  query = mockFn;
}
