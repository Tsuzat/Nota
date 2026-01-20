import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { auth } from '../auth';
import { CROSS_ORIGIN, DESKTOP_APP_IDENTIFIER, FRONTEND_URL } from '../constants';
import type { Session, User } from '../db/schema';
import { loginfo } from '../logging';
import { banMiddleware } from './middlewares/ban';
import { loggerMiddleware } from './middlewares/logger';
import { rateLimitHost } from './middlewares/ratelimit';
import { sanitizationMiddleware } from './middlewares/sanitization';
import ai from './routes/ai';
import notes from './routes/notes';
import promotion from './routes/promotion';
import storage from './routes/storage';
import user from './routes/user';
import userworkspaces from './routes/userworkspaces';
import workspaces from './routes/workspaces';

export type Variables = {
  user: User;
  session: Session;
};

export const app = new Hono<{ Variables: Variables }>();

// Security Middlewares
app.use('*', secureHeaders());

app.get('/', (c) => {
  return c.redirect(FRONTEND_URL, 301);
});

app.get('/api/health', (c) => {
  return c.json({ status: 'ok' }, 200);
});

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
      if (desktopToken === DESKTOP_APP_IDENTIFIER) {
        loginfo('This call is from Nota Desktop');
        return origin;
      }
      return allowedOrigins[0]; // or null to block
    },
    credentials: true,
  })
);
app.use('*', sanitizationMiddleware, loggerMiddleware, banMiddleware, rateLimitHost);

app.on(['POST', 'GET'], '/api/auth/*', (c) => {
  return auth.handler(c.req.raw);
});
app.route('api/user', user);
app.route('api/db/userworkspaces', userworkspaces);
app.route('api/db/workspaces', workspaces);
app.route('api/db/notes', notes);
app.route('api/storage', storage);
app.route('api/ai', ai);
app.route('api/promotion', promotion);
