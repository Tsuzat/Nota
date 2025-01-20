import type { NotesDB } from '$lib/database/notes';
import { describe, expect, test, vi } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import { addNoteToRecents, clearRecents, RECENT_NOTES, removeNoteFromRecents } from '$lib/recents';

// Mock platform detection
vi.mock('@tauri-apps/plugin-os', () => ({
	platform: () => 'windows'
}));

vi.mock('@tauri-apps/api/window', () => ({
	getCurrentWindow: () => ({
		label: 'main',
		isVisible: () => true,
		show: () => Promise.resolve(),
		hide: () => Promise.resolve()
	})
}));

function getRecentNotesSize() {
	let size = 0;
	RECENT_NOTES.update((notes) => {
		size = notes.length;
		return notes;
	});
	return size;
}

describe('Unit tests for recents', () => {
	const notes: NotesDB[] = [];

	// Push 10 notes to the notes array
	for (let i = 0; i < 10; i++) {
		notes.push({
			id: uuidv4(),
			name: `Note ${i}`,
			icon: 'FolderIcon',
			favorite: false,
			path: '',
			trashed: false,
			workspace: uuidv4()
		});
	}

	RECENT_NOTES.set(notes.map((n) => n.id));

	test('Should add 10 notes to notes', () => {
		expect(notes.length).toBe(10);
	});

	test('Should add 10 notes to recents', () => {
		expect(getRecentNotesSize()).toBe(10);
	});

	test('Should add a note to recents with size to still be 10', () => {
		addNoteToRecents(uuidv4());
		expect(getRecentNotesSize()).toBe(10);
	});

	test('Tring to add 5 new notes and size to be still be 10', () => {
		for (let i = 0; i < 5; i++) {
			addNoteToRecents(uuidv4());
		}
		expect(getRecentNotesSize()).toBe(10);
	});

	test('Trying to remove 1 notes from recents and the size to be 9', () => {
		let note: string | null = null;
		RECENT_NOTES.update((notes) => {
			note = notes[0];
			return notes;
		});
		if (note !== null) removeNoteFromRecents(note);
		expect(getRecentNotesSize()).toBe(9);
	});

	test('Try to clear all the recents and size to be 0', () => {
		clearRecents();
		expect(getRecentNotesSize()).toBe(0);
	});

	test('Try to add duplicate note', () => {
		addNoteToRecents('123456');
		addNoteToRecents('123456');
		expect(getRecentNotesSize()).toBe(1);
	});
});
