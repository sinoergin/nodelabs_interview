import { createClient } from 'redis';
import config from './index.js';
import logger from './logger.js';

const redisClient = createClient({
    host: config.redis.host,
    port: config.redis.port,
});

const subscriber = redisClient.duplicate();

redisClient.on('error', (err) => logger.error('Redis Client Error', err));
subscriber.on('error', (err) => logger.error('Redis Subscriber Error', err));

const connectRedis = async () => {
    await Promise.all([redisClient.connect(), subscriber.connect()]);
    logger.info('Redis connected (client and subscriber)');
};

export { redisClient, subscriber, connectRedis };
