import { toast } from 'svelte-sonner';
import { DB } from './db';
import { getContext, setContext } from 'svelte';

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

class LocalNotes {
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
}

const NOTESKEY = Symbol('NOTESID');

export const setLocalNotes = (notes: LocalNote[] = []) => {
	return setContext(NOTESKEY, new LocalNotes(notes));
};

export const getLocalNotes = () => {
	return getContext<ReturnType<typeof setLocalNotes>>(NOTESKEY);
};
