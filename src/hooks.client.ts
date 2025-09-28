import { initializeLocalDB } from '$lib/local/db';
import { ISTAURI, ISWINDOWS } from '$lib/utils';
import { getCurrentWindow } from '@tauri-apps/api/window';

const init = async () => {
	if (ISTAURI) {
		const window = getCurrentWindow();
		if (ISWINDOWS) {
			await window.setDecorations(false);
		}

		await initializeLocalDB();
	}
};

init();
