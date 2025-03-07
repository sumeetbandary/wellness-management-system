const rateLimit = require('express-rate-limit');
const Redis = require('ioredis');

let redis = null;

const initRedis = () => {
  if (!redis) {
    try {
      redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
          if (process.env.NODE_ENV === 'test') return null; // Don't retry in test environment
          return Math.min(times * 50, 2000); // Exponential backoff
        }
      });

      redis.on('error', (err) => {
        console.error('Redis connection error:', err);
        if (process.env.NODE_ENV === 'test') {
          redis = null;
        }
      });
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      redis = null;
    }
  }
  return redis;
};

// Custom Redis store implementation
const RedisStore = {
  init: function() {
    return Promise.resolve();
  },
  increment: async function(key) {
    if (!redis) return { totalHits: 1, resetTime: new Date(Date.now() + (15 * 60 * 1000)) };
    try {
      const hits = await redis.incr(key);
      await redis.expire(key, 15 * 60); // 15 minutes in seconds
      return {
        totalHits: hits,
        resetTime: new Date(Date.now() + (15 * 60 * 1000))
      };
    } catch (error) {
      console.error('Redis increment error:', error);
      return { totalHits: 1, resetTime: new Date(Date.now() + (15 * 60 * 1000)) };
    }
  },
  decrement: async function(key) {
    if (!redis) return;
    try {
      return redis.decr(key);
    } catch (error) {
      console.error('Redis decrement error:', error);
    }
  },
  resetKey: async function(key) {
    if (!redis) return;
    try {
      return redis.del(key);
    } catch (error) {
      console.error('Redis reset error:', error);
    }
  },
  shutdown: async function() {
    if (!redis) return;
    try {
      return redis.quit();
    } catch (error) {
      console.error('Redis shutdown error:', error);
    }
  }
};

// Initialize Redis connection
initRedis();

// Create the rate limiter middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  store: RedisStore,
  skipFailedRequests: true, // Don't count failed requests
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      message: 'Too many requests, please try again later.'
    });
  }
});

// Create a wrapper middleware that handles errors
const rateLimiterMiddleware = (req, res, next) => {
  try {
    limiter(req, res, next);
  } catch (error) {
    console.error('Rate limiter error:', error);
    next(); // Continue without rate limiting if there's an error
  }
};

module.exports = {
  rateLimiter: rateLimiterMiddleware,
  redis: initRedis
};