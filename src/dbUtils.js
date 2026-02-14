// Database Utilities and Helpers
const pool = require('./db');
const logger = require('./logger')('dbUtils');

/**
 * Execute transaction with rollback on error
 */
const executeTransaction = async (callback) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Transaction failed', { error: error.message });
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get table statistics
 */
const getTableStats = async (tableName) => {
  const result = await pool.query(
    `SELECT 
      schemaname,
      tablename,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
      n_live_tup AS row_count
     FROM pg_stat_user_tables
     WHERE tablename = $1`,
    [tableName]
  );
  
  return result.rows[0] || null;
};

/**
 * Get all table statistics
 */
const getAllTableStats = async () => {
  const result = await pool.query(
    `SELECT 
      schemaname,
      tablename,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
      n_live_tup AS row_count
     FROM pg_stat_user_tables
     ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC`
  );
  
  return result.rows;
};

/**
 * Get unused indexes
 */
const getUnusedIndexes = async () => {
  const result = await pool.query(
    `SELECT 
      schemaname,
      tablename,
      indexname,
      idx_scan AS index_scans
     FROM pg_stat_user_indexes
     WHERE idx_scan = 0
     ORDER BY pg_relation_size(indexrelname) DESC`
  );
  
  return result.rows;
};

/**
 * Get slow queries count
 */
const getSlowQueryCount = async (minDurationMs = 1000) => {
  const result = await pool.query(
    `SELECT 
      COUNT(*) as count,
      AVG(mean_exec_time) as avg_time,
      MAX(mean_exec_time) as max_time
     FROM pg_stat_statements
     WHERE mean_exec_time > $1`,
    [minDurationMs]
  );
  
  return result.rows[0];
};

/**
 * Get database size
 */
const getDatabaseSize = async (dbName) => {
  const result = await pool.query(
    `SELECT pg_size_pretty(pg_database_size($1)) as size`,
    [dbName || 'postgres']
  );
  
  return result.rows[0];
};

/**
 * Get active connections count
 */
const getActiveConnections = async () => {
  const result = await pool.query(
    `SELECT COUNT(*) as count FROM pg_stat_activity WHERE state = 'active'`
  );
  
  return result.rows[0].count;
};

/**
 * Kill idle connections
 */
const killIdleConnections = async (idleTimeSeconds = 300) => {
  const result = await pool.query(
    `SELECT pg_terminate_backend(pid) 
     FROM pg_stat_activity 
     WHERE state = 'idle' 
     AND query_start < now() - interval '${idleTimeSeconds} seconds'`
  );
  
  return result.rowCount;
};

/**
 * Analyze all tables
 */
const analyzeAllTables = async () => {
  try {
    await pool.query('ANALYZE');
    logger.info('All tables analyzed');
  } catch (error) {
    logger.error('Failed to analyze tables', { error: error.message });
    throw error;
  }
};

/**
 * Vacuum full database
 */
const vacuumDatabase = async () => {
  try {
    await pool.query('VACUUM FULL ANALYZE');
    logger.info('Database vacuumed');
  } catch (error) {
    logger.error('Failed to vacuum database', { error: error.message });
    throw error;
  }
};

module.exports = {
  executeTransaction,
  getTableStats,
  getAllTableStats,
  getUnusedIndexes,
  getSlowQueryCount,
  getDatabaseSize,
  getActiveConnections,
  killIdleConnections,
  analyzeAllTables,
  vacuumDatabase,
};
