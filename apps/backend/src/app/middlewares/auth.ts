import { eq } from 'drizzle-orm';
import type { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { DB } from '../../db';
import { users } from '../../db/schema';
import { verifyAccessToken } from '../../lib/jwt';

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

    // Fetch user details for storage/credits
    const [user] = await DB.select({
      assignedStorage: users.assignedStorage,
      usedStorage: users.usedStorage,
      aiCredits: users.aiCredits,
      subscriptionPlan: users.subscriptionPlan,
    })
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);

    if (!user) {
      return c.json({ error: 'User not found' }, 401);
    }
    c.set('userId', payload.sub);
    c.set('userEmail', payload.email);
    c.set('user', user);
    await next();
  } catch (e) {
    console.error('Error verifying token:', e);
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
};
