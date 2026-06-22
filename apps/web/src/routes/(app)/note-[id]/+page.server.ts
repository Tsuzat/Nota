import { request as apiRequest, type Note } from '@nota/client';
import { error } from '@sveltejs/kit';
import { PUBLIC_BACKEND_URL } from '$env/static/public';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, parent, fetch, request }) => {
  const p = await parent();
  let note: Note | undefined;
  const noteRes = await apiRequest(`${PUBLIC_BACKEND_URL}/api/v1/db/note/${params.id}/meta`, {
    headers: request.headers,
    fetch,
  });
  if (noteRes.ok) {
    const data: any = await noteRes.json();
    note = data.data as Note;
    return {
      workspaces: p.workspaces,
      id: params.id,
      note,
    };
  }
  if (noteRes.status === 403 || noteRes.status === 401) {
    error(403, {
      message: 'You do not have permission to access this note.',
      server: { message: 'Forbidden' },
      client: { message: 'Forbidden' },
    });
  }
  error(404, {
    message: 'Note not found',
    server: { message: 'Note not found' },
    client: { message: 'Note not found' },
  });
};
