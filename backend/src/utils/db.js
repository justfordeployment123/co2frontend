// ========================================================================
// DATABASE CONNECTION UTILITY
// PostgreSQL connection pool management
// ========================================================================

import pg from 'pg';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

const { Pool } = pg;

// Validate DATABASE_URL exists
if (!process.env.DATABASE_URL) {
  console.error('[CRITICAL] DATABASE_URL environment variable not set');
  process.exit(1);
}

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                    // Max connections in pool
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 2000,
});

// Log connection events
pool.on('error', (err) => {
  console.error('[DB Pool Error]', err.message);
});

/**
 * Execute SQL query with parameters
 * @param {string} query - SQL query with $1, $2 placeholders
 * @param {Array} values - Query parameters
 * @returns {Promise<Object>} Query result
 */
export async function query(queryStr, values = []) {
  const start = Date.now();
  try {
    const result = await pool.query(queryStr, values);
    const duration = Date.now() - start;
    
    if (process.env.LOG_LEVEL === 'debug') {
      console.log(`[SQL] ${duration}ms`, queryStr.substring(0, 80));
    }
    
    return result;
  } catch (error) {
    console.error('[DB Error]', error.message);
    console.error('[SQL]', queryStr);
    console.error('[Values]', values);
    throw error;
  }
}

/**
 * Get a single row from query result
 * @param {string} queryStr - SQL query
 * @param {Array} values - Query parameters
 * @returns {Promise<Object|null>} Single row or null
 */
export async function queryOne(queryStr, values = []) {
  const result = await query(queryStr, values);
  return result.rows[0] || null;
}

/**
 * Get multiple rows from query result
 * @param {string} queryStr - SQL query
 * @param {Array} values - Query parameters
 * @returns {Promise<Array>} Array of rows
 */
export async function queryAll(queryStr, values = []) {
  const result = await query(queryStr, values);
  return result.rows;
}

/**
 * Execute INSERT/UPDATE/DELETE and return number of affected rows
 * @param {string} queryStr - SQL query
 * @param {Array} values - Query parameters
 * @returns {Promise<number>} Number of affected rows
 */
export async function execute(queryStr, values = []) {
  const result = await query(queryStr, values);
  return result.rowCount;
}

/**
 * Test database connection
 * @returns {Promise<boolean>} True if connected
 */
export async function testConnection() {
  try {
    const result = await pool.query('SELECT 1');
    console.log('[DB] Connection test successful');
    return true;
  } catch (error) {
    console.error('[DB Connection Error]', error.message);
    console.error('[DB Connection Details]', error.code, error.detail);
    return false;
  }
}

/**
 * Close all connections in pool
 * @returns {Promise<void>}
 */
export async function closePool() {
  await pool.end();
  console.log('[DB] Connection pool closed');
}

export default pool;
