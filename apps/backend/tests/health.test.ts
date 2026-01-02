import { describe, expect, it } from 'bun:test';
import { app } from '../src/app';

describe('Health Check', () => {
  it('should return 200 OK', async () => {
    // Mocking the environment to satisfy hono/bun getConnInfo
    const res = await app.request(
      '/api/health',
      {},
      {
        server: {
          requestIP: () => ({ address: '127.0.0.1' }),
        },
      }
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ status: 'ok' });
  });
});
