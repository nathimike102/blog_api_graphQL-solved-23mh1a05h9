require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

if (process.env.NODE_ENV === 'development') {
  const originalQuery = pool.query.bind(pool);
  pool.query = async (text, params, callback) => {
    const queryText = typeof text === 'string' ? text : text?.text;
    const queryParams = Array.isArray(params) ? params : text?.values;
    if (queryText) {
      console.log('[SQL]', queryText);
    }
    if (queryParams && queryParams.length > 0) {
      console.log('[Values]', queryParams);
    }
    return originalQuery(text, params, callback);
  };
  pool.on('error', (err) => {
    console.error('[DB Error]', err);
  });
}

module.exports = pool;
