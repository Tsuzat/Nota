import { beforeEach, describe, expect, it, mock } from 'bun:test';

// Mocks for DB methods
const mockNoteFindFirst = mock();
const mockSessionFindFirst = mock();
const mockUserFindFirst = mock();
const mockInsertReturning = mock();
const mockInsertValues = mock(() => ({ returning: mockInsertReturning }));
const mockInsert = mock(() => ({ values: mockInsertValues }));

mock.module('../src/db', () => ({
  DB: {
    query: {
      notes: {
        findFirst: mockNoteFindFirst,
      },
      sessions: {
        findFirst: mockSessionFindFirst,
      },
      users: {
        findFirst: mockUserFindFirst,
      },
    },
    insert: mockInsert,
  },
}));

// Mock JWT
mock.module('../src/lib/jwt', () => ({
  verifyAccessToken: mock(() => Promise.resolve({ sub: 'user1', email: 'test@example.com', sessionId: 'session1' })),
}));

// Import app after mocks
import { app } from '../src/app';

describe('Notes Routes', () => {
  beforeEach(() => {
    mockNoteFindFirst.mockReset();
    mockSessionFindFirst.mockReset();
    mockUserFindFirst.mockReset();
    mockInsertReturning.mockReset();
  });

  describe('GET /api/db/notes/:id/preview', () => {
    it('should return public note without auth', async () => {
      mockNoteFindFirst.mockResolvedValue({
        id: 'note1',
        name: 'Public Note',
        isPublic: true,
        owner: 'user2',
      });

      const res = await app.request(
        '/api/db/notes/note1/preview',
        {},
        {
          server: { requestIP: () => ({ address: '127.0.0.1' }) },
        }
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.name).toBe('Public Note');
    });

    it('should return private note if owner', async () => {
      mockNoteFindFirst.mockResolvedValue({
        id: 'note1',
        name: 'Private Note',
        isPublic: false,
        owner: 'user1',
      });
      mockSessionFindFirst.mockResolvedValue({
        id: 'session1',
        revoked: false,
        expiresAt: new Date(Date.now() + 10000),
      });

      const res = await app.request(
        '/api/db/notes/note1/preview',
        {
          headers: { Authorization: 'Bearer valid_token' },
        },
        {
          server: { requestIP: () => ({ address: '127.0.0.1' }) },
        }
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.name).toBe('Private Note');
    });

    it('should return 403 if private note and not owner', async () => {
      mockNoteFindFirst.mockResolvedValue({
        id: 'note1',
        name: 'Private Note',
        isPublic: false,
        owner: 'user2', // Different owner
      });
      mockSessionFindFirst.mockResolvedValue({
        id: 'session1',
        revoked: false,
        expiresAt: new Date(Date.now() + 10000),
      });

      const res = await app.request(
        '/api/db/notes/note1/preview',
        {
          headers: { Authorization: 'Bearer valid_token' },
        },
        {
          server: { requestIP: () => ({ address: '127.0.0.1' }) },
        }
      );

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/db/notes', () => {
    it('should create a note', async () => {
      // Mock session for auth middleware
      mockSessionFindFirst.mockResolvedValue({
        id: 'session1',
        revoked: false,
        expiresAt: new Date(Date.now() + 10000),
      });
      mockUserFindFirst.mockResolvedValue({ id: 'user1' });

      // Mock insert response
      const newNote = { id: 'new_note', name: 'New Note', owner: 'user1' };
      mockInsertReturning.mockResolvedValue([newNote]);

      const res = await app.request(
        '/api/db/notes',
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer valid_token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'New Note',
            workspaceId: '123e4567-e89b-12d3-a456-426614174000',
            userworkspaceId: '123e4567-e89b-12d3-a456-426614174001',
          }),
        },
        {
          server: { requestIP: () => ({ address: '127.0.0.1' }) },
        }
      );

      if (res.status !== 201) {
        console.log(await res.json());
      }
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.id).toBe('new_note');
    });
  });
});
