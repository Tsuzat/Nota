import { beforeEach, describe, expect, it, mock } from 'bun:test';

// Mock DB
const mockFindFirstUser = mock();
const mockFindFirstSession = mock();

mock.module('../src/db', () => ({
  DB: {
    query: {
      users: {
        findFirst: mockFindFirstUser,
      },
      sessions: {
        findFirst: mockFindFirstSession,
      },
    },
  },
}));

// Mock JWT
mock.module('../src/lib/jwt', () => ({
  verifyAccessToken: mock(() => Promise.resolve({ sub: 'user1', email: 'test@example.com', sessionId: 'session1' })),
}));

// Import app after mocks
import { app } from '../src/app';

describe('User Routes', () => {
  beforeEach(() => {
    mockFindFirstUser.mockReset();
    mockFindFirstSession.mockReset();
  });

  it('GET /api/user/me should return user', async () => {
    mockFindFirstSession.mockResolvedValue({ id: 'session1', revoked: false, expiresAt: new Date(Date.now() + 10000) });
    mockFindFirstUser.mockResolvedValue({ id: 'user1', email: 'test@example.com' });

    const res = await app.request(
      '/api/user/me',
      {
        headers: { Authorization: 'Bearer fake_token' },
      },
      {
        server: {
          requestIP: () => ({ address: '127.0.0.1' }),
        },
      }
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.user.id).toBe('user1');
  });

  it('GET /api/user/me should return 401 if unauthorized', async () => {
    // No token provided
    const res = await app.request(
      '/api/user/me',
      {},
      {
        server: {
          requestIP: () => ({ address: '127.0.0.1' }),
        },
      }
    );

    expect(res.status).toBe(401);
  });
});
