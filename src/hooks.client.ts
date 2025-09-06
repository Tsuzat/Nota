import { initializeLocalDB } from '$lib/local/db';
import { ISTAURI, ISWINDOWS } from '$lib/utils';
import { getCurrentWindow } from '@tauri-apps/api/window';

const init = async () => {
	if (ISTAURI) {
		await initializeLocalDB();
		if (ISWINDOWS) {
			const window = getCurrentWindow();
			await window.setDecorations(false);
		}
	}
};

init();
