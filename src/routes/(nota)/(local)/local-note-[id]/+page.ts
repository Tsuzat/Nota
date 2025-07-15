import { ISTAURI } from '$lib/utils';
import { toast } from 'svelte-sonner';
import type { PageLoad } from './$types';
import { goto } from '$app/navigation';
import type { LocalNote } from '$lib/local/notes.svelte';
import { DB } from '$lib/local/db';
import { load as loadStore } from '@tauri-apps/plugin-store';
import type { Content } from '@tiptap/core';
import { DEFAULT_SETTINGS, type NotePageSettingsType } from '$lib/types';

async function loadLocalNote(id: string): Promise<LocalNote | null> {
	try {
		const res = await DB.select<LocalNote[]>('SELECT * FROM notes WHERE id = $1', [id]);
		if (res.length === 0) {
			return null;
		} else {
			return res[0];
		}
	} catch (e) {
		console.error(e);
		return null;
	}
}

export const load: PageLoad = async ({ params }) => {
	if (!ISTAURI) {
		toast.warning('Can not load a local note in browser');
		goto('/home');
		return;
	}

	const note = await loadLocalNote(params.id);
	if (note === null) {
		toast.error('Note not found');
		goto('/home');
		return;
	}
	const store = await loadStore(note.path, { autoSave: false });

	const content = (await store.get<Content>('content')) ?? null;

	const settings = (await store.get<NotePageSettingsType>('settings')) ?? DEFAULT_SETTINGS;

	return {
		note,
		store,
		content,
		settings
	};
};
