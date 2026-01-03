import { Hono } from 'hono';
import { getConnInfo } from 'hono/bun';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { rateLimiter } from 'hono-rate-limiter';
import { CROSS_ORIGIN, DESKTOP_APP_IDENTIFIER, FRONTEND_URL } from '../constants';
import { banMiddleware } from './middlewares/ban';
import { loggerMiddleware } from './middlewares/logger';
import { sanitizationMiddleware } from './middlewares/sanitization';
import ai from './routes/ai';
import auth from './routes/auth';
import notes from './routes/notes';
import payment from './routes/payment';
import promotion from './routes/promotion';
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
app.use(
  '*',
  cors({
    origin: (origin, c) => {
      const allowedOrigins = ['https://www.nota.ink', 'https://nota.ink'];
      CROSS_ORIGIN.split(',').forEach((origin) => {
        allowedOrigins.push(origin.trim());
      });
      if (!origin) return allowedOrigins[0]; // Fallback if no origin
      if (allowedOrigins.includes(origin)) return origin;

      // Check for Desktop Token bypass
      const desktopToken = c.req.header('X-Nota-Desktop-Identifier');
      if (DESKTOP_APP_IDENTIFIER && desktopToken === DESKTOP_APP_IDENTIFIER) {
        return origin;
      }

      return allowedOrigins[0]; // or null to block
    },
    credentials: true,
  })
);
app.use('*', sanitizationMiddleware);
app.use('*', loggerMiddleware);
app.use('*', banMiddleware);

app.get('/', (c) => {
  return c.redirect(FRONTEND_URL, 301);
});

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
app.route('api/promotion', promotion);
