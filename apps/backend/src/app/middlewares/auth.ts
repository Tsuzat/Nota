import { eq } from 'drizzle-orm';
import type { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { DB } from '../../db';
import { sessions, users } from '../../db/schema';
import { verifyAccessToken } from '../../lib/jwt';
import { logerror } from '../../logging';

export const authMiddleware = async (c: Context, next: Next) => {
  let token = getCookie(c, 'access_token');
  // check the token from header if not found in cookie
  if (!token) {
    token = c.req.header('Authorization')?.split(' ')[1];
  }
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  try {
    const payload = await verifyAccessToken(token);
    const session = await DB.query.sessions.findFirst({
      where: eq(sessions.id, payload.sessionId),
    });
    if (!session || session.revoked) {
      return c.json({ error: 'Session not found or revoked' }, 401);
    }
    // Fetch user details for storage/credits
    const user = await DB.query.users.findFirst({
      where: eq(users.id, payload.sub),
    });
    if (!user) {
      return c.json({ error: 'User not found' }, 401);
    }
    c.set('userId', payload.sub);
    c.set('userEmail', payload.email);
    c.set('user', user);
    await next();
  } catch (e) {
    logerror('Error verifying token:', e);
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
};
