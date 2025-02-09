import { goto } from '$app/navigation';
import initializeAppMenu from '$lib/app_menu';
import { NOTES, WORKSPACES } from '$lib/contants';
import { getAllNotes } from '$lib/database/notes';
import { initializeDatabase } from '$lib/database/sqldb';
import { getWorkSpaces } from '$lib/database/workspace';
import { error } from '@tauri-apps/plugin-log';
import { toast } from 'svelte-sonner';

(async () => {
	// Initialize the database
	initializeDatabase()
		.then(async () => {
			// Load Workspaces
			const workspaces = await getWorkSpaces();
			WORKSPACES.set(workspaces);

			const notes = await getAllNotes();
			NOTES.set(notes);
			const lastActiveNoteId = localStorage.getItem('lastActiveNote');
			if (lastActiveNoteId) {
				const note = notes.find((n) => n.id === lastActiveNoteId);
				if (note) {
					goto(`/${note.id}`);
				}
			}
		})
		.catch((err) => {
			console.error(err);
			toast.error('Error on initializing the database');
			error(err.toString());
		});
	await initializeAppMenu();
})();
