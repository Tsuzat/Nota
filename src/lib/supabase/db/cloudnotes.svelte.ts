import { getContext, setContext } from 'svelte';
import { supabase } from '..';
import { toast } from 'svelte-sonner';
import type { CloudUserWorkspace } from './clouduserworkspaces.svelte';
import type { Content } from '@tiptap/core';

export interface CloudNote {
	id: string;
	name: string;
	icon: string;
	path: string;
	workspace: string;
	userworkspace: string;
	owner: string;
	favorite: boolean;
	trashed: boolean;
	created_at: string;
	updated_at: string;
	content: Content;
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
				.select('*')
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
		note: Partial<CloudNote> & { owner: string; workspace: string; userworkspace: string }
	) {
		try {
			const { data, error } = await supabase
				.from('notes')
				.insert({
					name: note.name,
					icon: note.icon ?? '📝',
					path: note.path ?? '',
					workspace: note.workspace,
					userworkspace: note.userworkspace,
					owner: note.owner,
					favorite: note.favorite ?? false,
					trashed: note.trashed ?? false
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
	 * @param note - Note to be duplicated
	 */
	async duplicate(note: CloudNote) {
		try {
			const { data, error } = await supabase
				.from('notes')
				.insert({
					name: `${note.name} (Copy)`,
					icon: note.icon,
					path: note.path,
					workspace: note.workspace,
					userworkspace: note.userworkspace,
					owner: note.owner,
					favorite: note.favorite,
					trashed: note.trashed
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
					path: note.path,
					favorite: note.favorite,
					trashed: note.trashed
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

	/**
	 * Delete a note from Supabase & update local state
	 */
	async deleteNote(id: string) {
		try {
			const { error } = await supabase.from('notes').delete().eq('id', id);

			if (error) {
				console.error(error);
				toast.error(error.message);
				return;
			}
			this.#notes = this.#notes.filter((n) => n.id !== id);
		} catch (err) {
			console.error('Error deleting note:', err);
			throw err;
		}
	}

	/**
	 * Toggle favorite status of a note
	 */
	async toggleFavorite(id: string) {
		const note = this.#notes.find((n) => n.id === id);
		if (!note) return;

		const updatedNote = { ...note, favorite: !note.favorite };
		await this.updateNote(updatedNote);
	}

	/**
	 * Move note to trash
	 */
	async moveToTrash(id: string) {
		const note = this.#notes.find((n) => n.id === id);
		if (!note) return;

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
