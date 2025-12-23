import type { User } from '@supabase/supabase-js';
import { json } from '@sveltejs/kit';
import { fileTypeFromBuffer } from 'file-type';
import { nanoid } from 'nanoid';
import { R2_PUBLIC_ENDPOINT } from '$env/static/private';
import {
  ALLOWED_MIME_TYPES,
  deleteFiles,
  detectCategoryFromMime,
  getFileHead,
  getFileRange,
  getPresignedUrl,
  MAX_FILE_SIZE,
  SIGNED_URL_EXPIRY,
} from '$lib/s3/index.js';
import { adminClient } from '$lib/supabase/admin/index.js';

export const config = {
  runtime: 'bun1.x',
};

const getUserFromToken = async (token: string) => {
  const { data: userData, error: userError } = await adminClient.auth.getUser(token);
  if (userError) {
    console.error(userError);
    return null;
  }
  return userData.user;
};

// POST: Generate Signed URL
export const POST = async ({ request, locals }) => {
  // 1. Authentication
  let user: User | null = null;
  const authHeader = request.headers.get('Authorization');
  const token = authHeader ? authHeader.split(' ')[1] : undefined;
  if (token) {
    user = await getUserFromToken(token);
  } else {
    user = (await locals.safeGetSession()).user || null;
  }
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { filename, expectedMime } = await request.json();

    if (!filename || !expectedMime) {
      return new Response('Missing filename or expectedMime', { status: 400 });
    }

    // 2. Validate MIME Type
    if (!ALLOWED_MIME_TYPES.has(expectedMime)) {
      return new Response(`Unsupported Media Type: ${expectedMime}. Allowed: ${[...ALLOWED_MIME_TYPES].join(', ')}`, {
        status: 400,
      });
    }

    // 3. Generate Storage Key
    // Sanitize filename: alphanumeric, dots, dashes, underscores only
    const sanitizedFilename = filename.replace(/(\.\.\/|\/)/g, '').replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `${user.id}/${detectCategoryFromMime(expectedMime)}/${nanoid(12)}-${sanitizedFilename}`;

    // 4. Create Signed URL
    const signedUrl = await getPresignedUrl(key, expectedMime, SIGNED_URL_EXPIRY);
    const publicUrl = `${R2_PUBLIC_ENDPOINT}/${key}`;

    return json({
      signedUrl,
      publicUrl,
      key,
      expiresIn: SIGNED_URL_EXPIRY,
    });
  } catch (err) {
    console.error('Signed URL generation error:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
};

// PUT: Verify Upload (Server-Side Verification)
// This endpoint should be called by the client AFTER the file upload to S3 is complete.
export const PUT = async ({ request, locals }) => {
  // 1. Authentication
  let user: User | null = null;
  const authHeader = request.headers.get('Authorization');
  const token = authHeader ? authHeader.split(' ')[1] : undefined;
  if (token) {
    user = await getUserFromToken(token);
  } else {
    user = (await locals.safeGetSession()).user || null;
  }
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { key, expectedMime } = await request.json();

    if (!key || !expectedMime) {
      return new Response('Missing key or expectedMime', { status: 400 });
    }

    // Security check: Ensure the key belongs to the authenticated user
    if (!key.startsWith(`${user.id}/`)) {
      return new Response('Forbidden: Cannot access this file', { status: 403 });
    }

    // 2. Fetch Object Metadata & Range for Verification
    try {
      const head = await getFileHead(key);
      const size = head.ContentLength || 0;

      // 3. Verify Size
      if (size > MAX_FILE_SIZE) {
        await deleteFiles([key]);
        return new Response('File too large', { status: 400 });
      }

      // 4. Verify Magic Bytes (Read first 64KB)
      const chunk = await getFileRange(key, 'bytes=0-65535');
      const fileType = await fileTypeFromBuffer(chunk);

      // 5. Verify Content Type
      if (!fileType) {
        await deleteFiles([key]);
        return new Response('Invalid file content. Could not determine file type.', { status: 400 });
      }

      if (!ALLOWED_MIME_TYPES.has(fileType.mime)) {
        await deleteFiles([key]);
        return new Response(`Invalid file content. Detected: ${fileType.mime}`, { status: 400 });
      }

      return json({ status: 'verified', key, mime: fileType.mime, size });
    } catch (s3Error) {
      console.error('S3 Verification Error:', s3Error);
      // If object doesn't exist or S3 error, assume invalid
      return new Response('Verification failed: File not found or inaccessible', { status: 404 });
    }
  } catch (err) {
    console.error('Verification handler error:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
};
