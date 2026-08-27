import { mode } from "@nota/ui";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { ISDESKTOP } from "./utils";

/**
 * Set the correct theme for the application window.
 * Call this once when the application starts, and call it again when the theme changes.
 */
export const setCorrectWindowMode = async () => {
	if (!ISDESKTOP) return;
	const window = getCurrentWindow();
	await window.setTheme(mode.current);
};
