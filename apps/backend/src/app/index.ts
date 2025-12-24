import { Hono } from 'hono';
import auth from './routes/auth';
import user from './routes/user';
import userworkspaces from './routes/userworkspaces';

type Variables = {
  userId: string;
  userEmail: string;
};

export const app = new Hono<{ Variables: Variables }>();

app.get('/health', (c) => c.json({ status: 'ok' }, 200));

app.route('/auth', auth);
app.route('/user', user);
app.route('/api/userworkspaces', userworkspaces);
