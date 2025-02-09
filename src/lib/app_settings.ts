import { writable, type Writable } from 'svelte/store';
import { APPWINDOW, OS } from './contants';
import { browser } from '$app/environment';

/**
 * Global Variable for keeping track of the user name
 */
export const USER_NAME: Writable<string> = writable(
	localStorage.getItem('user_name') || 'Unknown User'
);
USER_NAME.subscribe(async (value) => {
	if (browser) {
		localStorage.setItem('user_name', value);
	}
});

/**
 * Global Variable for keeping track of the sidebar open state
 */
export const SIDEBAR_OPEN: Writable<boolean> = writable(
	(localStorage.getItem('sidebar_open') ?? 'true') === 'true'
);
SIDEBAR_OPEN.subscribe(async (value) => {
	if (browser) {
		localStorage.setItem('sidebar_open', value ? 'true' : 'false');
	}
});

/**
 * Global Variable for toggling window decoration
 * @Platform specific - Supports `Windows` only
 * */
export const SHOW_DECORATION: Writable<boolean> = writable(
	(localStorage.getItem('show_decorations') ?? 'true') === 'true'
);
SHOW_DECORATION.subscribe(async (value) => {
	if (OS !== 'windows') return;
	await APPWINDOW.setDecorations(value);
	if (browser) {
		localStorage.setItem('show_decorations', value ? 'true' : 'false');
	}
});

/** Global Variable for controlling check update on start */
export const CHECK_UPDATE_ON_START: Writable<boolean> = writable(
	(localStorage.getItem('check_update_on_start') ?? 'true') === 'true'
);
CHECK_UPDATE_ON_START.subscribe(async (value) => {
	if (browser) {
		localStorage.setItem('check_update_on_start', value ? 'true' : 'false');
	}
});
