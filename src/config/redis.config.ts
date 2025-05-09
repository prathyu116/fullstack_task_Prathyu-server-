import Redis, { RedisOptions } from 'ioredis';
import { config } from './index';
import { logger } from '../utils/logger';

const redisConfig: RedisOptions = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  lazyConnect: true, 
};

if (config.redis.username && config.redis.username !== 'default') {
    redisConfig.username = config.redis.username;
}


export const redisClient = new Redis(redisConfig);

redisClient.on('connect', () => {
  logger.info('Redis connected successfully.');
});

redisClient.on('error', (err) => {
  logger.error('Redis connection error:', err);
  process.exit(1); 
});

export const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
  }
};