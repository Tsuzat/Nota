import { error } from '@tauri-apps/plugin-log';
import { load, type Store } from '@tauri-apps/plugin-store';
import { toast } from 'svelte-sonner';
import { writable } from 'svelte/store';
import { APPWINDOW, OS } from './contants';

let APP_SETTINGS: Store;

export async function loadAppSettings() {
	try {
		APP_SETTINGS = await load('app_settings.json', { autoSave: true });
	} catch (e: any) {
		console.error(e);
		error(e.toString());
		toast.error('Error loading app settings. Populating with defaults.');
	}
}

export const USER_NAME = writable('Unknown User');
export const USER_ICON = writable('emoji:🙍');
export const SIDEBAR_OPEN = writable(true);
