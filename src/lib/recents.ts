import { writable, type Writable } from 'svelte/store';
import type { NotesDB } from './database/notes';
import { NOTES } from './contants';

export const RECENT_NOTES: Writable<string[]> = writable();
export const RECENT_NOTES_SIZE = 10;

RECENT_NOTES.subscribe(async (notes) => {
	if (!notes) return;
	localStorage.setItem('recent-notes', JSON.stringify(notes));
});

/**
 * Function to load recent notes from local storage
 */
export function loadRecents() {
	try {
		const rawData = localStorage.getItem('recent-notes') || '[]';
		const notesIds: string[] = JSON.parse(rawData);
		RECENT_NOTES.set(notesIds);
	} catch (error) {
		console.error(error);
		RECENT_NOTES.set([]);
	}
}

export function addNoteToRecents(noteId: string) {
	RECENT_NOTES.update((notes) => {
		if (notes.find((n) => n === noteId)) return notes;
		if (notes.length >= RECENT_NOTES_SIZE) {
			notes.shift();
			return [...notes, noteId];
		}
		return [...notes, noteId];
	});
}

export function removeNoteFromRecents(noteId: string) {
	RECENT_NOTES.update((notes) => {
		return notes.filter((n) => n !== noteId);
	});
}

export function clearRecents() {
	RECENT_NOTES.set([]);
}

export function getRecentNotesSize() {
	let size = 0;
	RECENT_NOTES.update((notes) => {
		size = notes.length;
		return notes;
	});
	return size;
}
