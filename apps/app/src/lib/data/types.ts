import type { NoteMeta as CloudNoteMeta } from "@nota/db/data/notes";
import type { CloudWorkspace } from "@nota/db/types";
import type {
	CreateLocalWorkspace,
	InsertLocalNote,
	LocalNote,
	LocalNoteMeta,
	LocalWorkspace,
	UpdateLocalNote,
} from "@nota/db-local/types";

export type Workspace = LocalWorkspace | CloudWorkspace;

export interface ILocalWorkspaces {
	readonly workspaces: LocalWorkspace[];
	insert(input: CreateLocalWorkspace): Promise<void>;
	fetch(): Promise<void>;
}

export type NoteMeta = LocalNoteMeta | CloudNoteMeta;

export type Note = LocalNote | (CloudNoteMeta & { ownerId: string });

export interface ILocalNotes {
	notes(workspaceId: string): readonly LocalNoteMeta[];
	fetchByWorkspace(workspaceId: string): Promise<void>;
	create(
		input: Omit<InsertLocalNote, "id" | "createdAt" | "updatedAt">,
	): Promise<void>;
	update(id: string, input: UpdateLocalNote): Promise<void>;
	delete(id: string): Promise<void>;
	saveContent(
		id: string,
		content: unknown,
		contentText?: string | null,
	): Promise<void>;
}
