import { Hono } from 'hono';
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

app.get('/api/health', (c) => c.json({ status: 'ok' }, 200));

app.route('api/auth', auth);
app.route('api/user', user);
app.route('api/db/userworkspaces', userworkspaces);
app.route('api/db/workspaces', workspaces);
app.route('api/db/notes', notes);
app.route('api/storage', storage);
app.route('api/ai', ai);
app.route('api/payment', payment);
