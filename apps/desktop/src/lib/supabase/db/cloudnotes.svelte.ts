import type { Content } from '@nota/ui/edra/types.js';
import { toast } from '@nota/ui/shadcn/sonner';
import { ask } from '@tauri-apps/plugin-dialog';
import { getContext, setContext } from 'svelte';
import { supabase } from '..';
import type { CloudUserWorkspace } from './clouduserworkspaces.svelte';

export interface CloudNote {
  id: string;
  name: string;
  icon: string;
  workspace: string;
  userworkspace: string;
  owner: string;
  favorite: boolean;
  trashed: boolean;
  created_at: string;
  updated_at: string;
  isPublic: boolean;
}

class CloudNotes {
  #notes = $state<CloudNote[]>([]);

  getNotes() {
    return this.#notes;
  }

  setNotes(notes: CloudNote[]) {
    this.#notes = notes;
  }

  /**
   * Get notes that are not trashed
   */
  getActiveNotes() {
    return this.#notes.filter((note) => !note.trashed);
  }

  /**
   * Get favorite notes
   */
  getFavoriteNotes() {
    return this.#notes.filter((note) => note.favorite && !note.trashed);
  }

  /**
   * Get trashed notes
   */
  getTrashedNotes() {
    return this.#notes.filter((note) => note.trashed);
  }

  /**
   * Fetch notes for a specific workspace
   */
  async fetchNotes(userworkspace: CloudUserWorkspace) {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('id, name, icon, workspace, userworkspace, owner, favorite, trashed, created_at, updated_at, isPublic')
        .eq('userworkspace', userworkspace.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error(error);
        toast.error(error.message);
        return;
      }
      this.#notes = data ?? [];
    } catch (err) {
      console.error('Error fetching notes:', err);
      throw err;
    }
  }

  /**
   * Create a new note in Supabase & update local state
   */
  async createNote(
    note: Partial<CloudNote> & {
      owner: string;
      workspace: string;
      userworkspace: string;
      content?: Content;
    }
  ) {
    try {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          name: note.name,
          icon: note.icon ?? '📝',
          workspace: note.workspace,
          userworkspace: note.userworkspace,
          owner: note.owner,
          favorite: note.favorite ?? false,
          trashed: note.trashed ?? false,
        })
        .select()
        .single();

      if (error) {
        console.error(error);
        toast.error(error.message);
      }
      if (data) {
        this.#notes = [...this.#notes, data];
      }
    } catch (err) {
      console.error('Error creating note:', err);
      toast.error('Error creating note.');
    }
  }

  /**
   * Duplicate a note in Supabase & update local state
   * @param note - Note to be duplicated (its id will be used to fetch the original)
   */
  async duplicate(note: CloudNote) {
    try {
      // exclude the id, created_at, updated_at fields
      const { id, created_at, updated_at, ...rest } = note;
      rest.name = `${rest.name} (Copy)`;
      // Now, insert a new row with the fetched details, modifying the name
      const { data, error } = await supabase.from('notes').insert(rest).select().single();
      if (error) {
        console.error(error);
        toast.error(error.message);
      }
      if (data) {
        this.#notes = [...this.#notes, data];
      }
    } catch (error) {
      console.error(error);
      toast.error('Something went wrong when duplicating note.');
    }
  }

  /**
   * Update an existing note in Supabase & update local state
   */
  async updateNote(note: CloudNote) {
    try {
      const { data, error } = await supabase
        .from('notes')
        .update({
          name: note.name,
          icon: note.icon,
          favorite: note.favorite,
          trashed: note.trashed,
          isPublic: note.isPublic,
        })
        .eq('id', note.id)
        .select()
        .single();

      if (error) {
        console.error(error);
        toast.error(error.message);
      }
      if (data) {
        this.#notes = this.#notes.map((n) => (n.id === data.id ? data : n));
      }
    } catch (err) {
      console.error('Error updating note:', err);
      toast.error('Error updating note.');
    }
  }

  async togglePublic(note: CloudNote) {
    const updatedNote = { ...note, isPublic: !note.isPublic };
    toast.promise(this.updateNote(updatedNote), {
      loading: `Making note ${updatedNote.isPublic ? 'public' : 'private'}`,
      success: `Note visibility updated to ${updatedNote.isPublic ? 'public' : 'private'}`,
      error: 'Error updating note visibility',
    });
  }

  /**
   * Delete a note from Supabase & update local state
   */
  async deleteNote(note: CloudNote) {
    const permission = await ask('You will still be able to access the note from the trash. Do you want to continue?', {
      title: `Move ${note.name} to trash?`,
      kind: 'info',
      okLabel: 'Trash it',
    });
    if (!permission) return;
    try {
      const { error } = await supabase.from('notes').delete().eq('id', note.id);
      if (error) {
        console.error(error);
        toast.error(error.message);
        return;
      }
      this.#notes = this.#notes.filter((n) => n.id !== note.id);
    } catch (err) {
      console.error('Error deleting note:', err);
      throw err;
    }
  }

  /**
   * Toggle favorite status of a note
   */
  async toggleFavorite(note: CloudNote) {
    const updatedNote = { ...note, favorite: !note.favorite };
    await this.updateNote(updatedNote);
  }

  /**
   * Move note to trash
   */
  async moveToTrash(note: CloudNote) {
    const permission = await ask('You will still be able to access the note from the trash. Do you want to continue?', {
      title: `Move ${note.name} to trash?`,
      kind: 'info',
      okLabel: 'Trash it',
    });
    if (!permission) return;
    const updatedNote = { ...note, trashed: true };
    await this.updateNote(updatedNote);
  }

  /**
   * Restore note from trash
   */
  async restoreFromTrash(id: string) {
    const note = this.#notes.find((n) => n.id === id);
    if (!note) return;
    const updatedNote = { ...note, trashed: false };
    await this.updateNote(updatedNote);
  }

  /**
   * Permanently delete all trashed notes
   */
  async emptyTrash() {
    const trashedNotes = this.getTrashedNotes();

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .in(
          'id',
          trashedNotes.map((note) => note.id)
        );

      if (error) {
        console.error(error);
        toast.error(error.message);
        return;
      }

      this.#notes = this.#notes.filter((n) => !n.trashed);
      toast.success('Trash emptied successfully');
    } catch (err) {
      console.error('Error emptying trash:', err);
      toast.error('Error emptying trash.');
    }
  }
}

const CLOUDNOTES = Symbol('CloudNotes');

export const setCloudNotes = () => {
  return setContext(CLOUDNOTES, new CloudNotes());
};

export const useCloudNotes = () => {
  return getContext<ReturnType<typeof setCloudNotes>>(CLOUDNOTES);
};
