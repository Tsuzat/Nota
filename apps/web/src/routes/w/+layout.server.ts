import { redirect } from '@sveltejs/kit';
import { PUBLIC_BACKEND_URL } from '$env/static/public';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params, fetch, url }) => {
  const wsRes = await fetch(`${PUBLIC_BACKEND_URL}/api/v1/db/workspace`);
  const workspaces = wsRes.ok ? (await wsRes.json()).data : [];

  // Redirection logic: if user goes to exactly "/w" or "/w/", redirect to their first workspace
  if (url.pathname === '/w' || url.pathname === '/w/') {
    if (workspaces && workspaces.length > 0) {
      throw redirect(302, `/w/${workspaces[0].id}`);
    }
  }

  return {
    workspaceId: params.id,
    workspaces,
  };
};
