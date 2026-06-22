import { redirect } from "@sveltejs/kit";
import { PUBLIC_BACKEND_URL } from "$env/static/public";
import type { LayoutServerLoad } from "./$types";
import { request as apiRequest, type Workspace } from "@nota/client";

export const load: LayoutServerLoad = async ({ fetch, request, locals }) => {
  if (!locals.user) {
    throw redirect(302, "/signin");
  }

  let workspaces: Workspace[] = [];
  const wsRes = await apiRequest(`${PUBLIC_BACKEND_URL}/api/v1/db/workspace`, {
    headers: request.headers,
    fetch,
  });

  if (wsRes.ok) {
    const data = await wsRes.json();
    workspaces = (data as any).data;
  } else {
    const data = await wsRes.json();
    console.error(JSON.stringify(data));
  }

  return {
    workspaces,
  };
};
