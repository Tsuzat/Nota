import { Hono } from 'hono';
import auth from './routes/auth';
import user from './routes/user';
import userworkspaces from './routes/userworkspaces';
import workspaces from './routes/workspaces';
import notes from './routes/notes';
import storage from './routes/storage';

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
app.route('/user', user);
app.route('/db/userworkspaces', userworkspaces);
app.route('/db/workspaces', workspaces);
app.route('/db/notes', notes);
app.route('/storage', storage);
