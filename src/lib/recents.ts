import { writable, type Writable } from 'svelte/store';

export const RECENT_NOTES: Writable<string[]> = writable();
export const RECENT_NOTES_SIZE = 10;

RECENT_NOTES.subscribe(async (notes) => {
	if (!notes) return;
	localStorage.setItem('recent-notes', JSON.stringify(notes));
});

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
