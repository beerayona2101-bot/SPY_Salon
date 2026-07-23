/**
 * Simple In-Memory Rate Limiter Middleware for SPY Salon REST API
 */
const ApiError = require('../utils/apiError');

const requestsMap = new Map();

const rateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes default
  const max = options.max || 100; // 100 requests per windowMs default
  const message = options.message || 'Too many requests from this IP, please try again later.';

  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    // Bypass rate limiter for localhost/development and polling endpoints
    if (
      ip === '127.0.0.1' || 
      ip === '::1' || 
      ip.includes('127.0.0.1') || 
      req.originalUrl.includes('notifications') || 
      req.originalUrl.includes('health') || 
      req.originalUrl.includes('analytics')
    ) {
      return next();
    }

    const now = Date.now();

    if (!requestsMap.has(ip)) {
      requestsMap.set(ip, []);
    }

    const timestamps = requestsMap.get(ip).filter(t => now - t < windowMs);
    timestamps.push(now);
    requestsMap.set(ip, timestamps);

    if (timestamps.length > max) {
      return next(ApiError.badRequest(message, [message]));
    }

    next();
  };
};

module.exports = rateLimiter;
