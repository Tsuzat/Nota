import { createClient } from 'redis';
import { env } from '$env/dynamic/private';

export const redisClient = createClient({ url: env.REDIS_URL }).on('error', (err) =>
  console.error('Redis Client Error', err)
);
