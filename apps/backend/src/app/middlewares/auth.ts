import { eq } from 'drizzle-orm';
import type { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { DB } from '../../db';
import { sessions, users } from '../../db/schema';
import { verifyAccessToken } from '../../lib/jwt';
import { logerror, logwarn } from '../../logging';

export const authMiddleware = async (c: Context, next: Next) => {
  let token = getCookie(c, 'access_token');
  // check the token from header if not found in cookie
  if (!token) {
    token = c.req.header('Authorization')?.split(' ')[1]?.replace('Bearer ', '');
  }
  if (!token) {
    logwarn('Unauthorized: No token provided');
    return c.json({ error: 'Unauthorized: No token provided' }, 401);
  }
  try {
    const payload = await verifyAccessToken(token);
    const session = await DB.query.sessions.findFirst({
      where: eq(sessions.id, payload.sessionId),
    });
    if (!session || session.revoked || session.expiresAt < new Date()) {
      logwarn('Session not found or revoked');
      return c.json({ error: 'Session not found or revoked' }, 401);
    }
    // Fetch user details for storage/credits
    const user = await DB.query.users.findFirst({
      where: eq(users.id, payload.sub),
      columns: {
        subscriptionPlan: true,
        assignedStorage: true,
        usedStorage: true,
        aiCredits: true,
        externalCustomerId: true,
        nextBillingAt: true,
        subscriptionType: true,
      },
    });
    if (!user) {
      logwarn('User not found');
      return c.json({ error: 'User not found' }, 401);
    }
    c.set('userId', payload.sub);
    c.set('sessionId', payload.sessionId);
    c.set('userEmail', payload.email);
    c.set('user', user);
    await next();
  } catch (e) {
    logerror('Error verifying token:', e);
    return c.json({ error: 'Invalid or expired token' }, 403);
  }
};
