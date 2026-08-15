import { type } from "@tauri-apps/plugin-os";

export const ISDESKTOP =
	typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
export const ISMACOS = () => {
	if (ISDESKTOP) {
		return type() === "macos";
	}
	return (
		navigator.userAgent.includes("Macintosh") ||
		navigator.userAgent.includes("Mac OS X")
	);
};
export const ISWINDOWS = () => {
	if (ISDESKTOP) {
		return type() === "windows";
	}
	return (
		navigator.userAgent.includes("Windows") ||
		navigator.userAgent.includes("Win32")
	);
};

export const getKeyboardShortcut = (
	key: string,
	ctrl = false,
	shift = false,
	alt = false,
) => {
	const modifiers: string[] = [];
	if (ISMACOS()) {
		if (ctrl) modifiers.push("⌘");
		if (shift) modifiers.push("⇧");
		if (alt) modifiers.push("⌥");
	} else {
		if (ctrl) modifiers.push("Ctrl");
		if (shift) modifiers.push("Shift");
		if (alt) modifiers.push("Alt");
	}

	return [...modifiers, key].join(" ");
};
