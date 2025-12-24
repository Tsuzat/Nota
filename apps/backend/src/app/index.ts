import { Hono } from 'hono';
import ai from './routes/ai';
import auth from './routes/auth';
import notes from './routes/notes';
import storage from './routes/storage';
import user from './routes/user';
import userworkspaces from './routes/userworkspaces';
import workspaces from './routes/workspaces';

export type Variables = {
  userId: string;
  userEmail: string;
  user: {
    assignedStorage: number;
    usedStorage: number;
    aiCredits: number;
    subscriptionPlan: 'free' | 'pro';
  };
};

export const app = new Hono<{ Variables: Variables }>();

app.get('/health', (c) => c.json({ status: 'ok' }, 200));

app.route('/auth', auth);
app.route('api/user', user);
app.route('api/db/userworkspaces', userworkspaces);
app.route('api/db/workspaces', workspaces);
app.route('api/db/notes', notes);
app.route('api/storage', storage);
app.route('api/ai', ai);
