import { getContext, setContext } from 'svelte';
import { DB } from './db';
import { toast } from 'svelte-sonner';
import { mkdir, remove } from '@tauri-apps/plugin-fs';
import { load } from '@tauri-apps/plugin-store';
import { resolve } from '@tauri-apps/api/path';
import { getNewUUID } from '$lib/utils';
import { getLocalNotes } from './notes.svelte';

export interface LocalWorkSpace {
	id: string;
	name: string;
	icon: string;
	path: string;
	created_at: string;
	updated_at: string;
	userworkspace: string;
}

class WorkSpaces {
	#workspaces = $state<LocalWorkSpace[]>([]);

	constructor(workspaces: LocalWorkSpace[]) {
		this.#workspaces = workspaces;
	}

	getWorkspaces() {
		return this.#workspaces;
	}

	setWorkspaces(workspaces: LocalWorkSpace[]) {
		this.#workspaces = workspaces;
	}

	async fetchWorkspaces(userWorkspaceId: string) {
		try {
			const res = await DB.select<LocalWorkSpace[]>(
				'SELECT * FROM workspaces WHERE userworkspace = $1',
				[userWorkspaceId]
			);
			this.setWorkspaces(res);
		} catch (e) {
			toast.error('Something went wrong when getting the workspaces');
			console.error(e);
		}
	}

	async createWorkspace(icon: string, name: string, dir: string, userWorkspaceId: string) {
		const path = await resolve(dir, name);
		try {
			await mkdir(path);
			const assetsLocation = await resolve(path, 'assets');
			await mkdir(assetsLocation);
			const workspacePath = await resolve(path, '.workspace.nota');
			const store = await load(workspacePath, { autoSave: true });
			const uuid = getNewUUID(this.getWorkspaces().map((w) => w.id));
			const created_at = new Date().toISOString();
			// set to store
			await store.set('id', uuid);
			await store.set('icon', icon);
			await store.set('name', name);
			await store.set('created_at', created_at);
			await store.set('updated_at', created_at);
			await store.set('content', null);
			await store.save();
			await store.close();
			// insert into database
			const res = await DB.execute(
				'INSERT INTO workspaces (id, name, icon, path, created_at, updated_at, userworkspace) VALUES ($1, $2, $3, $4, $5, $6, $7)',
				[uuid, name, icon, path, created_at, created_at, userWorkspaceId]
			);
			if (res.rowsAffected === 1) {
				toast.success('Created workspace successfully');
				const newWorkspace: LocalWorkSpace = {
					id: uuid as string,
					name: name,
					icon: icon,
					path: path,
					created_at: created_at,
					updated_at: created_at,
					userworkspace: userWorkspaceId
				};
				this.setWorkspaces([...this.getWorkspaces(), newWorkspace]);
			} else {
				toast.warning('Could not create workspace.');
				await remove(path);
			}
		} catch (e) {
			console.error(e);
			toast.error('Something went wrong');
			await remove(path);
		}
	}

	async deleteWorkspace(workspace: LocalWorkSpace) {
		try {
			const res = await DB.execute('DELETE FROM workspaces WHERE id = $1', [workspace.id]);
			if (res.rowsAffected === 1) {
				await remove(workspace.path);
				this.setWorkspaces(this.getWorkspaces().filter((w) => w.id !== workspace.id));
				toast.success('Workspace deleted successfully');
				const localNotes = getLocalNotes();
				localNotes.setNotes(localNotes.getNotes().filter((n) => n.workspace !== workspace.id));
			} else {
				toast.warning('Could not delete workspace from database.');
			}
		} catch (e) {
			console.error(e);
			toast.error('Something went wrong when deleting the workspace.');
		}
	}

	async updateWorkspace(workspace: LocalWorkSpace) {
		try {
			const res = await DB.execute(
				'UPDATE workspaces SET name = $1, icon = $2, path = $3, created_at = $4, updated_at = $5 WHERE id = $6',
				[
					workspace.name,
					workspace.icon,
					workspace.path,
					workspace.created_at,
					workspace.updated_at,
					workspace.id
				]
			);
			if (res.rowsAffected === 1) {
				this.setWorkspaces(
					this.getWorkspaces().map((w) => (w.id === workspace.id ? workspace : w))
				);
			} else {
				toast.warning('Could not update workspace.');
			}
		} catch (e) {
			console.error(e);
			toast.error('Something went wrong when updating the workspace.');
		}
	}
}

const WORKSPACESKEY = Symbol('WORKSPACESID');

export const setLocalWorkspaces = (workspaces: LocalWorkSpace[] = []) => {
	return setContext(WORKSPACESKEY, new WorkSpaces(workspaces));
};

export const getLocalWorkspaces = () => {
	return getContext<ReturnType<typeof setLocalWorkspaces>>(WORKSPACESKEY);
};
