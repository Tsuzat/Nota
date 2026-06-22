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
  return error(404, {
    message: 'Notes Not found',
    server: { message: 'Notes Not found' },
    client: { message: 'Notes Not found' },
  });
};
