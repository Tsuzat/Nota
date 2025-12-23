import type { User } from '@supabase/supabase-js';
import { json } from '@sveltejs/kit';
import { R2_PUBLIC_ENDPOINT } from '$env/static/private';
import { deleteFiles, listFiles } from '$lib/s3/index.js';
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
  const fileType = new URL(request.url).searchParams.get('type');
  try {
    const files = await listFiles(`${user.id}/${fileType || ''}`);
    return json({ files });
  } catch (err) {
    console.error(err);
    return new Response('Failed to list all files', { status: 500 });
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
