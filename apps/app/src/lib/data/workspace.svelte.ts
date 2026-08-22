import { getContext, setContext } from "svelte";
import { LocalWorkspaces } from "$local-workspaces";
import { CloudWorkspaces } from "./cloud/workspace.svelte";
import type { Workspace } from "./types";

class Workspaces {
	cloud = new CloudWorkspaces();
	local = new LocalWorkspaces();
	current = $state<Workspace | null>(null);

	all = $derived([...this.local.workspaces, ...this.cloud.workspaces]);

	constructor() {
		$effect(() => {
			if (this.current && this.all.some((w) => w.id === this.current?.id)) {
				return;
			}
			this.current = this.all[0] ?? null;
		});
	}

	async init() {
		await this.local.fetch();
	}
}

const WORKSPACE = Symbol("WORKSPACE");

/**
 * Sets the workspace context for the current component tree.
 * @returns The Workspaces instance.
 */
export const setWorkspaceContext = () => {
	return setContext(WORKSPACE, new Workspaces());
};

/**
 * Gets the workspace context from the current component tree.
 * @returns The Workspaces instance.
 */
export const getWorkspaceContext = () => {
	return getContext<ReturnType<typeof setWorkspaceContext>>(WORKSPACE);
};
