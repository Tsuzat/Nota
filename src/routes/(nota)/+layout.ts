import { goto } from '$app/navigation';
import { DB } from '$lib/local/db';
import type { LocalNote } from '$lib/local/notes.svelte';
import type { LocalUserWorkspace } from '$lib/local/userworkspaces.svelte';
import type { LocalWorkSpace } from '$lib/local/workspaces.svelte';
import { toast } from 'svelte-sonner';

async function loadLocalUserWorkspaces(): Promise<LocalUserWorkspace[] | null> {
	let localUserWorkspaces: LocalUserWorkspace[] = [];
	try {
		localUserWorkspaces = await DB.select<LocalUserWorkspace[]>('SELECT * FROM userworkspaces');
		if (localUserWorkspaces.length === 0) {
			const id = crypto.randomUUID();
			const name = 'Personal';
			const icon = 'lucide:User';
			const res = await DB.execute(
				'INSERT INTO userworkspaces (id, name, icon) VALUES ($1, $2, $3)',
				[crypto.randomUUID(), 'Personal', 'lucide:User']
			);
			if (res.rowsAffected > 0) {
				localUserWorkspaces.push({
					id,
					name,
					icon
				});
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
			const currentUserWorkspace = localWorkspaces.find((w) => w.id === currentUserWorkspaceId);
			if (currentUserWorkspace) return currentUserWorkspace;
			else {
				localStorage.setItem('currentUserWorkspaceId', localWorkspaces[0].id);
				return localWorkspaces[0];
			}
		} else {
			localStorage.setItem('currentUserWorkspaceId', localWorkspaces[0].id);
			return localWorkspaces[0];
		}
	} catch (e) {
		console.error(e);
		return null;
	}
}

async function loadLocalWorkspaces(
	currentUserWorkspaceId: string
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

async function loadLocalNotes(currentUserWorkspaceId: string): Promise<LocalNote[] | null> {
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
	const localUserWorkspaces = await loadLocalUserWorkspaces();
	if (localUserWorkspaces === null) {
		toast.error('Something went wrong when loading the user workspaces');
		return goto('/');
	}
	const currentUserWorkspace = await loadCurrentUserWorkspace(localUserWorkspaces);

	if (currentUserWorkspace === null) {
		toast.error('Something went wrong when loading the current user workspace');
		return goto('/');
	}

	const localWorkspaces = await loadLocalWorkspaces(currentUserWorkspace.id);

	if (localWorkspaces === null) {
		toast.error('Something went wrong when loading the workspaces');
		return goto('/');
	}

	const localNotes = await loadLocalNotes(currentUserWorkspace.id);

	if (localNotes === null) {
		toast.error('Something went wrong when loading the notes');
		return goto('/');
	}

	return {
		localUserWorkspaces,
		currentUserWorkspace,
		localWorkspaces,
		localNotes
	};
};
