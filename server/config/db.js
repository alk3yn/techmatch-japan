// server/config/db.js
// PostgreSQL connection pool, shared across the app.

const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  console.warn(
    '[db] DATABASE_URL is not set. Copy .env.example to server/.env and fill in a real connection string.'
  );
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // RDS in production generally needs SSL; local Postgres usually doesn't.
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[db] Unexpected error on idle client', err);
});

/**
 * Run a parameterized query against the pool.
 * Always use placeholders ($1, $2, ...) — never string-interpolate values.
 */
async function query(text, params) {
  const start = Date.now();
  const result = await pool.query(text, params);
  if (process.env.NODE_ENV !== 'production') {
    const duration = Date.now() - start;
    console.log('[db] query', { text, duration, rows: result.rowCount });
  }
  return result;
}

/**
 * Get a dedicated client from the pool for multi-statement transactions.
 * Caller is responsible for calling client.release() when done.
 */
async function getClient() {
  const client = await pool.connect();
  return client;
}

module.exports = { pool, query, getClient };
