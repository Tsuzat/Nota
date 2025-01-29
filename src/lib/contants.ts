import { writable } from 'svelte/store';
import type { WorkSpaceDB } from './database/workspace';
import type { NotesDB } from './database/notes';
import { platform } from '@tauri-apps/plugin-os';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';

/** Global Variables For showing new work space dialog */
export const OPEN_NEW_WORKSPACE_DIALOG = writable(false);

/** Global Variables For keep tack of workspaces and it's notes */
export const WORKSPACES = writable<WorkSpaceDB[]>([]);

/** Global variable for keep track of all notes */
export const NOTES = writable<NotesDB[]>([]);

/** Global variable for keep track of current os */
export const OS = platform();

/** Global Variable for Opening commandbar */
export const OPEN_COMMAND_BAR = writable(false);

/** Global Variable for controlling Application Window  */
export const APPWINDOW = getCurrentWindow();

/** Global Variable for toggling settings dialog */
export const SHOW_SETTINGS = writable(false);

/** Global Variable for check the current window is maximized or not */
export const IS_MAXIMUM = writable(false);

APPWINDOW.listen('tauri://resize', async () => {
	IS_MAXIMUM.set(await APPWINDOW.isMaximized());
});
