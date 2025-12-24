import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { eq, sql } from 'drizzle-orm';
import { DB } from '../../db';
import { users } from '../../db/schema';
import { storage } from '../../lib/storage';
import { BUCKET_NAME, R2_PUBLIC_ENDPOINT } from '../../constants';
import { authMiddleware } from '../middlewares/auth';
import type { Variables } from '..';

const app = new Hono<{ Variables: Variables }>();

app.use('*', authMiddleware);

const uploadSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
  size: z.number().int().positive(),
});

const getFolder = (mime: string): string => {
  if (mime.startsWith('image/')) return 'images';
  if (mime.startsWith('video/')) return 'videos';
  if (mime.startsWith('audio/')) return 'audios';
  if (mime === 'application/pdf' || mime.startsWith('text/') || mime.includes('document')) return 'docs';
  return 'others';
};

app.post('/presigned-url', zValidator('json', uploadSchema), async (c) => {
  const userId = c.get('userId');
  const user = c.get('user');
  const { filename, contentType, size } = c.req.valid('json');

  try {
    // Check if user has enough space
    if (user.usedStorage + size > user.assignedStorage) {
      return c.json(
        {
          error: 'Storage quota exceeded',
          details: { used: user.usedStorage, assigned: user.assignedStorage, required: size },
        },
        403
      );
    }

    // 2. Generate Key
    const folder = getFolder(contentType);
    // Sanitize filename extension
    const ext = filename.split('.').pop() || 'bin';
    const uniqueName = `${crypto.randomUUID()}.${ext}`;
    // Structure: folder/userId/uuid.ext
    const key = `${folder}/${userId}/${uniqueName}`;

    // 3. Generate Presigned URL
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      ContentLength: size,
    });

    const url = await getSignedUrl(storage, command, { expiresIn: 300 }); // 5 minutes

    // 4. Optimistically update usage in DB
    // We still need to update the DB, but we avoided the SELECT query.
    await DB.update(users)
      .set({ usedStorage: sql`${users.usedStorage} + ${size}` })
      .where(eq(users.id, userId));

    // 5. Return Public URL and Upload URL
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

export default app;
