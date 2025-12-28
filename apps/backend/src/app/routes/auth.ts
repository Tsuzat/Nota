import { githubAuth } from '@hono/oauth-providers/github';
import { googleAuth } from '@hono/oauth-providers/google';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { getConnInfo } from 'hono/bun';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { z } from 'zod';
import {
  BACKEND_URL,
  COOKIE_OPTIONS,
  FRONTEND_URL,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
} from '../../constants';
import { DB } from '../../db';
import { sessions, type User, users } from '../../db/schema';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../lib/jwt';
import { logerror } from '../../logging';

type GitHubUser = {
  id: number;
  email: string | null;
  name: string | null;
  avatar_url: string;
};

type GoogleUser = {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
};

const auth = new Hono<{
  Variables: {
    'user-github': GitHubUser;
    'user-google': GoogleUser;
  };
}>();

// Schemas
const signupSchema = z.object({
  email: z.email(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(64)
    .regex(/^[a-zA-Z0-9!@#$%^&*(),.?":{}|<>-]+$/, 'Password must contain letters, numbers, and special characters'),
  name: z.string().min(1).optional(),
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string(),
});

auth.get('/login/:provider', (c) => {
  const provider = c.req.param('provider');
  const platform = c.req.query('platform');

  if (platform === 'desktop') {
    setCookie(c, 'auth_platform', platform, { ...COOKIE_OPTIONS, maxAge: 60 * 5 });
  }

  return c.redirect(`${BACKEND_URL}/auth/oauth/${provider}`);
});

// Signup Endpoint
auth.post('/signup', zValidator('json', signupSchema), async (c) => {
  const { email, password, name } = c.req.valid('json');

  try {
    const existingUser = await DB.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return c.json({ error: 'User already exists' }, 409);
    }

    const encryptedPassword = await Bun.password.hash(password);

    const [newUser] = await DB.insert(users)
      .values({
        email,
        name: name || email.split('@')[0],
        encryptedPassword,
        provider: 'credentials',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (!newUser) {
      return c.json({ error: 'Failed to create user' }, 500);
    }

    return c.json(
      {
        message: 'User created successfully. Please login',
      },
      201
    );
  } catch (error) {
    logerror('Signup error:', error);
    return c.json({ error: 'Failed to create user' }, 500);
  }
});

// Login Endpoint
auth.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');

  try {
    const user = await DB.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user || !user.encryptedPassword) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    const isMatch = await Bun.password.verify(password, user.encryptedPassword);

    if (!isMatch) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }
    const info = getConnInfo(c);
    const session = await DB.insert(sessions)
      .values({
        userId: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        ip: info.remote.address,
        userAgent: info.remote.addressType,
      })
      .returning({ id: sessions.id });
    if (!session || !session[0] || session.length === 0) {
      return c.json({ error: 'Failed to create session' }, 500);
    }
    const sessionId = session[0].id;
    const accessToken = await generateAccessToken(user.id, user.email, sessionId);
    const refreshToken = await generateRefreshToken(user.id, user.email, sessionId);

    setCookie(c, 'access_token', accessToken, { ...COOKIE_OPTIONS, maxAge: 6 * 60 * 60 });
    setCookie(c, 'refresh_token', refreshToken, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 });

    return c.json({
      message: 'Login successful',
    });
  } catch (error) {
    logerror('Login error:', error);
    return c.json({ error: 'Failed to login' }, 500);
  }
});

auth.use(
  '/oauth/github',
  githubAuth({
    client_id: GITHUB_CLIENT_ID,
    client_secret: GITHUB_CLIENT_SECRET,
    scope: ['user:email'],
    oauthApp: true,
    redirect_uri: `${BACKEND_URL}/auth/oauth/github`,
  }),
  async (c) => {
    const githubUser = c.get('user-github');
    if (!githubUser) {
      return c.json({ error: 'GitHub authentication failed' }, 401);
    }

    const { id: providerId, email, name, avatar_url: avatarUrl } = githubUser;

    if (!email) {
      return c.json({ error: 'GitHub account must have an email' }, 400);
    }

    // upsert the user in database
    let user: User | undefined;
    try {
      const [fetchedUser] = await DB.insert(users)
        .values({
          email,
          name: name || email.split('@')[0],
          avatarUrl,
          emailVerified: true,
          emailVerifiedAt: new Date(),
          provider: 'github',
          providerId: String(providerId),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: users.email,
          set: {
            name: name || email.split('@')[0],
            avatarUrl,
            provider: 'github',
            providerId: String(providerId),
            updatedAt: new Date(),
          },
        })
        .returning();
      user = fetchedUser;
    } catch (error) {
      logerror(error);
      return c.json({ error: 'Something went wrong when upserting user' }, 505);
    }

    if (!user) {
      return c.json({ error: 'Something went wrong when upserting user' }, 505);
    }
    const info = getConnInfo(c);
    const session = await DB.insert(sessions)
      .values({
        userId: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        ip: info.remote.address,
        userAgent: info.remote.addressType,
      })
      .returning({ id: sessions.id });
    if (!session || !session[0] || session.length === 0) {
      return c.json({ error: 'Failed to create session' }, 500);
    }
    const sessionId = session[0].id;
    const accessToken = await generateAccessToken(user.id, user.email, sessionId);
    const refreshToken = await generateRefreshToken(user.id, user.email, sessionId);

    setCookie(c, 'access_token', accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 6 * 60 * 60,
    });
    setCookie(c, 'refresh_token', refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60,
    });

    const platform = getCookie(c, 'auth_platform');
    if (platform === 'desktop') {
      deleteCookie(c, 'auth_platform');
      return c.redirect(`nota://auth/callback?access_token=${accessToken}&refresh_token=${refreshToken}`);
    }

    return c.redirect(FRONTEND_URL || 'https://www.nota.ink');
  }
);

