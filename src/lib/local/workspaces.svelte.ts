import { getContext, setContext } from 'svelte';
import { DB } from './db';
import { toast } from 'svelte-sonner';

interface LocalWorkSpace {
	id: string;
	name: string;
	icon: string;
	path: string;
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
}

const WORKSPACESKEY = Symbol('WORKSPACESID');

export const setLocalWorkspaces = (workspaces: LocalWorkSpace[] = []) => {
	return setContext(WORKSPACESKEY, new WorkSpaces(workspaces));
};

export const getLocalWorkspaces = () => {
	return getContext<ReturnType<typeof setLocalWorkspaces>>(WORKSPACESKEY);
};
