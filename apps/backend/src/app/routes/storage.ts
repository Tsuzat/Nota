import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { PutObjectCommand, HeadObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { eq, sql } from 'drizzle-orm';
import { DB } from '../../db';
import { users } from '../../db/schema';
import { storage } from '../../lib/storage';
import { BUCKET_NAME, R2_PUBLIC_ENDPOINT } from '../../constants';
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

const deleteSchema = z.object({
  key: z.string().min(1),
});

const getFolder = (mime: string): string => {
  if (mime.startsWith('image/')) return 'images';
  if (mime.startsWith('video/')) return 'videos';
  if (mime.startsWith('audio/')) return 'audios';
  if (mime === 'application/pdf' || mime.startsWith('text/') || mime.includes('document')) return 'docs';
  return 'others';
};

// 1. Generate Presigned URL
app.post('/presigned-url', zValidator('json', uploadSchema), async (c) => {
  const user = c.get('user');
  const userId = c.get('userId');
  const { filename, contentType, size } = c.req.valid('json');

  try {
    if (!user) return c.json({ error: 'User not found' }, 404);

    if (user.usedStorage + size > user.assignedStorage) {
        return c.json({ 
            error: 'Storage quota exceeded', 
            details: { used: user.usedStorage, assigned: user.assignedStorage, required: size }
        }, 403);
    }

    const folder = getFolder(contentType);
    const ext = filename.split('.').pop() || 'bin';
    const uniqueName = `${crypto.randomUUID()}.${ext}`;
    const key = `${userId}/${folder}/${uniqueName}`;

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: contentType,
        ContentLength: size,
    });

    const url = await getSignedUrl(storage, command, { expiresIn: 300 });
    //! DO NOT CHANGE IT
    const publicUrl = `${R2_PUBLIC_ENDPOINT}/${key}`;

    return c.json({
        uploadUrl: url,
        publicUrl: publicUrl,
        key: key
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return c.json({ error: 'Failed to generate upload URL' }, 500);
  }
});

// 2. Confirm Upload
app.post('/confirm', zValidator('json', confirmSchema), async (c) => {
  const userId = c.get('userId');
  const { key } = c.req.valid('json');

  if (!key.includes(`/${userId}/`)) {
    return c.json({ error: 'Invalid key ownership' }, 403);
  }

  try {
    const head = await storage.send(new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    }));

    const realSize = head.ContentLength || 0;

    if (realSize === 0) {
        return c.json({ error: 'File empty or not found' }, 404);
    }

    await DB.update(users)
        .set({ usedStorage: sql`${users.usedStorage} + ${realSize}` })
        .where(eq(users.id, userId));

    return c.json({ success: true, size: realSize });
  } catch (error) {
    console.error('Error confirming upload:', error);
    // If the file doesn't exist, we should probably tell the client?
    // But failing with 500 is safer for generic errors.
    return c.json({ error: 'Failed to confirm upload' }, 500);
  }
});

// 3. List Files
app.get('/list', async (c) => {
    const userId = c.get('userId');
    const prefix = c.req.query('prefix');
    
    // Security check: Prefix must belong to user if provided
    if (prefix && !prefix.includes(`/${userId}/`)) {
        return c.json({ error: 'Invalid prefix' }, 403);
    }
    
    try {
        let files: any[] = [];
        
        if (prefix) {
            const command = new ListObjectsV2Command({
                Bucket: BUCKET_NAME,
                Prefix: prefix
            });
            const response = await storage.send(command);
            files = response.Contents || [];
        } else {
            // Scan all user folders
            const folders = ['images', 'videos', 'audios', 'docs', 'others'];
            const promises = folders.map(f => storage.send(new ListObjectsV2Command({
                Bucket: BUCKET_NAME,
                Prefix: `${userId}/${f}/`
            })));
            const responses = await Promise.all(promises);
            files = responses.flatMap(r => r.Contents || []);
        }
        
        const result = files.map(f => ({
            key: f.Key,
            size: f.Size,
            lastModified: f.LastModified,
            url: `${R2_PUBLIC_ENDPOINT}/${f.Key}`
        }));
        
        return c.json(result);
    } catch (error) {
        console.error('List files error:', error);
        return c.json({ error: 'Failed to list files' }, 500);
    }
});

// 4. Delete File
app.delete('/', zValidator('json', deleteSchema), async (c) => {
    const userId = c.get('userId');
    const { key } = c.req.valid('json');
    
    // Security check
    if (!key.includes(`/${userId}/`)) {
        return c.json({ error: 'Permission denied' }, 403);
    }
    
    try {
        // Get size for refund
        const head = await storage.send(new HeadObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key
        }));
        const size = head.ContentLength || 0;
        
        // Delete from R2
        await storage.send(new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key
        }));
        
        // Refund Quota
        if (size > 0) {
            await DB.update(users)
                .set({ usedStorage: sql`GREATEST(0, ${users.usedStorage} - ${size})` }) // Ensure not negative
                .where(eq(users.id, userId));
        }
        
        return c.json({ success: true, refunded: size });
        
    } catch (error: any) {
        if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
             return c.json({ error: 'File not found' }, 404);
        }
        console.error('Delete error:', error);
        return c.json({ error: 'Failed to delete file' }, 500);
    }
});

export default app;