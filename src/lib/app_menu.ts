import { Menu, MenuItem, Submenu } from '@tauri-apps/api/menu';
import { checkUpdate } from './updater';
import { message } from '@tauri-apps/plugin-dialog';
import { getVersion } from '@tauri-apps/api/app';

export let APP_MENU: Menu;

async function loadHelpMenu(): Promise<Submenu> {
	let checkUpdateMenuItem = await MenuItem.new({
		text: 'Check for Updates',
		action: () => {
			checkUpdate();
		}
	});

	let aboutAppMenuItem = await MenuItem.new({
		text: 'About Nota',
		action: async () => {
			message(
				`Name: Nota\nVersion: ${await getVersion()}\nAuthor: Alok "Tsuzat" Singh\nWebsite: https://github.com/Tsuzat/Nota`,
				{
					title: 'About Nota',
					kind: 'info'
				}
			);
		}
	});

	let items: MenuItem[] = [checkUpdateMenuItem, aboutAppMenuItem];

	return await Submenu.new({ text: 'Help', items });
}

async function initializeAppMenu() {
	const menu = await Menu.default();
	const menuItems = await menu.items();
	menuItems.pop();
	menuItems.push(await loadHelpMenu());
	APP_MENU = await Menu.new({ items: menuItems });
	await APP_MENU.setAsAppMenu();
}

export default initializeAppMenu;
