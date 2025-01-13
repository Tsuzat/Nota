import type { NotesDB } from './database/notes';

export default class Recents {
	private maxSize: number = 10;
	private notes: NotesDB[] = [];

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
		// check the duplicates
		const uniqueNotes = notes.filter((note, index, self) => {
			return self.findIndex((n) => n.id === note.id) === index;
		});
		this.notes = uniqueNotes;
	}

	/**
	 * Function to add a note to the recents
	 * @param note NotesDB - note to add
	 * @returns void
	 */
	add(note: NotesDB) {
		if (this.notes.find((n) => n.id === note.id)) return;
		if (this.notes.length >= this.maxSize) {
			// remove the first element
			this.notes.shift();
			this.notes.push(note);
		} else {
			this.notes.push(note);
		}
	}

	/**
	 * Function to remove a note from the recents
	 * @param note NotesDB - note to be removed
	 */
	remove(note: NotesDB) {
		this.notes = this.notes.filter((n) => n.id !== note.id);
	}

	/**
	 * Function to clear all the notes from recents
	 */
	clear() {
		this.notes = [];
	}
}
