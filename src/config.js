// Configuration Management
require('dotenv').config();

const config = {
  app: {
    name: process.env.APP_NAME || 'GraphQL API',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '4000', 10),
    host: process.env.HOST || 'localhost',
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/graphql_db',
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      max: parseInt(process.env.DB_POOL_MAX || '20', 10),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000', 10),
    },
    ssl: process.env.DB_SSL === 'true',
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    jwtExpiry: process.env.JWT_EXPIRY || '24h',
    passwordSaltRounds: parseInt(process.env.PASSWORD_SALT_ROUNDS || '10', 10),
  },
  server: {
    graphql: {
      introspection: process.env.GRAPHQL_INTROSPECTION !== 'false',
      debug: process.env.GRAPHQL_DEBUG === 'true',
      requestTimeout: parseInt(process.env.GRAPHQL_REQUEST_TIMEOUT || '30000', 10),
    },
    cors: {
      origin: (process.env.CORS_ORIGIN || '*').split(','),
      credentials: process.env.CORS_CREDENTIALS === 'true',
    },
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10),
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    },
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    prettyPrint: process.env.LOG_PRETTY === 'true',
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '60000', 10),
    enabled: process.env.CACHE_ENABLED !== 'false',
  },
};

// Validate required configuration
const validateConfig = () => {
  const errors = [];
  
  if (!config.database.url && process.env.NODE_ENV === 'production') {
    errors.push('DATABASE_URL is required in production');
  }
  
  if (!config.auth.jwtSecret && process.env.NODE_ENV === 'production') {
    errors.push('JWT_SECRET is required in production');
  }
  
  if (errors.length > 0) {
    throw new Error('Configuration validation failed:\n' + errors.join('\n'));
  }
};

validateConfig();

module.exports = config;
