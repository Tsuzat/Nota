import { getContext, setContext } from 'svelte';

class GlobalSettings {
	#open = $state(false);
	#useAI = $state(localStorage.getItem('useAI') ?? 'true');
	#useToolBar = $state(localStorage.getItem('useToolBar') === 'true');
	#useBubbleMenu = $state(localStorage.getItem('useBubbleMenu') ?? 'true');
	#useDragHandle = $state(localStorage.getItem('useDragHandle') ?? 'true');
	#themeColor = $state(localStorage.getItem('themeColor') || 'default');

	constructor(open: boolean = false) {
		this.#open = open;
	}
	get open() {
		return this.#open;
	}
	set open(value) {
		this.#open = value;
	}
	get useAI() {
		return this.#useAI;
	}
	set useAI(value) {
		this.#useAI = value;
		localStorage.setItem('useAI', value.toString());
	}
	get useToolBar() {
		return this.#useToolBar;
	}
	set useToolBar(value) {
		this.#useToolBar = value;
		localStorage.setItem('useToolBar', value.toString());
	}
	get useBubbleMenu() {
		return this.#useBubbleMenu;
	}
	set useBubbleMenu(value) {
		this.#useBubbleMenu = value;
		localStorage.setItem('useBubbleMenu', value.toString());
	}
	get useDragHandle() {
		return this.#useDragHandle;
	}
	set useDragHandle(value) {
		this.#useDragHandle = value;
		localStorage.setItem('useDragHandle', value.toString());
	}
	get themeColor() {
		return this.#themeColor;
	}
	set themeColor(value) {
		this.#themeColor = value;
		localStorage.setItem('themeColor', value);
	}
}

const GLOBALSETTINGSKEY = Symbol('GLOBALSETTINGSKEY');

export const setGlobalSettings = () => {
	return setContext(GLOBALSETTINGSKEY, new GlobalSettings());
};

export const getGlobalSettings = () => {
	return getContext<ReturnType<typeof setGlobalSettings>>(GLOBALSETTINGSKEY);
};
