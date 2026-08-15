import { redis } from "bun";

/**
 * Cache utilities for Nota
 */
export const cache = {
  /**
   * Get data from cache
   * @param key cache key
   * @returns data if found in cache
   */
  get: async <T>(key: string) => {
    const v = await redis.get(key);
    return v ? (JSON.parse(v) as T) : null;
  },
  /**
   * Set data in cache
   * @param key cache key
   * @param value data to set in cache
   * @param ttlSeconds time to live in seconds
   */
  set: async (key: string, value: unknown, ttlSeconds: number) =>
    redis.set(key, JSON.stringify(value), "EX", ttlSeconds),
  /**
   * Delete data from cache
   * @param key cache key
   */
  del: (key: string) => redis.del(key),
  /**
   * Increment data in cache
   * @param key cache key
   * @param amount amount to increment
   */
  incrby: (key: string, amount: number) => redis.incrby(key, amount),
};

export * from "./workspace";
