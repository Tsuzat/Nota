import type { LocalWorkspace } from "@nota/db-local/types";
import type { ILocalWorkspaces } from "../types";

export class LocalWorkspaces implements ILocalWorkspaces {
	workspaces: LocalWorkspace[] = [];
	async fetch() {}
	async insert(): Promise<never> {
		throw new Error("Local workspaces are unavailable on web");
	}
}
