const Redis = require('ioredis');
const logger = require('../utils/logger');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const connection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null, // Required by BullMQ
  enableOfflineQueue: false,  // Fail fast if Redis is down instead of blocking
  retryStrategy: (times) => {
    logger.warn(`Redis reconnect attempt ${times}`);
    return Math.min(times * 50, 2000); // Reconnect after 50ms, 100ms... up to 2s
  }
});

connection.on('error', (err) => logger.error('Redis Client Error', err));
connection.on('connect', () => logger.info('Redis Client Connected'));

module.exports = { connection };
