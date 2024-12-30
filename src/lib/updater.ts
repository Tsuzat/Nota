import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { toast } from 'svelte-sonner';
import { message } from '@tauri-apps/plugin-dialog';
import { getVersion } from '@tauri-apps/api/app';

export async function checkUpdate() {
	const update = await check();
	if (update) {
		message(`found update ${update.version} from ${update.date} with notes ${update.body}`, {
			title: 'Update Available',
			kind: 'info'
		});
	} else {
		const currentVersion = await getVersion();
		message(
			`Could not find any new update for the application. Current Version: ${currentVersion}`,
			{
				title: 'No Update Available',
				kind: 'warning'
			}
		);
	}
}

export async function downloadAndInstall(update: Update) {
	console.log(`found update ${update.version} from ${update.date} with notes ${update.body}`);
	const id = toast.info(`Update ${update.version} is available. Downloading...`, {
		description: `Found update ${update.version} from ${update.date} with notes ${update.body}`
	});
	let downloaded = 0;
	let contentLength = 0;
	await update.downloadAndInstall((event) => {
		switch (event.event) {
			case 'Started':
				contentLength = (event.data.contentLength ?? 0) / 1e6;
				console.log(`started downloading ${event.data.contentLength} bytes`);
				toast.info(`Downloading update ${update.version}...`, {
					id,
					description: `Started downloading ${contentLength} MB`
				});
				break;
			case 'Progress':
				downloaded += event.data.chunkLength;
				console.log(`downloaded ${downloaded} from ${contentLength}`);
				toast.info(`Downloading update ${update.version}...`, {
					id,
					description: `Downloaded ${downloaded / 1e6} / ${contentLength} MB`
				});
				break;
			case 'Finished':
				console.log('download finished');
				toast.success(`Update ${update.version} downloaded. Installing...`, {
					id,
					description: 'Download finished'
				});
				break;
		}
	});
	toast.success(`Update ${update.version} installed. Relaunching...`, {
		id,
		description: 'Update installed'
	});
	await relaunch();
}
