import { createClient } from 'redis';
import config from './index.js';

const redisClient = createClient({
  url: `redis://${config.redis.host}:${config.redis.port}`,
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

const connectRedis = async () => {
  await redisClient.connect();
  console.log('Redis connected');
};

export { redisClient, connectRedis };
