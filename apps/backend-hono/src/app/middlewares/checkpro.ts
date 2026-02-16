import type { Context, Next } from 'hono';

export const proMiddleWare = async (c: Context, next: Next) => {
  const user = c.get('user');
  if (user.subscriptionPlan === 'free') {
    return c.json({ error: 'Pro feature is not available for free users' }, 403);
  }
  await next();
};
