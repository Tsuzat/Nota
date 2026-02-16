import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { DB } from '../../db';
import { users } from '../../db/schema';
import type { Variables } from '..';
import { authMiddleware } from '../middlewares/auth';

const user = new Hono<{ Variables: Variables }>();

user.use('*', authMiddleware);

user.get('/me', async (c) => {
  const userId = c.get('userId');
  const userData = await DB.query.users.findFirst({
    where: eq(users.id, userId),
  });
  if (!userData) {
    return c.json({ error: 'User not found' }, 404);
  }
  return c.json({ user: userData });
});

export default user;
