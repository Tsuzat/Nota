import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { DB } from '$lib/local/db';
import type { LocalNote } from '$lib/local/notes.svelte';
import type { LocalUserWorkspace } from '$lib/local/userworkspaces.svelte';
import type { LocalWorkSpace } from '$lib/local/workspaces.svelte';
import { ISTAURI } from '$lib/utils';
import { toast } from 'svelte-sonner';

async function loadLocalUserWorkspaces(): Promise<LocalUserWorkspace[] | null> {
	let localUserWorkspaces: LocalUserWorkspace[] = [];
	try {
		localUserWorkspaces = await DB.select<LocalUserWorkspace[]>('SELECT * FROM userworkspaces');
		if (localUserWorkspaces.length === 0) {
			const res = await DB.execute('INSERT INTO userworkspaces (name, icon) VALUES ($1, $2)', [
				'Personal',
				'lucide:User'
			]);
			if (res.lastInsertId) {
				localUserWorkspaces = await DB.select<LocalUserWorkspace[]>('SELECT * FROM userworkspaces');
				return localUserWorkspaces;
			} else {
				return null;
			}
		} else {
			return localUserWorkspaces;
		}
	} catch (e) {
		console.error(e);
		return null;
	}
}

async function loadCurrentUserWorkspace(
	localWorkspaces: LocalUserWorkspace[]
): Promise<LocalUserWorkspace | null> {
	// find the current user workspace id in local storage
	try {
		const currentUserWorkspaceId = localStorage.getItem('currentUserWorkspaceId');
		if (currentUserWorkspaceId) {
			const currentUserWorkspace = localWorkspaces.find(
				(w) => String(w.id) === currentUserWorkspaceId
			);
			if (currentUserWorkspace) return currentUserWorkspace;
			else {
				localStorage.setItem('currentUserWorkspaceId', localWorkspaces[0].id.toString());
				return localWorkspaces[0];
			}
		} else {
			localStorage.setItem('currentUserWorkspaceId', localWorkspaces[0].id.toString());
			return localWorkspaces[0];
		}
	} catch (e) {
		console.error(e);
		return null;
	}
}

async function loadLocalWorkspaces(
	currentUserWorkspaceId: number
): Promise<LocalWorkSpace[] | null> {
	try {
		const res = await DB.select<LocalWorkSpace[]>(
			'SELECT * FROM workspaces WHERE userworkspace = $1',
			[currentUserWorkspaceId]
		);
		return res;
	} catch (error) {
		console.error(error);
		return null;
	}
}

async function loadLocalNotes(currentUserWorkspaceId: number): Promise<LocalNote[] | null> {
	try {
		let res = await DB.select<LocalNote[]>('SELECT * FROM notes WHERE userworkspace = $1', [
			currentUserWorkspaceId
		]);
		res = res.map((r) => {
			return { ...r, favorite: r.favorite === 'true', trashed: r.trashed === 'true' };
		});
		return res;
	} catch (error) {
		console.error(error);
		return null;
	}
}

export const load = async () => {
	if (!ISTAURI) {
		console.log("It's browser");
		return {};
	}

	const localUserWorkspaces = await loadLocalUserWorkspaces();
	if (localUserWorkspaces === null) {
		toast.error('Something went wrong when loading the user workspaces');
		return goto(resolve('/'));
	}
	const currentUserWorkspace = await loadCurrentUserWorkspace(localUserWorkspaces);

	if (currentUserWorkspace === null) {
		toast.error('Something went wrong when loading the current user workspace');
		return goto(resolve('/'));
	}

	const localWorkspaces = await loadLocalWorkspaces(currentUserWorkspace.id);

	if (localWorkspaces === null) {
		toast.error('Something went wrong when loading the workspaces');
		return goto(resolve('/'));
	}

	const localNotes = await loadLocalNotes(currentUserWorkspace.id);

	if (localNotes === null) {
		toast.error('Something went wrong when loading the notes');
		return goto(resolve('/'));
	}

	return {
		localUserWorkspaces,
		currentUserWorkspace,
		localWorkspaces,
		localNotes
	};
};
