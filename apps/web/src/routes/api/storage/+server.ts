import type { User } from '@supabase/supabase-js';
import { json } from '@sveltejs/kit';
import { nanoid } from 'nanoid';
import { R2_PUBLIC_ENDPOINT } from '$env/static/private';
import { deleteFiles, listFiles, uploadFile } from '$lib/s3/index.js';
import { adminClient } from '$lib/supabase/admin/index.js';
import { fileTypeFromBuffer } from 'file-type';

export const config = {
  runtime: 'bun1.x',
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 1MB

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
  'video/mov',
  'video/quicktime',
  'video/mkv',
  'video/x-matroska',
  'audio/mpeg',
  'application/pdf',
]);

const getUserFromToken = async (token: string) => {
  const { data: userData, error: userError } = await adminClient.auth.getUser(token);
  if (userError) {
    console.error(userError);
    return null;
  }
  return userData.user;
};

export const GET = async ({ request, locals }) => {
  let user: User | null = null;
  const authHeader = request.headers.get('Authorization');
  const token = authHeader ? authHeader.split(' ')[1] : undefined;
  if (token) {
    user = await getUserFromToken(token);
  } else {
    user = (await locals.safeGetSession()).user || null;
  }
  if (user === null) {
    return new Response('Unauthorized', { status: 401 });
  }
  try {
    const files = await listFiles();
    return json({ files });
  } catch (err) {
    console.error(err);
    return new Response('Failed to list all files', { status: 500 });
  }
};

export const POST = async ({ request, locals }) => {
  const filename = request.headers.get('X-Filename');
    if (!filename) {
      return new Response('Missing X-Filename header', { status: 400 });
    }
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
    // 2. Header Validations
    if (request.headers.get('Content-Type')?.includes('multipart/form-data')) {
      return new Response('Multipart uploads not supported. Please stream the raw file body.', { status: 400 });
    } 
    // 3. Streaming & Size Validation
    const reader = request.body?.getReader();
    if (!reader) {
      return new Response('Empty request body', { status: 400 });
    }
    const chunks: Uint8Array[] = [];
    let receivedLength = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      receivedLength += value.length;
      if (receivedLength > MAX_FILE_SIZE) {
        reader.cancel(); // Stop reading
        return new Response('Payload Too Large. Max size is 10MB.', { status: 413 });
      }
      chunks.push(value);
    }
    if (receivedLength === 0) {
      return new Response('Empty file', { status: 400 });
    }
    const buffer = Buffer.concat(chunks);
    // 4. File Validation (Magic Bytes)
    const fileType = await fileTypeFromBuffer(buffer);
    if (!fileType || !ALLOWED_MIME_TYPES.has(fileType.mime)) {
      return new Response(`Unsupported Media Type: ${fileType?.mime || 'unknown'}. Allowed: ${[...ALLOWED_MIME_TYPES].join(', ')}`, { status: 415 });
    }
    // 5. Sanitization & Key Generation
    // Remove path traversal and special characters, keep alphanumeric, dots, dashes, underscores
    const sanitizedFilename = filename.replace(/(\.\.\/|\/)/g, '').replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `${user.id}/${nanoid(12)}-${sanitizedFilename}`;
    // 6. Upload
    // Note: using detected MIME type
    const url = await uploadFile(buffer, key, fileType.mime);
    return json({ url });
  } catch (err) {
    console.error('Upload error:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
};

export const DELETE = async ({ request, locals }) => {
  // get the token from request header
  let user: User | null = null;
  const authHeader = request.headers.get('Authorization');
  const token = authHeader ? authHeader.split(' ')[1] : undefined;
  if (token) {
    user = await getUserFromToken(token);
  } else {
    user = (await locals.safeGetSession()).user || null;
  }
  if (user === null) {
    return new Response('Unauthorized', { status: 401 });
  }
  const { fileUrls }: { fileUrls: string[] } = await request.json();
  if (!fileUrls) {
    return new Response('No fileUrl provided', { status: 400 });
  }
  try {
    const fileKeys = fileUrls.map((url) => url.split(`${R2_PUBLIC_ENDPOINT}/`)[1]);
    await deleteFiles(fileKeys);
    return new Response(JSON.stringify({ message: 'File deleted successfully' }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response('Failed to delete file', { status: 500 });
  }
};
