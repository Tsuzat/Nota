import { getContext, setContext } from "svelte";
import { PUBLIC_BACKEND_URL } from "$env/static/public";
import request from "./request";
import { NoteVersionSchema } from "./types";

class Versions {
  async listWorkspaceVersions(
    workspaceId: string,
    filters?: {
      page?: number;
      limit?: number;
      note_ids?: string;
      type?: string;
      search?: string;
    },
  ) {
    const url = new URL(
      `${PUBLIC_BACKEND_URL}/api/v1/db/note/workspace/${workspaceId}/versions`,
    );
    if (filters) {
      if (filters.page)
        url.searchParams.append("page", filters.page.toString());
      if (filters.limit)
        url.searchParams.append("limit", filters.limit.toString());
      if (filters.note_ids)
        url.searchParams.append("note_ids", filters.note_ids);
      if (filters.type) url.searchParams.append("type", filters.type);
      if (filters.search) url.searchParams.append("search", filters.search);
    }

    const res = await request(url.toString());
    if (res.ok) {
      const json = await res.json();
      const versions = json.data.versions.map((v: any) =>
        NoteVersionSchema.parse(v),
      );
      return {
        versions,
        total: json.data.total as number,
        page: json.data.page as number,
        limit: json.data.limit as number,
      };
    }
    throw new Error(await res.text());
  }

  async getVersionCount(noteId: string) {
    const url = `${PUBLIC_BACKEND_URL}/api/v1/db/note/${noteId}/versions/count`;
    const res = await request(url);
    if (res.ok) {
      const json = await res.json();
      return json.data.count as number;
    }
    return 0;
  }

  async getVersionContent(noteId: string, versionId: string) {
    const url = `${PUBLIC_BACKEND_URL}/api/v1/db/note/${noteId}/versions/${versionId}`;
    const res = await request(url);
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
    throw new Error(await res.text());
  }

  async createManualSnapshot(noteId: string, label?: string) {
    const url = `${PUBLIC_BACKEND_URL}/api/v1/db/note/${noteId}/versions`;
    const res = await request(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ label }),
    });
    if (res.ok) {
      const json = await res.json();
      return NoteVersionSchema.parse(json.data);
    }
    throw new Error(await res.text());
  }

  async deleteVersion(noteId: string, versionId: string) {
    const url = `${PUBLIC_BACKEND_URL}/api/v1/db/note/${noteId}/versions/${versionId}`;
    const res = await request(url, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error || "Failed to delete version");
    }
  }

  async restoreVersion(
    noteId: string,
    versionId: string,
    restoreUpdate: string,
  ) {
    console.log(
      `[Versions API] restoreVersion: noteId=${noteId}, versionId=${versionId}`,
    );
    const url = `${PUBLIC_BACKEND_URL}/api/v1/db/note/${noteId}/versions/${versionId}/restore`;
    const res = await request(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restore_update: restoreUpdate }),
    });
    if (res.ok) {
      const json = await res.json();
      console.log(`[Versions API] restoreVersion SUCCESS: noteId=${noteId}`);
      return json.data;
    }
    const errText = await res.text();
    console.error(
      `[Versions API] restoreVersion FAILED: noteId=${noteId}, err=${errText}`,
    );
    throw new Error(errText);
  }

  async restoreFromContent(
    noteId: string,
    content: any,
    label: string | undefined,
    restoreUpdate: string,
  ) {
    console.log(
      `[Versions API] restoreFromContent: noteId=${noteId}, label=${label}`,
    );
    const url = `${PUBLIC_BACKEND_URL}/api/v1/db/note/${noteId}/restore-from-content`;
    const res = await request(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, label, restore_update: restoreUpdate }),
    });
    if (res.ok) {
      const json = await res.json();
      console.log(
        `[Versions API] restoreFromContent SUCCESS: noteId=${noteId}`,
      );
      return json.data;
    }
    const errText = await res.text();
    console.error(
      `[Versions API] restoreFromContent FAILED: noteId=${noteId}, err=${errText}`,
    );
    throw new Error(errText);
  }
}

const NOTAVERSIONSKEY = Symbol("NOTAVERSIONSKEY");

export const setVersionsContext = () => {
  return setContext(NOTAVERSIONSKEY, new Versions());
};

export function getVersionsContext() {
  return getContext<ReturnType<typeof setVersionsContext>>(NOTAVERSIONSKEY);
}
