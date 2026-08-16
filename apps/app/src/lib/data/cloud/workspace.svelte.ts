import type { CloudWorkspace } from "@nota/db/types";

export class CloudWorkspaces {
	#workspaces = $state<CloudWorkspace[]>([]);
	get workspaces() {
		return this.#workspaces;
	}
	set workspaces(value: CloudWorkspace[]) {
		this.#workspaces = value;
	}

	async fetch() {}
}
