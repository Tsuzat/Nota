import { Menu } from '@tauri-apps/api/menu';

export let APP_MENU: Menu;

async function initializeAppMenu() {
	APP_MENU = await Menu.default();
	APP_MENU.setAsAppMenu();
}

export default initializeAppMenu;
