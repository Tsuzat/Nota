import { Hono } from 'hono';
import { getConnInfo } from 'hono/bun';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { rateLimiter } from 'hono-rate-limiter';
import { CROSS_ORIGIN } from '../constants';
import { loggerMiddleware } from './middlewares/logger';
import { sanitizationMiddleware } from './middlewares/sanitization';
import ai from './routes/ai';
import auth from './routes/auth';
import notes from './routes/notes';
import payment from './routes/payment';
import storage from './routes/storage';
import user from './routes/user';
import userworkspaces from './routes/userworkspaces';
import workspaces from './routes/workspaces';

export type Variables = {
  userId: string;
  userEmail: string;
  sessionId: string;
  user: {
    assignedStorage: number;
    usedStorage: number;
    aiCredits: number;
    subscriptionPlan: 'free' | 'pro';
    externalCustomerId: string | null;
    nextBillingAt: Date | null;
    subscriptionType: 'monthly' | 'yearly' | null;
  };
};

export const app = new Hono<{ Variables: Variables }>();

// Apply rate limiting middleware
app.use(
  rateLimiter({
    windowMs: 1 * 60 * 1000, // 1 Minute
    limit: 100,
    keyGenerator: (c) => getConnInfo(c).remote.address || c.req.header('x-forwarded-for') || 'unknown',
  })
);
// Security Middlewares
app.use('*', secureHeaders());
app.use('*', cors({ origin: CROSS_ORIGIN, credentials: true }));
app.use('*', sanitizationMiddleware);
app.use('*', loggerMiddleware);

app.get('/api/health', (c) => {
  return c.json({ status: 'ok' }, 200);
});

app.route('api/auth', auth);
app.route('api/user', user);
app.route('api/db/userworkspaces', userworkspaces);
app.route('api/db/workspaces', workspaces);
app.route('api/db/notes', notes);
app.route('api/storage', storage);
app.route('api/ai', ai);
app.route('api/payment', payment);
