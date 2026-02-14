const { RateLimitError } = require('./errorHandler');
const logger = require('./logger')('middleware');

// Rate Limiting Map: stores request counts per IP
const rateLimitMap = new Map();

const rateLimit = (maxRequests = 100, windowMs = 60000) => {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!rateLimitMap.has(ip)) {
      rateLimitMap.set(ip, []);
    }

    const requests = rateLimitMap.get(ip);
    const recentRequests = requests.filter((time) => now - time < windowMs);

    if (recentRequests.length >= maxRequests) {
      logger.warn('Rate limit exceeded', { ip, requests: recentRequests.length });
      throw new RateLimitError();
    }

    recentRequests.push(now);
    rateLimitMap.set(ip, recentRequests);
    next();
  };
};

const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;

  res.send = function (data) {
    const duration = Date.now() - startTime;
    logger.info('API Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
    return originalSend.call(this, data);
  };

  next();
};

const errorHandler = (error, req, res, next) => {
  const { formatError } = require('./errorHandler');
  const formattedError = formatError(error);
  
  logger.error('Request error', {
    method: req.method,
    path: req.path,
    error: formattedError,
  });

  res.status(formattedError.statusCode).json(formattedError);
};

const corsMiddleware = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  
  next();
};

const securityHeaders = (req, res, next) => {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
};

module.exports = {
  rateLimit,
  requestLogger,
  errorHandler,
  corsMiddleware,
  securityHeaders,
};
