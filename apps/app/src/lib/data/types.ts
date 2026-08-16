import type { CloudWorkspace } from "@nota/db/types";
import type {
	CreateLocalWorkspace,
	LocalWorkspace,
} from "@nota/db-local/types";

export type Workspace = LocalWorkspace | CloudWorkspace;

export interface ILocalWorkspaces {
	readonly workspaces: LocalWorkspace[];
	insert(input: CreateLocalWorkspace): Promise<void>;
	fetch(): Promise<void>;
}
