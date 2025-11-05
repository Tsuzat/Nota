import { toast } from 'svelte-sonner';
import { DB } from './db';
import { getContext, setContext } from 'svelte';
import type { LocalWorkSpace } from './workspaces.svelte';
import { goto } from '$app/navigation';
import { page } from '$app/state';
import { ask } from '@tauri-apps/plugin-dialog';
import { resolve } from '$app/paths';

export interface LocalNote {
	id: number;
	name: string;
	icon: string;
	workspace: number;
	userworkspace: number;
	favorite: boolean | string;
	trashed: boolean | string;
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

	async fetchNotes(userWorkspaceId: number) {
		try {
			let res = await DB.select<LocalNote[]>(
				'SELECT id, name, icon, workspace, userworkspace, favorite, trashed, created_at, updated_at FROM notes WHERE userworkspace = $1',
				[userWorkspaceId]
			);
			res = res.map((r) => {
				return { ...r, favorite: r.favorite === 'true', trashed: r.trashed === 'true' };
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
		favorite: boolean | string,
		workspace: LocalWorkSpace,
		userworkspace: number
	) {
		try {
			const res = await DB.execute(
				'INSERT INTO notes (name, icon, workspace, userworkspace, favorite) VALUES ($1, $2, $3, $4, $5)',
				[name, icon, workspace.id, userworkspace, favorite]
			);
			if (res.lastInsertId) {
				const notes = await DB.select<LocalNote[]>(
					'SELECT id, name, icon, workspace, userworkspace, favorite, trashed, created_at, updated_at FROM notes WHERE id = $1',
					[res.lastInsertId]
				);

				const newNotes = notes[0];
				this.setNotes([...this.getNotes(), newNotes]);
				const resolved = resolve('/(nota)/(local)/local-note-[id]', { id: String(newNotes.id) });
				toast.success('Note created successfully', {
					action: {
						label: 'Open',
						onClick: () => goto(resolved)
					}
				});
				return newNotes;
			} else {
				toast.error('Something went wrong when creating the note');
			}
		} catch (e) {
			toast.error('Something went wrong when creating the note');
			console.error(e);
		}
	}
	async updateNote(note: LocalNote) {
		try {
			const res = await DB.execute(
				'UPDATE notes SET name = $1, icon = $2, favorite = $3, trashed = $4 WHERE id = $5',
				[note.name, note.icon, note.favorite, note.trashed, note.id]
			);
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

	async deleteNote(note: LocalNote) {
		try {
			if (page.url.pathname.endsWith(`local-note-${note.id}`)) goto(resolve('/home'));
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
		const permission = await ask(
			`You will still be able to access the note from the trash. Do you want to continue?`,
			{
				title: `Move ${note.name} to trash?`,
				kind: 'info',
				okLabel: 'Trash it'
			}
		);
		if (!permission) return;
		note = { ...note, trashed: true };
		this.updateNote(note);
	}

	async restoreNote(note: LocalNote) {
		note = { ...note, trashed: false };
		this.updateNote(note);
	}

	async duplicateNote(workspace: LocalWorkSpace, note: LocalNote) {
		await this.createNote(
			note.name + '(Copy)',
			note.icon,
			note.favorite,
			workspace,
			note.userworkspace
		);
	}

	// export the note with it's assets
	async exportNote(note: LocalNote) {
		toast.loading(`Exporting note ${note.name}...`);
	}
}

const NOTESKEY = Symbol('NOTESID');

export const setLocalNotes = (notes: LocalNote[] = []) => {
	return setContext(NOTESKEY, new Notes(notes));
};

export const getLocalNotes = () => {
	return getContext<ReturnType<typeof setLocalNotes>>(NOTESKEY);
};
