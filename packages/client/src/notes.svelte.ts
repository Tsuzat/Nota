import { getContext, setContext } from "svelte";
import { PUBLIC_BACKEND_URL } from "$env/static/public";
import request from "./request";
import { type Note, NoteSchema } from "./types";

interface UpdateNotes {
  name?: string;
  icon?: string;
  favorite?: boolean;
  trashed?: boolean;
  is_public?: boolean;
  workspace?: string;
}

class Notes {
  #notes = $state<Note[]>([]);

  get notes() {
    return this.#notes;
  }

  set notes(notes: Note[]) {
    this.#notes = notes;
  }

  /**
   * Fetch all notes from the backend
   * @param userworkspaceId UserWorkspace ID
   * @throws {Error} If the request fails with a non-200 status code
   */
  async fetch(userworkspaceId: string) {
    const url = `${PUBLIC_BACKEND_URL}/api/v1/db/note/${userworkspaceId}`;
    const res = await request(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (res.ok) {
      const json = await res.json();
      const notes = json.data as Note[];
      const parsedNotes = notes.map((note) => NoteSchema.parse(note));
      this.notes = parsedNotes;
    } else {
      throw new Error(await res.text());
    }
  }

  /**
   * Create a new note
   * @param note Partial note object
   * @throws {Error} If the request fails with a non-200 status code
   */
  async create(
    name: string,
    icon: string,
    workspaceId: string,
    userworkspaceId: string,
    isFavorite: boolean,
  ) {
    const url = `${PUBLIC_BACKEND_URL}/api/v1/db/note`;
    const res = await request(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        icon,
        workspace: workspaceId,
        userworkspace: userworkspaceId,
        favorite: isFavorite,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      const createdNote = json.data as Note;
      const parsedNote = NoteSchema.parse(createdNote);
      this.notes.push(parsedNote);
    } else {
      throw new Error(await res.text());
    }
  }

  /**
   * Update a note
   * @param name Note name
   * @param icon Note icon
   * @param favorite Whether the note is favorite
   * @param trashed Whether the note is trashed
   * @param is_public Whether the note is public
   * @param id Note ID
   * @throws {Error} If the request fails with a non-200 status code
   */
  async update(noteId: string, note: UpdateNotes) {
    const url = `${PUBLIC_BACKEND_URL}/api/v1/db/note/${noteId}`;
    const res = await request(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(note),
    });
    if (res.ok) {
      const json = await res.json();
      const updatedNote = json.data as Note;
      const parsedNote = NoteSchema.parse(updatedNote);
      this.notes = this.notes.map((note) =>
        note.id === noteId ? parsedNote : note,
      );
    } else {
      throw new Error(await res.text());
    }
  }

  /**
   * Fetch note content by ID
   * @param noteId Note ID
   * @returns Note content as a string
   * @throws {Error} If the request fails with a non-200 status code
   */
  async fetchContent(noteId: string) {
    const url = `${PUBLIC_BACKEND_URL}/api/v1/db/note/${noteId}/content`;
    const res = await request(url);
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
    throw new Error(await res.text());
  }

  /**
   * Duplicate a note
   * @param noteId Note ID
   * @throws {Error} If the request fails with a non-200 status code
   */
  async duplicate(noteId: string) {
    const url = `${PUBLIC_BACKEND_URL}/api/v1/db/note/${noteId}/duplicate`;
    const res = await request(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (res.ok) {
      const json = await res.json();
      const duplicatedNote = json.data as Note;
      const parsedNote = NoteSchema.parse(duplicatedNote);
      this.notes.push(parsedNote);
    } else {
      throw new Error(await res.text());
    }
  }

  /**
   * Apply JSON Patch to a note content
   * @param noteId Note ID
   * @param patch JSON Patch object
   * @throws {Error} If the request fails with a non-200 status code
   */
  async patch(noteId: string, patch: any) {
    const url = `${PUBLIC_BACKEND_URL}/api/v1/db/note/${noteId}/content`;
    const res = await request(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      throw new Error(await res.text());
    }
  }

  async import(
    name: string,
    workspaceId: string,
    userworkspaceId: string,
    content: any,
  ) {
    const url = `${PUBLIC_BACKEND_URL}/api/v1/db/note/import`;
    const res = await request(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        workspace: workspaceId,
        userworkspace: userworkspaceId,
        content,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      const importedNote = json.data as Note;
      const parsedNote = NoteSchema.parse(importedNote);
      this.notes.push(parsedNote);
    } else {
      throw new Error(await res.text());
    }
  }
}

const NOTANOTESKEY = Symbol("NOTANOTESKEY");

/**
 * Set the notes context.
 */
export const setNotesContext = () => {
  return setContext(NOTANOTESKEY, new Notes());
};

/**
 * Get the notes context.
 */
export function getNotesContext() {
  return getContext<ReturnType<typeof setNotesContext>>(NOTANOTESKEY);
}
