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
	// try {
	// 	new URL(url);
	// 	return true;
	// } catch (error) {
	// 	return false;
	// }
	const urlPattern = new RegExp(
		'^(https?:\\/\\/)?' + // protocol (optional)
			'((([a-zA-Z\\d]([a-zA-Z\\d-]*[a-zA-Z\\d])*)\\.)+[a-zA-Z]{2,}|' + // domain name and extension
			'((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
			'(\\:\\d+)?(\\/[-a-zA-Z\\d%_.~+]*)*' + // port and path
			'(\\?[;&a-zA-Z\\d%_.~+=-]*)?' + // query string
			'(\\#[-a-zA-Z\\d_]*)?$', // fragment locator
		'i'
	);
	return urlPattern.test(url);
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
