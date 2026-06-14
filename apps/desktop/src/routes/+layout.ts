// Tauri doesn't have a Node.js server to do proper SSR
// so we use adapter-static with a fallback to index.html to put the site in SPA mode
// See: https://svelte.dev/docs/kit/single-page-apps
// See: https://v2.tauri.app/start/frontend/sveltekit/ for more info
export const ssr = false;
export const prerender = false;
export const csr = true;

import { toast } from "@nota/ui/shadcn/sonner";
import { goto } from "$app/navigation";
import { resolve } from "$app/paths";
import { DB, initializeLocalDB } from "$lib/local/db";
import type { LocalNote } from "$lib/local/notes.svelte";
import type { LocalWorkSpace } from "$lib/local/workspaces.svelte";

async function loadLocalWorkspaces(): Promise<LocalWorkSpace[] | null> {
  try {
    const res = await DB.select<LocalWorkSpace[]>(
      "SELECT id, name, icon, created_at, updated_at FROM workspaces",
    );
    return res;
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function loadLocalNotes(): Promise<LocalNote[] | null> {
  try {
    let res = await DB.select<LocalNote[]>(
      "SELECT id, workspace_id, parent_note_id, name, icon, pinned, deleted_at, created_at, updated_at FROM notes",
    );
    res = res.map((r) => {
      return {
        ...r,
        pinned:
          r.pinned === "true" || (r.pinned as any) === 1 || r.pinned === true,
      };
    });
    return res;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export const load = async () => {
  await initializeLocalDB();

  let localWorkspaces = await loadLocalWorkspaces();

  if (localWorkspaces === null) {
    toast.error("Something went wrong when loading the workspaces");
    return goto(resolve("/"));
  }

  if (localWorkspaces.length === 0) {
    const defaultWorkspaceId = crypto.randomUUID();
    try {
      await DB.execute(
        "INSERT INTO workspaces (id, name, icon) VALUES ($1, $2, $3)",
        [defaultWorkspaceId, "Personal", "📁"],
      );
      localWorkspaces = await loadLocalWorkspaces();
    } catch (e) {
      console.error("Failed to seed default workspace in layout load", e);
    }
  }

  const localNotes = await loadLocalNotes();

  if (localNotes === null) {
    toast.error("Something went wrong when loading the notes");
    return goto(resolve("/"));
  }

  return {
    localWorkspaces,
    localNotes,
  };
};
