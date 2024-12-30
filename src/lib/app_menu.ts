import { Menu } from '@tauri-apps/api/menu';

async function initializeAppMenu() {
	let menu = await Menu.default();
	menu.setAsAppMenu();
}

export default initializeAppMenu;
