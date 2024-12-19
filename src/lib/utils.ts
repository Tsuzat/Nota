import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { initializeDatabase } from './database/sqldb';
import { FAVORITE_NOTES, WORKSPACES } from './contants';
import type { WorkSpaceDB } from './database/workspace';
import type { NotesDB } from './database/notes';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export async function initializeApplication() {
	await initializeDatabase();
}

/**
 * Updates the global variable WORKSPACES
 * @param workspace WorkspaceDB - Workspace to be updated
 */
export async function updateWorkspaceDB(workspace: WorkSpaceDB) {
	WORKSPACES.update((workspaces) => {
		const workspaceEntry = Array.from(workspaces.entries()).find(
			([key]) => key.id === workspace.id
		);
		if (!workspaceEntry) return workspaces;
		const [originalWorkspace, notes] = workspaceEntry;
		workspaces.delete(originalWorkspace);
		workspaces.set(workspace, notes);
		return workspaces;
	});
}

/**
 * Update the global variable FAVORITE_NOTES with the new note
 * @param note NotesDB - Note to be updated
 */
export async function updateFavoriteNote(note: NotesDB) {
	FAVORITE_NOTES.update((notes) => {
		return notes.map((n) => (n.id === note.id ? note : n));
	});
}
