import { toast } from 'svelte-sonner';
import { DB } from './db';
import { setContext, getContext } from 'svelte';

export interface LocalUserWorkspace {
	id: string;
	name: string;
	icon: string;
}

class UserWorkspaces {
	#userWorkspaces = $state<LocalUserWorkspace[]>([]);
	#currentUserWorkspace = $state<LocalUserWorkspace>();

	constructor(userWorkspaces: LocalUserWorkspace[]) {
		this.#userWorkspaces = userWorkspaces;
	}

	getUserWorkspaces() {
		return this.#userWorkspaces;
	}
	setUserWorkspaces(userWorkspaces: LocalUserWorkspace[]) {
		this.#userWorkspaces = userWorkspaces;
	}
	getCurrentUserWorkspace() {
		return this.#currentUserWorkspace;
	}
	setCurrentUserWorkspace(currentUserWorkspace: LocalUserWorkspace) {
		localStorage.setItem('currentUserWorkspaceId', currentUserWorkspace.id);
		this.#currentUserWorkspace = currentUserWorkspace;
	}

	async fetchUserWorkspaces() {
		try {
			const res = await DB.select<LocalUserWorkspace[]>('SELECT * FROM userworkspaces');
			this.setUserWorkspaces(res);
			if (res.length === 0) return;
			const raw = localStorage.getItem('currentUserWorkspaceId');
			const setCurrentUserWorkspace = raw ? res.find((w) => w.id === raw) : res[0];
			if (setCurrentUserWorkspace) {
				this.setCurrentUserWorkspace(setCurrentUserWorkspace);
			}
		} catch (e) {
			toast.error('Something went wrong when getting the user workspaces');
			console.error(e);
		}
	}

	async createUserWorkspace(name: string, icon: string) {
		try {
			const id = crypto.randomUUID();
			const res = await DB.execute(
				'INSERT INTO userworkspaces (id, name, icon) VALUES ($1, $2, $3)',
				[id, name, icon]
			);
			if (res.rowsAffected > 0) {
				this.fetchUserWorkspaces();
			} else {
				toast.error('Something went wrong when creating the user workspace');
			}
		} catch (e) {
			toast.error('Something went wrong when creating the user workspace');
			console.error(e);
		}
	}
}

const USERWORKSPACESKEY = Symbol('USERWORKSPACESID');

export const setLocalUserWorkspaces = (userWorkspaces: LocalUserWorkspace[] = []) => {
	return setContext(USERWORKSPACESKEY, new UserWorkspaces(userWorkspaces));
};

export const getLocalUserWorkspaces = () => {
	return getContext<ReturnType<typeof setLocalUserWorkspaces>>(USERWORKSPACESKEY);
};
