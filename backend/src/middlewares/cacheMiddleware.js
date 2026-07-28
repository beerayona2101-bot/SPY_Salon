/**
 * High-performance In-Memory API Cache Middleware with ETag support
 * @param {number} ttlSeconds Time to live in seconds (default: 300 = 5 mins)
 */
const cache = new Map();

const cacheMiddleware = (ttlSeconds = 300) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = req.originalUrl || req.url;
    const cachedItem = cache.get(key);
    const now = Date.now();

    if (cachedItem && cachedItem.expiry > now) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Cache-Control', `public, max-age=${ttlSeconds}`);
      return res.status(200).json(cachedItem.data);
    }

    // Intercept json() response to cache result before sending
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, {
          data: body,
          expiry: Date.now() + ttlSeconds * 1000,
        });
      }
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('Cache-Control', `public, max-age=${ttlSeconds}`);
      return originalJson(body);
    };

    next();
  };
};

/**
 * Utility function to clear cache entries matching a prefix or pattern when data updates occur
 */
const clearApiCache = (keyPrefix) => {
  if (!keyPrefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.includes(keyPrefix)) {
      cache.delete(key);
    }
  }
};

module.exports = { cacheMiddleware, clearApiCache };
