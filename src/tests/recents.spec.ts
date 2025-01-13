import type { NotesDB } from '$lib/database/notes';
import { describe, expect, test } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import {
	addNoteToRecents,
	clearRecents,
	getRecentNotesSize,
	RECENT_NOTES,
	removeNoteFromRecents
} from '$lib/recents';

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

	RECENT_NOTES.set(notes);

	test('Should add 10 notes to notes', () => {
		expect(notes.length).toBe(10);
	});

	test('Should add 10 notes to recents', () => {
		expect(getRecentNotesSize()).toBe(10);
	});

	test('Should add a note to recents with size to still be 10', () => {
		addNoteToRecents({
			id: uuidv4(),
			name: 'New Notes',
			icon: 'NewNoteIcon',
			favorite: false,
			path: '',
			trashed: false,
			workspace: uuidv4()
		});
		expect(getRecentNotesSize()).toBe(10);
	});

	test('Tring to add 5 new notes and size to be still be 10', () => {
		for (let i = 0; i < 5; i++) {
			addNoteToRecents({
				id: uuidv4(),
				name: `New Note ${i}`,
				icon: 'NewNoteIcon',
				favorite: false,
				path: '',
				trashed: false,
				workspace: uuidv4()
			});
		}
		expect(getRecentNotesSize()).toBe(10);
	});

	test('Trying to remove 1 notes from recents and the size to be 9', () => {
		let note: NotesDB | null = null;
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
		addNoteToRecents({
			id: '123456',
			name: `New Note`,
			icon: 'NewNoteIcon',
			favorite: false,
			path: '',
			trashed: false,
			workspace: uuidv4()
		});
		addNoteToRecents({
			id: '123456',
			name: `New Note`,
			icon: 'NewNoteIcon',
			favorite: false,
			path: '',
			trashed: false,
			workspace: uuidv4()
		});
		expect(getRecentNotesSize()).toBe(1);
	});
});
