import type { Content } from "@nota/ui/edra/types.js";
import { toast } from "@nota/ui/shadcn/sonner";
import { ask } from "@tauri-apps/plugin-dialog";
import { getContext, setContext } from "svelte";
import { goto } from "$app/navigation";
import { resolve } from "$app/paths";
import { page } from "$app/state";
import { getNewUUID } from "$lib/utils";
import { DB } from "./db";
import type { LocalWorkSpace } from "./workspaces.svelte";

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
        "SELECT id, workspace_id, parent_note_id, name, icon, pinned, deleted_at, created_at, updated_at FROM notes",
      );
      res = res.map((r) => {
        return {
          ...r,
          pinned:
            r.pinned === "true" || (r.pinned as any) === 1 || r.pinned === true,
        };
      });
      this.setNotes(res);
    } catch (e) {
      toast.error("Something went wrong when getting the notes");
      console.error(e);
    }
  }

  async fetchNotesForWorkspace(workspaceId: string) {
    try {
      let res = await DB.select<LocalNote[]>(
        "SELECT id, workspace_id, parent_note_id, name, icon, pinned, deleted_at, created_at, updated_at FROM notes WHERE workspace_id = $1",
        [workspaceId],
      );
      res = res.map((r) => {
        return {
          ...r,
          pinned:
            r.pinned === "true" || (r.pinned as any) === 1 || r.pinned === true,
        };
      });
      this.setNotes(res);
    } catch (e) {
      toast.error("Something went wrong when getting the notes");
      console.error(e);
    }
  }

  async createNote(
    name: string,
    icon: string,
    pinned: boolean | string,
    workspaceId: string,
    parent_note_id: string | null = null,
    content?: Content,
  ) {
    try {
      const id = getNewUUID(this.#notes.map((t) => t.id));
      const res = await DB.execute(
        "INSERT INTO notes (id, workspace_id, parent_note_id, name, icon, pinned, content) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [
          id,
          workspaceId,
          parent_note_id,
          name,
          icon,
          pinned,
          JSON.stringify(content ?? {}),
        ],
      );
      if (res.rowsAffected === 1) {
        const notes = await DB.select<LocalNote[]>(
          "SELECT id, workspace_id, parent_note_id, name, icon, pinned, deleted_at, created_at, updated_at FROM notes WHERE id = $1",
          [id],
        );
        const newNotes = notes[0];
        newNotes.pinned =
          newNotes.pinned === "true" ||
          (newNotes.pinned as any) === 1 ||
          newNotes.pinned === true;
        this.setNotes([...this.getNotes(), newNotes]);
        const resolved = resolve("/(local)/local-note-[id]", {
          id: newNotes.id,
        });
        toast.success("Note created successfully", {
          action: {
            label: "Open",
            onClick: () => goto(resolved),
          },
        });
        return newNotes;
      }
      toast.error("Something went wrong when creating the note");
    } catch (e) {
      toast.error("Something went wrong when creating the note");
      console.error(e);
    }
  }

  async updateNote(note: LocalNote) {
    try {
      const res = await DB.execute(
        "UPDATE notes SET name = $1, icon = $2, pinned = $3, deleted_at = $4, parent_note_id = $5, workspace_id = $6 WHERE id = $7",
        [
          note.name,
          note.icon,
          note.pinned,
          note.deleted_at,
          note.parent_note_id,
          note.workspace_id,
          note.id,
        ],
      );
      if (res.rowsAffected === 1) {
        const originalNote = this.#notes.find((n) => n.id === note.id);
        const currentWorkspaceId = originalNote?.workspace_id;
        if (currentWorkspaceId && note.workspace_id !== currentWorkspaceId) {
          this.setNotes(this.getNotes().filter((n) => n.id !== note.id));
        } else {
          this.setNotes(
            this.getNotes().map((n) => (n.id === note.id ? note : n)),
          );
        }
      } else {
        toast.error("Something went wrong when updating the note");
      }
    } catch (e) {
      toast.error("Something went wrong when updating the note");
      console.error(e);
    }
  }

  async moveNote(
    noteId: string,
    workspaceId: string,
    parentNoteId: string | null,
  ) {
    try {
      const note = this.#notes.find((n) => n.id === noteId);
      if (!note) return;

      const descendants: LocalNote[] = [];
      const queue = [noteId];
      while (queue.length > 0) {
        const currentId = queue.shift()!;
        const children = this.#notes.filter(
          (n) => n.parent_note_id === currentId,
        );
        for (const child of children) {
          descendants.push(child);
          queue.push(child.id);
        }
      }

      await DB.execute(
        "UPDATE notes SET workspace_id = $1, parent_note_id = $2 WHERE id = $3",
        [workspaceId, parentNoteId, noteId],
      );

      const currentWorkspaceId = note.workspace_id;
      if (workspaceId !== currentWorkspaceId) {
        for (const desc of descendants) {
          await DB.execute("UPDATE notes SET workspace_id = $1 WHERE id = $2", [
            workspaceId,
            desc.id,
          ]);
        }
      }

      if (workspaceId !== currentWorkspaceId) {
        const descIds = new Set(descendants.map((d) => d.id));
        this.setNotes(
          this.getNotes().filter((n) => n.id !== noteId && !descIds.has(n.id)),
        );
      } else {
        this.setNotes(
          this.getNotes().map((n) => {
            if (n.id === noteId) {
              return { ...n, parent_note_id: parentNoteId };
            }
            return n;
          }),
        );
      }
      toast.success("Note moved successfully");
    } catch (e) {
      toast.error("Something went wrong when moving the note");
      console.error(e);
    }
  }

  async togglePinned(note: LocalNote) {
    const updatedNote = { ...note, pinned: !note.pinned };
    await this.updateNote(updatedNote);
  }

  async delete(noteId: string) {
    try {
      const res = await DB.execute("DELETE FROM notes WHERE id = $1", [noteId]);
      if (res.rowsAffected === 1) {
        this.setNotes(this.getNotes().filter((n) => n.id !== noteId));
      } else {
        toast.error("Something went wrong when deleting the note");
      }
    } catch (e) {
      toast.error("Something went wrong when deleting the note");
      console.error(e);
    }
  }

  async trashNote(note: LocalNote) {
    const updatedNote = { ...note, deleted_at: Math.floor(Date.now() / 1000) };
    this.updateNote(updatedNote);
  }

  async restoreNote(note: LocalNote) {
    const updatedNote = { ...note, deleted_at: null };
    this.updateNote(updatedNote);
  }

  /**
   * Duplicates a note in DB directly and updates the #notes variable
   * @param noteId string
   * @returns void
   */
  async duplicateNote(noteId: string) {
    try {
      const id = getNewUUID(this.#notes.map((t) => t.id));
      const res = await DB.execute(
        "INSERT INTO notes (id, workspace_id, parent_note_id, name, icon, pinned, content) SELECT $1, workspace_id, parent_note_id, name || ' (Copy)', icon, pinned, content FROM notes WHERE id = $2",
        [id, noteId],
      );
      if (res.rowsAffected === 1) {
        const notes = await DB.select<LocalNote[]>(
          "SELECT id, workspace_id, parent_note_id, name, icon, pinned, deleted_at, created_at, updated_at FROM notes WHERE id = $1",
          [id],
        );
        const newNotes = notes[0];
        newNotes.pinned =
          newNotes.pinned === "true" ||
          (newNotes.pinned as any) === 1 ||
          newNotes.pinned === true;
        this.setNotes([...this.getNotes(), newNotes]);
        return newNotes;
      }
    } catch (e) {
      toast.error("Something went wrong when duplicating the note");
      console.error(e);
    }
  }
}

const NOTESKEY = Symbol("NOTESID");

export const setLocalNotes = (notes: LocalNote[] = []) => {
  return setContext(NOTESKEY, new Notes(notes));
};

export const getLocalNotes = () => {
  return getContext<ReturnType<typeof setLocalNotes>>(NOTESKEY);
};
