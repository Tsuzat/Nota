import { eq, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { DB } from '../../db';
import { users } from '../../db/schema';
import type { Variables } from '..';
import { authMiddleware } from '../middlewares/auth';

const app = new Hono<{ Variables: Variables }>();

app.get('/redeem-ai-credits', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const user = c.get('user');
  if (user.aiCredits > 0) {
    return c.json({ error: 'User already has AI credits' }, 400);
  }
  await DB.update(users)
    .set({ aiCredits: sql`${users.aiCredits} + ${10000}` })
    .where(eq(users.id, userId));
  return c.json({ received: true });
});

export default app;
