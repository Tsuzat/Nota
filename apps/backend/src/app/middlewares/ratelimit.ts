import { redis } from 'bun';
import type { Context, Next } from 'hono';
import { getConnInfo } from 'hono/bun';
import { logwarn } from '../../logging';

const RATE_LIMIT_WINDOW = 60; // 1 minute
const MAX_REQUESTS = 100;
const BAN_DURATION = 24 * 60 * 60; // 24 hours

/**
 * Rate Limit Middleware
 * - Limits requests per host to 100 requests per minute.
 * - Bans the user for 24 hours if they exceed the limit.
 */
export const rateLimitHost = async (c: Context, next: Next) => {
  const info = getConnInfo(c);
  const ip = info.remote.address || 'unknown';
  // Check if IP is already banned (Fail fast)
  // Note: banMiddleware usually handles this globally, but checking here ensures enforcement
  // if this middleware is used in isolation.
  const banKey = `ban:${ip}`;
  if (await redis.exists(banKey)) {
    logwarn(`[RATE LIMIT] IP ${ip} is banned`);
    return c.text('Forbidden', 403);
  }
  const rateLimitKey = `ratelimit:${ip}`;
  try {
    const currentCount = await redis.incr(rateLimitKey);

    // If this is the first request in the window, set the expiry
    if (currentCount === 1) {
      await redis.expire(rateLimitKey, RATE_LIMIT_WINDOW);
    }

    if (currentCount > MAX_REQUESTS) {
      logwarn(`[RATE LIMIT] Banning IP ${ip} for exceeding ${MAX_REQUESTS} req/min`);
      // Ban the user
      await redis.set(banKey, 'true');
      await redis.expire(banKey, BAN_DURATION);
      return c.text('Too Many Requests', 429);
    }
  } catch (error) {
    // Fail open if Redis errors to avoid blocking legitimate traffic during outages
    console.error('Rate limit error:', error);
  }
  await next();
};
