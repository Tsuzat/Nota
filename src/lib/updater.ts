import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { toast } from 'svelte-sonner';
import { message } from '@tauri-apps/plugin-dialog';

export async function checkUpdate() {
	const update = await check();
	if (update) {
		message(`found update ${update.version} from ${update.date} with notes ${update.body}`, {
			title: 'Update Available',
			kind: 'info'
		});
	} else {
		message('Could not find any new update for the application', {
			title: 'No Update Available',
			kind: 'warning'
		});
	}
}

export async function downloadAndInstall(update: Update) {
	console.log(`found update ${update.version} from ${update.date} with notes ${update.body}`);
	const id = toast.info(`Update ${update.version} is available. Downloading...`, {
		description: `Found update ${update.version} from ${update.date} with notes ${update.body}`
	});
	let downloaded = 0;
	let contentLength = 0;
	// alternatively we could also call update.download() and update.install() separately
	await update.downloadAndInstall((event) => {
		switch (event.event) {
			case 'Started':
				contentLength = event.data.contentLength ?? 0;
				console.log(`started downloading ${event.data.contentLength} bytes`);
				toast.info(`Downloading update ${update.version}...`, {
					id,
					description: `Started downloading ${event.data.contentLength} bytes`
				});
				break;
			case 'Progress':
				downloaded += event.data.chunkLength;
				console.log(`downloaded ${downloaded} from ${contentLength}`);
				toast.info(`Downloading update ${update.version}...`, {
					id,
					description: `Downloaded ${downloaded} / ${contentLength} bytes`
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

	console.log('update installed');
	toast.success(`Update ${update.version} installed. Relaunching...`, {
		id,
		description: 'Update installed'
	});
	await relaunch();
}
