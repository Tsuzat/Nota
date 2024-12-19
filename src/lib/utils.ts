import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { initializeDatabase } from './database/sqldb';
import { FAVORITE_NOTES, WORKSPACES } from './contants';
import type { NotesDB } from './database/notes';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export async function initializeApplication() {
	await initializeDatabase();
}

/**
 * Updates the global variable WORKSPACES with updated NotesDB
 * @param notesDB NotesDB - Note to be updated
 */
export function updateWorkspaces(notesDB: NotesDB) {
	WORKSPACES.update((workspaces) => {
		const workspaceEntry = Array.from(workspaces.entries()).find(
			([key]) => key.id === notesDB.workspace
		);
		if (!workspaceEntry) return workspaces;
		const [_, notes] = workspaceEntry;
		// update the existing notes
		notes.map((note) => {
			if (note.id === notesDB.id) {
				note.name = notesDB.name;
				note.icon = notesDB.icon;
				note.favorite = notesDB.favorite;
				note.trashed = notesDB.trashed;
			}
			return note;
		});
		return workspaces;
	});
}

/**
 * Update the global variable FAVORITE_NOTES with the new note
 * @param note NotesDB - Note to be updated
 */
export function updateFavoriteNote(note: NotesDB) {
	FAVORITE_NOTES.update((notes) => {
		return notes.map((n) => (n.id === note.id ? note : n));
	});
}

/**
 * Add or remove the note from the global variable FAVORITE_NOTES
 * @param note NotesDB - Note to be added or removed
 */
export function addOrRemoveFromFavorite(note: NotesDB) {
	FAVORITE_NOTES.update((notes) => {
		if (note.favorite) {
			if (notes.find((n) => n.id === note.id)) return notes;
			return [...notes, note];
		} else {
			return notes.filter((n) => n.id !== note.id);
		}
	});
}
