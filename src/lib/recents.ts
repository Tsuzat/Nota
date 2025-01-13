import { writable, type Writable } from 'svelte/store';
import type { NotesDB } from './database/notes';

export const RECENT_NOTES: Writable<NotesDB[]> = writable([]);
export const RECENT_NOTES_SIZE = 10;

export function addNoteToRecents(note: NotesDB) {
	RECENT_NOTES.update((notes) => {
		if (notes.find((n) => n.id === note.id)) return notes;
		if (notes.length >= RECENT_NOTES_SIZE) {
			notes.shift();
			return [...notes, note];
		}
		return [...notes, note];
	});
}

export function removeNoteFromRecents(note: NotesDB) {
	RECENT_NOTES.update((notes) => {
		return notes.filter((n) => n.id !== note.id);
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
