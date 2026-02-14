// API Constants
const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 10;
const MAX_QUERY_DEPTH = 10;
const REQUEST_TIMEOUT = 30000;
const TOKEN_EXPIRY = '24h';

// Error Messages
const ERRORS = {
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Insufficient permissions',
  NOT_FOUND: 'Resource not found',
  DUPLICATE: 'Resource already exists',
  INVALID_INPUT: 'Invalid input provided',
  DATABASE_ERROR: 'Database operation failed',
  RATE_LIMITED: 'Too many requests',
};

// Cache Keys
const CACHE_KEYS = {
  USER: 'user:',
  POST: 'post:',
  COMMENT: 'comment:',
};

// Database Limits
const DB_LIMITS = {
  MAX_BATCH_SIZE: 1000,
  QUERY_TIMEOUT: 5000,
  CONNECTION_POOL_SIZE: 20,
};

module.exports = {
  MAX_PAGE_SIZE,
  DEFAULT_PAGE_SIZE,
  MAX_QUERY_DEPTH,
  REQUEST_TIMEOUT,
  TOKEN_EXPIRY,
  ERRORS,
  CACHE_KEYS,
  DB_LIMITS,
};
