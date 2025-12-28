import 'dotenv/config';
import { init } from '@sentry/bun';
import { app } from './app';
import { PORT, SENTRY_DSN } from './constants';

init({
  dsn: SENTRY_DSN,
  tracesSampleRate: 1.0,
  enableLogs: true,
});

const server = Bun.serve({
  fetch: app.fetch,
  port: PORT,
});

console.log(`🚀 Server running at ${server.url}`);
