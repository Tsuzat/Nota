import type { NotesDB } from './database/notes';

export default class Recents {
	private maxSize: number = 10;
	private notes: Set<NotesDB> = new Set();

	/**
	 * Get the notes in recents
	 */
	get getNotes() {
		return this.notes;
	}

	/**
	 * Set the notes in recents
	 * @param notes NotesDB[] - notes to set
	 */
	set setNotes(notes: NotesDB[]) {
		this.notes = new Set(notes);
	}

	/**
	 * Function to add a note to the recents
	 * @param note NotesDB - note to add
	 * @returns void
	 */
	add(note: NotesDB) {
		if (this.notes.size >= this.maxSize) {
			// remove the first element
			const notesArray = Array.from(this.notes);
			notesArray.shift();
			notesArray.push(note);
			this.notes = new Set(notesArray);
		} else {
			this.notes.add(note);
		}
	}

	/**
	 * Function to remove a note from the recents
	 * @param note NotesDB - note to be removed
	 */
	remove(note: NotesDB) {
		if (this.notes.has(note)) {
			this.notes.delete(note);
		}
	}

	/**
	 * Function to clear all the notes from recents
	 */
	clear() {
		this.notes = new Set();
	}
}
