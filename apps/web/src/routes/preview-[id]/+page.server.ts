import type { Note } from '@nota/client';
import { error } from '@sveltejs/kit';
import { PUBLIC_BACKEND_URL } from '$env/static/public';

export const load = async ({ request: { headers }, params: { id }, fetch }) => {
  const url = `${PUBLIC_BACKEND_URL}/api/v1/db/note/preview/${id}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw error(res.status, ((await res.json()) as any).error);
  }
  const data: any = await res.json();
  const note: Note = data.data;
  return { note };
};
