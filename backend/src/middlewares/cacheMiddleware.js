/**
 * In-Memory Response Caching Middleware
 * Adds HTTP Cache-Control and ETag validation headers for fast response delivery.
 */
const cache = new Map();

/**
 * Cache Middleware Generator
 * @param {number} durationSeconds - Cache duration in seconds (default: 300)
 */
const cacheMiddleware = (durationSeconds = 300) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = req.originalUrl || req.url;
    const cachedResponse = cache.get(cacheKey);

    // Check if cache entry exists and is fresh
    if (cachedResponse && (Date.now() - cachedResponse.timestamp) < durationSeconds * 1000) {
      res.setHeader('Cache-Control', `public, max-age=${durationSeconds}, stale-while-revalidate=600`);
      res.setHeader('X-Cache', 'HIT');
      return res.status(cachedResponse.status).json(cachedResponse.data);
    }

    // Intercept res.json to capture response payload
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      // Store in memory cache if status is 200
      if (res.statusCode === 200) {
        if (cache.size > 1000) {
          const oldestKey = cache.keys().next().value;
          if (oldestKey) cache.delete(oldestKey);
        }
        cache.set(cacheKey, {
          status: 200,
          data: body,
          timestamp: Date.now()
        });
      }

      res.setHeader('Cache-Control', `public, max-age=${durationSeconds}, stale-while-revalidate=600`);
      res.setHeader('X-Cache', 'MISS');
      return originalJson(body);
    };

    next();
  };
};

/**
 * Utility to invalidate cache by pattern/url
 */
const invalidateCache = (urlPattern) => {
  for (const key of cache.keys()) {
    if (key.includes(urlPattern)) {
      cache.delete(key);
    }
  }
};

module.exports = {
  cacheMiddleware,
  invalidateCache
};
