import { getContext, setContext } from 'svelte';

export interface WorkSpace {
	id: string;
	name: string;
	icon: string;
	location: string;
	createdAt: string;
	updatedAt: string;
}

class WorkSpaces {
	#workspaces = $state<WorkSpace[]>([]);

	constructor(workspaces: WorkSpace[] = []) {
		this.#workspaces = workspaces;
	}

	set workspaces(workspaces: WorkSpace[]) {
		this.#workspaces = workspaces;
	}

	get workspaces() {
		return this.#workspaces;
	}

	async fetchFromDB() {}

	async add(workspace: WorkSpace) {
		this.#workspaces = [...this.#workspaces, workspace];
	}

	async delete(workspace: WorkSpace) {
		this.#workspaces = this.#workspaces.filter((w) => w.id !== workspace.id);
	}

	async update(workspace: WorkSpace) {
		this.#workspaces = this.#workspaces.filter((w) => {
			return w.id === workspace.id ? workspace : w;
		});
	}
}

const WORKSPACES = Symbol('WORKSPACE');

/**
 * Set the workspace context for global variable
 * @param workspace WorkSpaces[]
 */
export const setWorkSpaces = (workspaces: WorkSpace[] = []) => {
	return setContext(WORKSPACES, new WorkSpaces(workspaces));
};

export const useWorkSpaces = () => {
	return getContext<ReturnType<typeof setWorkSpaces>>(WORKSPACES);
};
