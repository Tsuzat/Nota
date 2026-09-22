import { getContext, setContext } from "svelte";

function getLocalStorageValue(key: string, defaultValue: boolean): boolean {
	const data = localStorage.getItem(key);
	if (!data) {
		localStorage.setItem(key, String(defaultValue));
		return defaultValue;
	}
	return data === "true";
}

class GlobalSettings {
	#open = $state(false);
	#useAI = $state(getLocalStorageValue("useAI", true));
	#useToolBar = $state(getLocalStorageValue("useToolBar", false));
	#useBubbleMenu = $state(getLocalStorageValue("useBubbleMenu", true));
	#useDragHandle = $state(getLocalStorageValue("useDragHandle", true));
	#themeColor = $state(localStorage.getItem("themeColor") || "default");
	#aiProvider = $state(localStorage.getItem("ai_provider") || "gpt-5.6-luna");
	#useOwnKeys = $state(getLocalStorageValue("useOwnKeys", false));
	#aiMode = $state<"nota" | "apple" | "byok">(
		(localStorage.getItem("ai_mode") as "nota" | "apple" | "byok") ||
			(getLocalStorageValue("useOwnKeys", false) ? "byok" : "nota"),
	);

	constructor(open = false) {
		this.#open = open;
	}
	get open() {
		return this.#open;
	}
	set open(value) {
		this.#open = value;
	}
	get aiMode(): "nota" | "apple" | "byok" {
		return this.#aiMode;
	}
	set aiMode(value: "nota" | "apple" | "byok") {
		this.#aiMode = value;
		localStorage.setItem("ai_mode", value);
		this.#useOwnKeys = value === "byok";
		localStorage.setItem("useOwnKeys", String(value === "byok"));
	}
	get useAI() {
		return this.#useAI;
	}
	set useAI(value) {
		this.#useAI = value;
		localStorage.setItem("useAI", String(value));
	}
	get useOwnKeys() {
		return this.#useOwnKeys;
	}
	set useOwnKeys(value) {
		this.#useOwnKeys = value;
		localStorage.setItem("useOwnKeys", String(value));
		if (value && this.#aiMode !== "byok") {
			this.#aiMode = "byok";
			localStorage.setItem("ai_mode", "byok");
		} else if (!value && this.#aiMode === "byok") {
			this.#aiMode = "nota";
			localStorage.setItem("ai_mode", "nota");
		}
	}
	get useToolBar() {
		return this.#useToolBar;
	}
	set useToolBar(value) {
		this.#useToolBar = value;
		localStorage.setItem("useToolBar", String(value));
	}
	get useBubbleMenu() {
		return this.#useBubbleMenu;
	}
	set useBubbleMenu(value) {
		this.#useBubbleMenu = value;
		localStorage.setItem("useBubbleMenu", String(value));
	}
	get useDragHandle() {
		return this.#useDragHandle;
	}
	set useDragHandle(value) {
		this.#useDragHandle = value;
		localStorage.setItem("useDragHandle", String(value));
	}
	get themeColor() {
		return this.#themeColor;
	}
	set themeColor(value) {
		this.#themeColor = value;
		localStorage.setItem("themeColor", value);
	}
	get aiProvider() {
		return this.#aiProvider;
	}
	set aiProvider(value) {
		this.#aiProvider = value;
		localStorage.setItem("ai_provider", value);
	}
}

const GLOBALSETTINGSKEY = Symbol("GLOBALSETTINGSKEY");

export const setGlobalSettings = () => {
	return setContext(GLOBALSETTINGSKEY, new GlobalSettings());
};

export const getGlobalSettings = () => {
	return getContext<ReturnType<typeof setGlobalSettings>>(GLOBALSETTINGSKEY);
};
