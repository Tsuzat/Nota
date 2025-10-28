import { toast } from 'svelte-sonner';
import { DB } from './db';
import { setContext, getContext } from 'svelte';

export interface LocalUserWorkspace {
	id: number;
	name: string;
	icon: string;
}

class UserWorkspaces {
	#userWorkspaces = $state<LocalUserWorkspace[]>([]);

	constructor(userWorkspaces: LocalUserWorkspace[]) {
		this.#userWorkspaces = userWorkspaces;
	}

	getUserWorkspaces() {
		return this.#userWorkspaces;
	}

	setUserWorkspaces(userWorkspaces: LocalUserWorkspace[]) {
		this.#userWorkspaces = userWorkspaces;
	}

	async fetchUserWorkspaces() {
		try {
			const res = await DB.select<LocalUserWorkspace[]>('SELECT * FROM userworkspaces');
			this.setUserWorkspaces(res);
		} catch (e) {
			toast.error('Something went wrong when getting the user workspaces');
			console.error(e);
		}
	}

	async createUserWorkspace(name: string, icon: string) {
		try {
			const res = await DB.execute('INSERT INTO userworkspaces (name, icon) VALUES ($1, $2)', [
				name,
				icon
			]);
			if (res.lastInsertId) {
				const newUserWorkspaces: LocalUserWorkspace = {
					id: res.lastInsertId as number,
					name,
					icon
				};
				this.setUserWorkspaces([...this.getUserWorkspaces(), newUserWorkspaces]);
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
