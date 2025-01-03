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
	try {
		new URL(url);
		return true;
	} catch (error) {
		return false;
	}
}

/**
 * Function which return the icon type based on the icon name
 * @param email string - icon to validate
 * @returns iconType - `emoji` | `lucide` | `url`
 */
export function getIconType(icon: string): 'emoji' | 'lucide' | 'url' {
	if (validateURL(icon)) return 'url';
	else if (icon.endsWith('Icon')) return 'lucide';
	else return 'emoji';
}
