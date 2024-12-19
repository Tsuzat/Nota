import { page } from '$app/stores';
import { FAVORITE_NOTES, WORKSPACES } from '$lib/contants';
import { getFavoriteNotes, getNotesByWorkspace } from '$lib/database/notes';
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
			for (const workspace of workspaces) {
				const notes = await getNotesByWorkspace(workspace.id);
				WORKSPACES.update((workspaces) => {
					return workspaces.set(workspace, notes);
				});
			}
			// Load favorites
			const favNotes = await getFavoriteNotes();
			FAVORITE_NOTES.set(favNotes);
		})
		.catch((err) => {
			console.error(err);
			toast.error('Error on initializing the database');
			error(err.toString());
		});
})();
