export interface IconData {
	iconType: "emoji" | "lucide" | "url";
	iconData: string;
}

export const getIconData = (icon: string): IconData => {
	switch (icon.split(":")[0]) {
		case "emoji":
			return {
				iconType: "emoji",
				iconData: icon.split(":")[1],
			};
		case "lucide":
			return {
				iconType: "lucide",
				iconData: icon.split(":")[1],
			};
		case "url":
			return {
				iconType: "url",
				iconData: icon.replace("url:", ""),
			};
		default:
			return {
				iconType: "emoji",
				iconData: "😊",
			};
	}
};

import type { Emojis } from "./emoji-picker.svelte";

// Global cache for loaded Lucide components to prevent duplicate fetching
export const lucideComponentCache = new Map<string, any>();

// Global cache for the emojis JSON
let cachedEmojis: Emojis | null = null;
export async function getEmojis(): Promise<Emojis> {
	if (cachedEmojis) return cachedEmojis;
	const mod = await import("../../assets/emojis.json");
	cachedEmojis = mod.default as Emojis;
	return cachedEmojis;
}

// Global cache for the list of available Lucide icons
let cachedLucideIcons: string[] | null = null;
export async function getLucideIcons(): Promise<string[]> {
	if (cachedLucideIcons) return cachedLucideIcons;
	const mod = await import("./icon-imports.generated");
	cachedLucideIcons = Object.keys(mod.iconImports);
	return cachedLucideIcons;
}
