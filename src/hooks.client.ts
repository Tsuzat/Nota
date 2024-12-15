import { page } from '$app/stores';
import { initializeDatabase } from '$lib/database/sqldb';
import { getCurrentWindow } from '@tauri-apps/api/window';

(async () => {
	// Initialize the database
	initializeDatabase();

	// Show URL on appwindow title
	page.subscribe((page) => {
		if (!page.url || !page.url.pathname) return;
		const window = getCurrentWindow();
		window.setTitle(`Nota - ${page.url.pathname}`);
	});
})();
