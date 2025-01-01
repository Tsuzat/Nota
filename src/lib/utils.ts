import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { initializeDatabase } from './database/sqldb';
import type { NotesDB } from './database/notes';
import { NOTES } from './contants';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export async function initializeApplication() {
	await initializeDatabase();
}

export function updateNOTES(notes: NotesDB) {
	NOTES.update((notes_) => {
		return notes_.map((note) => {
			if (note.id === notes.id) return notes;
			return note;
		});
	});
}

/**
 * Function which validates a URL if the URL is valid
 * @param url string - URL to validate
 * @returns boolean - true if URL is valid, false otherwise
 */
export function validateURL(url: string): boolean {
	const urlRegex = new RegExp(
		/^((http|https):\/\/)?(www\.)?([a-zA-Z0-9]+)\.([a-zA-Z]{2,})((\/[a-zA-Z0-9#]+\/?)+)?(\?[a-zA-Z0-9=&]+)?$/
	);
	return urlRegex.test(url);
}
