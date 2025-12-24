import 'dotenv/config';
import { app } from './app';
import { PORT } from './constants';

const server = Bun.serve({
  fetch: app.fetch,
  port: PORT,
});

console.log(`🚀 Server running at ${server.url}`);
