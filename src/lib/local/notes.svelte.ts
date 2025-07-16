import { toast } from 'svelte-sonner';
import { DB } from './db';
import { getContext, setContext } from 'svelte';
import { getNewUUID } from '$lib/utils';
import type { LocalWorkSpace } from './workspaces.svelte';
import { resolve } from '@tauri-apps/api/path';
import { goto } from '$app/navigation';
import { load } from '@tauri-apps/plugin-store';
import { remove } from '@tauri-apps/plugin-fs';
import { page } from '$app/state';

export interface LocalNote {
	id: string;
	name: string;
	icon: string;
	path: string;
	workspace: string;
	userworkspace: string;
	favorite: boolean;
	trashed: boolean;
	created_at: string;
	updated_at: string;
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

	async fetchNotes(userWorkspaceId: string) {
		try {
			const res = await DB.select<LocalNote[]>('SELECT * FROM notes WHERE userworkspace = $1', [
				userWorkspaceId
			]);
			this.setNotes(res);
		} catch (e) {
			toast.error('Something went wrong when getting the notes');
			console.error(e);
		}
	}

	async createNote(
		name: string,
		icon: string,
		favorite: boolean,
		workspace: LocalWorkSpace,
		userworkspace: string
	) {
		try {
			const id = getNewUUID(this.getNotes().map((n) => n.id));
			const path = await resolve(workspace.path, `${id}.nota`);
			const store = await load(path, { autoSave: true });
			await store.set('id', id);
			await store.set('name', name);
			await store.set('icon', icon);
			await store.set('created_at', new Date().toISOString());
			await store.set('updated_at', new Date().toISOString());
			await store.set('content', null);
			await store.save();
			await store.close();

			const newNotes: LocalNote = {
				id,
				name,
				icon,
				path,
				workspace: workspace.id,
				userworkspace,
				favorite,
				trashed: false,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			};
			const res = await DB.execute(
				'INSERT INTO notes (id, name, icon, path, workspace, userworkspace, favorite, trashed, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
				Object.values(newNotes)
			);
			if (res.rowsAffected === 1) {
				this.setNotes([...this.getNotes(), newNotes]);

				toast.success('Note created successfully', {
					action: {
						label: 'Open',
						onClick: () => goto(`local-note-${newNotes.id}`)
					}
				});
			} else {
				await remove(path);
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
				'UPDATE notes SET name = $1, icon = $2, favorite = $3, trashed = $4, updated_at = $5 WHERE id = $6',
				[note.name, note.icon, note.favorite, note.trashed, new Date().toISOString(), note.id]
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
			if (page.url.pathname.endsWith(`local-note-${note.id}`)) goto('/home');
			const res = await DB.execute('DELETE FROM notes WHERE id = $1', [note.id]);
			if (res.rowsAffected === 1) {
				this.setNotes(this.getNotes().filter((n) => n.id !== note.id));
				await remove(note.path);
			} else {
				toast.error('Something went wrong when deleting the note');
			}
		} catch (e) {
			toast.error('Something went wrong when deleting the note');
			console.error(e);
		}
	}
}

const NOTESKEY = Symbol('NOTESID');

export const setLocalNotes = (notes: LocalNote[] = []) => {
	return setContext(NOTESKEY, new Notes(notes));
};

export const getLocalNotes = () => {
	return getContext<ReturnType<typeof setLocalNotes>>(NOTESKEY);
};
