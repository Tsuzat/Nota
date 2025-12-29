import { getContext, setContext } from 'svelte';
import { PUBLIC_BACKEND_URL } from '$env/static/public';
import request from './request';
import { type Note, NoteSchema } from './types';

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
    const url = `${PUBLIC_BACKEND_URL}/api/db/notes/${userworkspaceId}`;
    const res = await request(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (res.ok) {
      const notes = (await res.json()) as Note[];
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
  async create(note: Partial<Note>) {
    const url = `${PUBLIC_BACKEND_URL}/api/db/notes`;
    const res = await request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(note),
    });
    if (res.ok) {
      const createdNote = (await res.json()) as Note;
      const parsedNote = NoteSchema.parse(createdNote);
      this.notes.push(parsedNote);
    } else {
      throw new Error(await res.text());
    }
  }

  /**
   * Delete a note
   * @param noteId Note ID
   * @throws {Error} If the request fails with a non-200 status code
   */
  async delete(noteId: string) {
    const url = `${PUBLIC_BACKEND_URL}/api/db/notes/${noteId}`;
    const res = await request(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (res.ok) {
      this.notes = this.notes.filter((note) => note.id !== noteId);
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
   * @param id Note ID
   * @throws {Error} If the request fails with a non-200 status code
   */
  async update(name: string, icon: string, favorite: boolean, trashed: boolean, noteId: string) {
    const url = `${PUBLIC_BACKEND_URL}/api/db/notes/${noteId}`;
    const res = await request(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, icon, favorite, trashed }),
    });
    if (res.ok) {
      const updatedNote = (await res.json()) as Note;
      const parsedNote = NoteSchema.parse(updatedNote);
      this.notes = this.notes.map((note) => (note.id === noteId ? parsedNote : note));
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
    const url = `${PUBLIC_BACKEND_URL}/api/db/notes/${noteId}/content`;
    const res = await request(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const updatedNote = (await res.json()) as Note;
      const parsedNote = NoteSchema.parse(updatedNote);
      this.notes = this.notes.map((note) => (note.id === noteId ? parsedNote : note));
    } else {
      throw new Error(await res.text());
    }
  }
}

const NOTANOTESKEY = Symbol('NOTANOTESKEY');

/**
 * Set the notes context.
 */
export const setNotesContext = () => {
  setContext(NOTANOTESKEY, new Notes());
};

/**
 * Get the notes context.
 */
export function getNotesContext() {
  return getContext<ReturnType<typeof setNotesContext>>(NOTANOTESKEY);
}
