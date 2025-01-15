import { writable, type Writable } from 'svelte/store';
import type { NotesDB } from './database/notes';
import { load } from '@tauri-apps/plugin-store';
import { NOTES } from './contants';

export const RECENT_NOTES: Writable<NotesDB[]> = writable();
export const RECENT_NOTES_SIZE = 10;

RECENT_NOTES.subscribe(async (notes) => {
	if (!notes) return;
	const notesIds = notes.map((n) => n.id);
	localStorage.setItem('recent-notes', JSON.stringify(notesIds));
});

/**
 * Function to load recent notes from local storage
 */
export function loadRecents() {
	try {
		const rawData = localStorage.getItem('recent-notes') || '[]';
		const notesIds: string[] = JSON.parse(rawData);
		let notesInDB: NotesDB[] = [];
		NOTES.update((notes) => {
			notesInDB = notes;
			return notes;
		});
		let recentNotes: NotesDB[] = [];
		for (let noteId of notesIds) {
			let note = notesInDB.find((n) => n.id === noteId);
			if (note) recentNotes.push(note);
		}
		RECENT_NOTES.set(recentNotes);
	} catch (error) {
		console.error(error);
		RECENT_NOTES.set([]);
	}
}

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
