import { beforeEach, describe, expect, it, mock } from 'bun:test';

// Mocks for DB methods
const mockUserWorkspaceSelect = mock();
const mockSessionFindFirst = mock();
const mockUserFindFirst = mock();
const mockInsertReturning = mock();
const mockInsertValues = mock(() => ({ returning: mockInsertReturning }));
const mockInsert = mock(() => ({ values: mockInsertValues }));
const mockFrom = mock(() => ({ where: mockUserWorkspaceSelect }));
const mockSelect = mock(() => ({ from: mockFrom }));

mock.module('../src/db', () => ({
  DB: {
    select: mockSelect,
    insert: mockInsert,
    query: {
      sessions: {
        findFirst: mockSessionFindFirst,
      },
      users: {
        findFirst: mockUserFindFirst,
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

describe('UserWorkspaces Routes', () => {
  beforeEach(() => {
    mockUserWorkspaceSelect.mockReset();
    mockSessionFindFirst.mockReset();
    mockUserFindFirst.mockReset();
    mockInsertReturning.mockReset();
  });

  describe('GET /api/db/userworkspaces', () => {
    it('should return user workspaces', async () => {
      mockSessionFindFirst.mockResolvedValue({
        id: 'session1',
        revoked: false,
        expiresAt: new Date(Date.now() + 10000),
      });
      mockUserFindFirst.mockResolvedValue({ id: 'user1' });
      mockUserWorkspaceSelect.mockResolvedValue([{ id: 'uws1', name: 'My Workspace' }]);

      const res = await app.request(
        '/api/db/userworkspaces',
        {
          headers: { Authorization: 'Bearer valid_token' },
        },
        {
          server: { requestIP: () => ({ address: '127.0.0.1' }) },
        }
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toHaveLength(1);
      expect(json[0].name).toBe('My Workspace');
    });
  });

  describe('POST /api/db/userworkspaces', () => {
    it('should create a user workspace', async () => {
      mockSessionFindFirst.mockResolvedValue({
        id: 'session1',
        revoked: false,
        expiresAt: new Date(Date.now() + 10000),
      });
      mockUserFindFirst.mockResolvedValue({ id: 'user1' });

      const newWS = { id: 'uws1', name: 'New WS', icon: '🚀' };
      mockInsertReturning.mockResolvedValue([newWS]);

      const res = await app.request(
        '/api/db/userworkspaces',
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer valid_token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: 'New WS', icon: '🚀' }),
        },
        {
          server: { requestIP: () => ({ address: '127.0.0.1' }) },
        }
      );

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.name).toBe('New WS');
    });
  });
});
