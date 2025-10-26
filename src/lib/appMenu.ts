import { Menu, MenuItem, Submenu } from '@tauri-apps/api/menu';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';

export let APPMENU: Menu;

export async function setAppMenu() {
	APPMENU = await Menu.default();
	const firstItem = (await APPMENU.items())[0] as Submenu;
	const settingsMenuItem = await MenuItem.new({
		id: 'settings',
		text: 'Settings...',
		accelerator: 'CommandOrControl+,',
		action: openSettings
	});
	await firstItem.insert(settingsMenuItem, 1);
	await APPMENU.setAsAppMenu();
}

async function openSettings() {
	const settingsPage = new WebviewWindow('settings', {
		url: 'settings',
		width: 800,
		height: 600,
		minHeight: 400,
		minWidth: 500,
		zoomHotkeysEnabled: true,
		hiddenTitle: true,
		decorations: true,
		titleBarStyle: 'overlay'
	});
	await settingsPage.show();
	await settingsPage.setFocus();
}
