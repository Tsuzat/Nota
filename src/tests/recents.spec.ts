import type { NotesDB } from '$lib/database/notes';
import Recents from '$lib/recents.js';
import { describe, expect, test } from 'vitest';
import { v4 as uuidv4 } from 'uuid';

describe('Unit tests for recents', () => {
	const notes: NotesDB[] = [];
	const recents = new Recents();

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

	recents.setNotes = notes;

	test('Should add 10 notes to notes', () => {
		expect(notes.length).toBe(10);
	});

	test('Should add 10 notes to recents', () => {
		expect(recents.getNotes.size).toBe(10);
	});

	test('Should add a note to recents with size to still be 10', () => {
		recents.add({
			id: uuidv4(),
			name: 'New Notes',
			icon: 'NewNoteIcon',
			favorite: false,
			path: '',
			trashed: false,
			workspace: uuidv4()
		});
		expect(recents.getNotes.size).toBe(10);
	});

	test('Tring to add 5 new notes and size to be still be 10', () => {
		for (let i = 0; i < 5; i++) {
			recents.add({
				id: uuidv4(),
				name: `New Note ${i}`,
				icon: 'NewNoteIcon',
				favorite: false,
				path: '',
				trashed: false,
				workspace: uuidv4()
			});
		}
		expect(recents.getNotes.size).toBe(10);
	});

	test('Trying to remove 1 notes from recents and the size to be 9', () => {
		const note = Array.from(recents.getNotes)[0];
		recents.remove(note);
		expect(recents.getNotes.size).toBe(9);
	});

	test('Try to clear all the recents and size to be 0', () => {
		recents.clear();
		expect(recents.getNotes.size).toBe(0);
	});
});
