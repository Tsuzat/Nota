import { HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { zValidator } from '@hono/zod-validator';
import { eq, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import { BUCKET_NAME, R2_PUBLIC_ENDPOINT } from '../../constants';
import { DB } from '../../db';
import { users } from '../../db/schema';
import { storage } from '../../lib/storage';
import { authMiddleware } from '../middlewares/auth';

const app = new Hono<{ Variables: { userId: string; userEmail: string; user: any } }>();

app.use('*', authMiddleware);

const uploadSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
  size: z.number().int().positive(), // in bytes
});

const confirmSchema = z.object({
  key: z.string().min(1),
});

const getFolder = (mime: string): string => {
  if (mime.startsWith('image/')) return 'images';
  if (mime.startsWith('video/')) return 'videos';
  if (mime.startsWith('audio/')) return 'audios';
  if (mime === 'application/pdf' || mime.startsWith('text/') || mime.includes('document')) return 'docs';
  return 'others';
};

// 1. Generate Presigned URL (No DB update)
app.post('/presigned-url', zValidator('json', uploadSchema), async (c) => {
  const userId = c.get('userId');
  const user = c.get('user');
  const { filename, contentType, size } = c.req.valid('json');

  try {
    if (!user) return c.json({ error: 'User not found' }, 404);

    // Check Quota
    if (user.usedStorage + size > user.assignedStorage) {
      return c.json(
        {
          error: 'Storage quota exceeded',
          details: { used: user.usedStorage, assigned: user.assignedStorage, required: size },
        },
        403
      );
    }

    const folder = getFolder(contentType);
    const ext = filename.split('.').pop() || 'bin';
    const uniqueName = `${crypto.randomUUID()}.${ext}`;
    const key = `${folder}/${userId}/${uniqueName}`;

    // Generate Signed URL
    // Enforcing ContentLength ensures they can't upload more than declared
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      ContentLength: size,
    });

    const url = await getSignedUrl(storage, command, { expiresIn: 300 });

    const publicUrl = `${R2_PUBLIC_ENDPOINT}/${key}`;

    return c.json({
      uploadUrl: url,
      publicUrl: publicUrl,
      key: key,
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return c.json({ error: 'Failed to generate upload URL' }, 500);
  }
});

// 2. Confirm Upload (Update DB)
app.post('/confirm', zValidator('json', confirmSchema), async (c) => {
  const userId = c.get('userId');
  const { key } = c.req.valid('json');

  // Security: Key must match userId
  if (!key.includes(`/${userId}/`)) {
    return c.json({ error: 'Invalid key ownership' }, 403);
  }

  try {
    // Verify file exists on R2 and get REAL size
    const head = await storage.send(
      new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    );

    const realSize = head.ContentLength || 0;

    if (realSize === 0) {
      return c.json({ error: 'File empty or not found' }, 404);
    }

    // Update User Storage
    // Note: If user calls this multiple times, they burn their own quota.
    // We accept this as "user error" rather than a security flaw.
    await DB.update(users)
      .set({ usedStorage: sql`${users.usedStorage} + ${realSize}` })
      .where(eq(users.id, userId));

    return c.json({ success: true, size: realSize });
  } catch (error) {
    console.error('Error confirming upload:', error);
    return c.json({ error: 'Failed to confirm upload' }, 500);
  }
});

export default app;