auth.use(
  '/oauth/google',
  googleAuth({
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    scope: ['openid', 'email', 'profile'],
    redirect_uri: `${BACKEND_URL}/auth/oauth/google`,
  }),
  async (c) => {
    const googleUser = c.get('user-google');
    if (!googleUser) {
      return c.json({ error: 'Google authentication failed' }, 401);
    }

    const { id: providerId, email, name, picture: avatarUrl } = googleUser;

    if (!email) {
      return c.json({ error: 'Google account must have an email' }, 400);
    }

    // upsert the user in database
    let user: User | undefined;
    try {
      const [fetchedUser] = await DB.insert(users)
        .values({
          email,
          name: name || email.split('@')[0],
          avatarUrl,
          provider: 'google',
          providerId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: users.email,
          set: {
            name: name || email.split('@')[0],
            avatarUrl,
            provider: 'google',
            providerId,
            updatedAt: new Date(),
          },
        })
        .returning();
      user = fetchedUser;
    } catch (error) {
      logerror(error);
      return c.json({ error: 'Something went wrong when upserting user' }, 505);
    }

    if (!user) {
      return c.json({ error: 'Something went wrong when upserting user' }, 505);
    }

    const info = getConnInfo(c);
    const session = await DB.insert(sessions)
      .values({
        userId: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        ip: info.remote.address,
        userAgent: info.remote.addressType,
      })
      .returning({ id: sessions.id });
    if (!session || !session[0] || session.length === 0) {
      return c.json({ error: 'Failed to create session' }, 500);
    }
    const sessionId = session[0].id;
    const accessToken = await generateAccessToken(user.id, user.email, sessionId);
    const refreshToken = await generateRefreshToken(user.id, user.email, sessionId);

    setCookie(c, 'access_token', accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 6 * 60 * 60,
    });
    setCookie(c, 'refresh_token', refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60,
    });

    const platform = getCookie(c, 'auth_platform');
    if (platform === 'desktop') {
      deleteCookie(c, 'auth_platform');
      return c.redirect(`nota://auth/callback?access_token=${accessToken}&refresh_token=${refreshToken}`);
    }

    return c.redirect(FRONTEND_URL || 'https://www.nota.ink');
  }
);

auth.post('/refresh', async (c) => {
  const refreshToken = getCookie(c, 'refresh_token');

  if (!refreshToken) {
    return c.json({ error: 'No refresh token' }, 401);
  }

  try {
    const payload = await verifyRefreshToken(refreshToken);
    const user = await DB.query.users.findFirst({
      where: eq(users.id, payload.sub),
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 401);
    }
    const info = getConnInfo(c);
    const session = await DB.insert(sessions)
      .values({
        userId: user.id,
        updatedAt: new Date(),
        refreshedAt: new Date(),
        ip: info.remote.address,
        userAgent: info.remote.addressType,
      })
      .returning({ id: sessions.id });
    if (!session || !session[0] || session.length === 0) {
      return c.json({ error: 'Failed to create session' }, 500);
    }
    const sessionId = session[0].id;
    const newAccessToken = await generateAccessToken(user.id, user.email, sessionId);
    const newRefreshToken = await generateRefreshToken(user.id, user.email, sessionId);

    setCookie(c, 'access_token', newAccessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 6 * 60 * 60,
    });
    setCookie(c, 'refresh_token', newRefreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60,
    });

    return c.json({ success: true });
  } catch (e) {
    logerror('Error verifying refresh token:', e);
    return c.json({ error: 'Invalid refresh token' }, 401);
  }
});

auth.get('/logout', async (c) => {
  let token: string | undefined;
  token = getCookie(c, 'access_token');
  if (!token) {
    token = c.req.header('Authorization')?.replace('Bearer ', '');
  }
  if (!token) {
    return c.json({ error: 'User not logged in' }, 401);
  }

  const payload = await verifyRefreshToken(token);
  if (!payload) {
    return c.json({ error: 'Invalid access token' }, 401);
  }

  const sessionId = payload.sessionId;
  // let's not await the updating of DB
  DB.update(sessions)
    .set({
      revoked: true,
    })
    .where(eq(sessions.id, sessionId));

  deleteCookie(c, 'access_token');
  deleteCookie(c, 'refresh_token');
  return c.json({ success: true });
});

export default auth;
