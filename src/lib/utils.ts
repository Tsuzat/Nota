import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { initializeDatabase } from './database/sqldb';
import type { NotesDB } from './database/notes';
import { NOTES, OS } from './contants';
import { open } from '@tauri-apps/plugin-shell';
import { invoke } from '@tauri-apps/api/core';
import Printd from 'printd';

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
	if (icon.trim() === '') throw new Error('Icon cannot be empty');
	if (validateURL(icon)) return 'url';
	else if (icon.endsWith('Icon')) return 'lucide';
	else return 'emoji';
}

/**
 * Function to open a path in the file system using rust invoke
 * @param path string - path to open
 * @param openFile boolean - true if the file should be opened, false otherwise
 * @returns void
 */
export async function openInFileSystem(path: string, openFile: boolean = false): Promise<void> {
	// check if the path is a file or a directory
	const isDirectory = await invoke('is_dir', { path });
	if (isDirectory || (!isDirectory && openFile)) {
		await open(path);
		return;
	}
	// get the folder path from the path (considering it's a file)
	const folderPath = path.substring(0, path.lastIndexOf(OS === 'windows' ? '\\' : '/'));
	await open(folderPath);
}

/**
 * Function to print a PDF from a HTML element
 * @param element HTMLElement - element to export as PDF
 */
export function printAsPDF(element: HTMLElement) {
	// Get the current page's styles (including TailwindCSS)
	const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
		.map((style) => style.outerHTML)
		.join('');

	const editor = `
	.tiptap pre code {
		--tw-text-opacity: 1;
		color: rgb(56 58 66 / var(--tw-text-opacity, 1));
	}
	`;
	const p = new Printd();
	p.print(element, [styles, editor]);
}
