import type { Content } from '@nota/ui/edra/types.js';
import { toast } from '@nota/ui/shadcn/sonner';
import { ask } from '@tauri-apps/plugin-dialog';
import { getContext, setContext } from 'svelte';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { page } from '$app/state';
import { getNewUUID } from '$lib/utils';
import { DB } from './db';
import type { LocalWorkSpace } from './workspaces.svelte';

export interface LocalNote {
  id: string;
  workspace_id: string;
  parent_note_id: string | null;
  name: string;
  icon: string;
  pinned: boolean | string;
  deleted_at: number | null;
  created_at: number;
  updated_at: number;
}

class Notes {
  #notes = $state<LocalNote[]>([]);

  constructor(notes: LocalNote[]) {
    this.#notes = notes;
  }

  getNotes() {
    return this.#notes;
  }

  setNotes(notes: LocalNote[]) {
    this.#notes = notes;
  }

  async fetchNotes() {
    try {
      let res = await DB.select<LocalNote[]>(
        'SELECT id, workspace_id, parent_note_id, name, icon, pinned, deleted_at, created_at, updated_at FROM notes'
      );
      res = res.map((r) => {
        return {
          ...r,
          pinned: r.pinned === 'true' || (r.pinned as any) === 1 || r.pinned === true,
        };
      });
      this.setNotes(res);
    } catch (e) {
      toast.error('Something went wrong when getting the notes');
      console.error(e);
    }
  }

  async fetchNotesForWorkspace(workspaceId: string) {
    try {
      let res = await DB.select<LocalNote[]>(
        'SELECT id, workspace_id, parent_note_id, name, icon, pinned, deleted_at, created_at, updated_at FROM notes WHERE workspace_id = $1',
        [workspaceId]
      );
      res = res.map((r) => {
        return {
          ...r,
          pinned: r.pinned === 'true' || (r.pinned as any) === 1 || r.pinned === true,
        };
      });
      this.setNotes(res);
    } catch (e) {
      toast.error('Something went wrong when getting the notes');
      console.error(e);
    }
  }

  async createNote(
    name: string,
    icon: string,
    pinned: boolean | string,
    workspace: LocalWorkSpace,
    parent_note_id: string | null = null,
    content?: Content
  ) {
    try {
      const id = getNewUUID(this.#notes.map((t) => t.id));
      const res = await DB.execute(
        'INSERT INTO notes (id, workspace_id, parent_note_id, name, icon, pinned, content) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [id, workspace.id, parent_note_id, name, icon, pinned, JSON.stringify(content ?? {})]
      );
      if (res.rowsAffected === 1) {
        const notes = await DB.select<LocalNote[]>(
          'SELECT id, workspace_id, parent_note_id, name, icon, pinned, deleted_at, created_at, updated_at FROM notes WHERE id = $1',
          [id]
        );
        const newNotes = notes[0];
        newNotes.pinned = newNotes.pinned === 'true' || (newNotes.pinned as any) === 1 || newNotes.pinned === true;
        this.setNotes([...this.getNotes(), newNotes]);
        const resolved = resolve('/(local)/local-note-[id]', {
          id: newNotes.id,
        });
        toast.success('Note created successfully', {
          action: {
            label: 'Open',
            onClick: () => goto(resolved),
          },
        });
        return newNotes;
      }
      toast.error('Something went wrong when creating the note');
    } catch (e) {
      toast.error('Something went wrong when creating the note');
      console.error(e);
    }
  }

  async updateNote(note: LocalNote) {
    try {
      const res = await DB.execute('UPDATE notes SET name = $1, icon = $2, pinned = $3, deleted_at = $4, parent_note_id = $5 WHERE id = $6', [
        note.name,
        note.icon,
        note.pinned,
        note.deleted_at,
        note.parent_note_id,
        note.id,
      ]);
      if (res.rowsAffected === 1) {
        this.setNotes(this.getNotes().map((n) => (n.id === note.id ? note : n)));
      } else {
        toast.error('Something went wrong when updating the note');
      }
    } catch (e) {
      toast.error('Something went wrong when updating the note');
      console.error(e);
    }
  }

  async togglePinned(note: LocalNote) {
    const updatedNote = { ...note, pinned: !note.pinned };
    await this.updateNote(updatedNote);
  }

  async deleteNote(note: LocalNote) {
    const permission = await ask(
      'Are you sure you want to permanently delete this note? This action cannot be undone.',
      {
        title: `Permanently delete ${note.name}?`,
        kind: 'warning',
        okLabel: 'Delete',
      }
    );
    if (!permission) return;
    try {
      if (page.url.pathname.endsWith(`local-note-${note.id}`)) goto(resolve('/'));
      const res = await DB.execute('DELETE FROM notes WHERE id = $1', [note.id]);
      if (res.rowsAffected === 1) {
        this.setNotes(this.getNotes().filter((n) => n.id !== note.id));
      } else {
        toast.error('Something went wrong when deleting the note');
      }
    } catch (e) {
      toast.error('Something went wrong when deleting the note');
      console.error(e);
    }
  }

  async trashNote(note: LocalNote) {
    const permission = await ask('You will still be able to access the note from the trash. Do you want to continue?', {
      title: `Move ${note.name} to trash?`,
      kind: 'info',
      okLabel: 'Trash it',
    });
    if (!permission) return;
    const updatedNote = { ...note, deleted_at: Math.floor(Date.now() / 1000) };
    this.updateNote(updatedNote);
  }

  async restoreNote(note: LocalNote) {
    const updatedNote = { ...note, deleted_at: null };
    this.updateNote(updatedNote);
  }

  async duplicateNote(workspace: LocalWorkSpace, note: LocalNote) {
    await this.createNote(`${note.name} (Copy)`, note.icon, note.pinned, workspace, note.parent_note_id);
  }
}

const NOTESKEY = Symbol('NOTESID');

export const setLocalNotes = (notes: LocalNote[] = []) => {
  return setContext(NOTESKEY, new Notes(notes));
};

export const getLocalNotes = () => {
  return getContext<ReturnType<typeof setLocalNotes>>(NOTESKEY);
};
