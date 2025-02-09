import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { toast } from 'svelte-sonner';
import { getVersion } from '@tauri-apps/api/app';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';

/**
 * Function to check for updates
 * @param isAuto boolean - weather the check is triggered by app or user, if true then it's triggered by app
 */
export async function checkUpdate(isAuto: boolean = false) {
	let id: number | string | undefined = undefined;
	if (!isAuto) {
		id = toast.loading('Checking for updates...');
	}
	const update = await check();
	if (update !== null) {
		toast.info(`New version ${update.version} is available.`, {
			id,
			action: {
				label: 'Update',
				onClick: () => {
					downloadAndInstall(update);
				}
			}
		});
	} else {
		if (isAuto) return;
		toast.success('No updates available', {
			id,
			description: `You are using the latest version ${await getVersion()}`,
			cancel: {
				label: 'Ok'
			}
		});
	}
}

export async function downloadAndInstall(update: Update) {
	const id = toast.info(`Update ${update.version} is available. Downloading...`);
	let downloaded = 0;
	let contentLength = 0;
	let appWindow = getCurrentWebviewWindow();
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
