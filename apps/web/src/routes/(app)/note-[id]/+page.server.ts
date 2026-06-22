import { PUBLIC_BACKEND_URL } from "$env/static/public";
import type { Note } from "@nota/client";
import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ params, parent, fetch }) => {
  const p = await parent();
  let note: Note | undefined;
  const noteRes = await fetch(
    `${PUBLIC_BACKEND_URL}/api/v1/db/note/${params.id}/meta`,
  );
  if (noteRes.ok) {
    const data: any = await noteRes.json();
    note = data.data as Note;
    return {
      workspaces: p.workspaces,
      id: params.id,
      note,
    };
  } else {
    return error(404, {
      message: "Notes Not found",
      server: { message: "Notes Not found" },
      client: { message: "Notes Not found" },
    });
  }
};
