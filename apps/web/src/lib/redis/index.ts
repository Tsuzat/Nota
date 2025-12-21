import { createClient } from 'redis';
import { REDIS_URL } from '$env/static/private';

export const redisClient = createClient({ url: REDIS_URL }).on('error', (err) =>
  console.error('Redis Client Error', err)
);
