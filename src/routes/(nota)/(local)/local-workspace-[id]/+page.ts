import { ISTAURI } from '$lib/utils';
import { toast } from 'svelte-sonner';
import type { PageLoad } from './$types';
import { goto } from '$app/navigation';
import type { LocalWorkSpace } from '$lib/local/workspaces.svelte';
import { DB } from '$lib/local/db';
import { load as loadStore } from '@tauri-apps/plugin-store';
import type { Content } from '@tiptap/core';
import { DEFAULT_SETTINGS, type NotePageSettingsType } from '$lib/types';
import { dirname, resolve } from '@tauri-apps/api/path';

async function loadLocalWorkSpace(id: string): Promise<LocalWorkSpace | null> {
	try {
		const res = await DB.select<LocalWorkSpace[]>('SELECT * FROM workspaces WHERE id = $1', [id]);
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
		toast.warning('Can not load a local workspace in browser');
		goto('/home');
		return;
	}

	const workspace = await loadLocalWorkSpace(params.id);
	if (workspace === null) {
		toast.error('Workspace not found');
		goto('/home');
		return;
	}

	const path = await resolve(workspace.path, '.workspace.nota');
	const store = await loadStore(path, { autoSave: false });

	const content = (await store.get<Content>('content')) ?? null;

	const settings = await store.get<NotePageSettingsType>('settings');
	if (settings === undefined) {
		await store.set('settings', DEFAULT_SETTINGS);
		await store.save();
	}

	const noteDir = await dirname(workspace.path);
	const assetsPath = await resolve(noteDir, 'assets');

	return {
		workspace,
		store,
		content,
		settings,
		assetsPath
	};
};
