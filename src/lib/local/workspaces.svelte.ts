import { getContext, setContext } from 'svelte';
import { DB } from './db';
import { toast } from 'svelte-sonner';
import { getLocalNotes } from './notes.svelte';

export interface LocalWorkSpace {
	id: number;
	name: string;
	icon: string;
	created_at: number;
	updated_at: number;
	userworkspace: number;
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

	async fetchWorkspaces(userWorkspaceId: number) {
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

	async createWorkspace(icon: string, name: string, userWorkspaceId: number) {
		try {
			// insert into database
			const res = await DB.execute(
				'INSERT INTO workspaces (name, icon, userworkspace) VALUES ($1, $2, $3)',
				[name, icon, userWorkspaceId]
			);
			if (res.lastInsertId) {
				const newWorkspace = await DB.select<LocalWorkSpace[]>(
					'SELECT * FROM workspaces WHERE id = $1',
					[res.lastInsertId]
				);
				this.setWorkspaces([...this.getWorkspaces(), newWorkspace[0]]);
			} else {
				toast.warning('Could not create workspace.');
			}
		} catch (e) {
			console.error(e);
			toast.error('Something went wrong');
		}
	}

	async deleteWorkspace(workspace: LocalWorkSpace) {
		try {
			const res = await DB.execute('DELETE FROM workspaces WHERE id = $1', [workspace.id]);
			if (res.rowsAffected === 1) {
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
			const res = await DB.execute('UPDATE workspaces SET name = $1, icon = $2 WHERE id = $3', [
				workspace.name,
				workspace.icon,
				workspace.id
			]);
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
