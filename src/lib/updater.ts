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
	const id = toast.info(`Update ${update.version} is available. Downloading...`);
	let downloaded = 0;
	let contentLength = 0;
	await update.downloadAndInstall((event) => {
		switch (event.event) {
			case 'Started':
				contentLength = (event.data.contentLength ?? 0) / 1e6;
				toast.info(`Downloading update ${update.version}...`, {
					id,
					description: `Started downloading ${contentLength.toFixed(2)} MB`
				});
				break;
			case 'Progress':
				downloaded += event.data.chunkLength;
				toast.info(`Downloading update ${update.version}...`, {
					id,
					description: `Downloaded ${(downloaded / 1e6).toFixed(2)} / ${contentLength.toFixed(2)} MB`
				});
				break;
			case 'Finished':
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
