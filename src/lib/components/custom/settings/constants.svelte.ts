import { getContext, setContext } from 'svelte';

class GlobalSettings {
	#open = $state(false);
	#useAI = $state(localStorage.getItem('useAI') === 'true');

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
}

const GLOBALSETTINGSKEY = Symbol('GLOBALSETTINGSKEY');

export const setGlobalSettings = () => {
	return setContext(GLOBALSETTINGSKEY, new GlobalSettings());
};

export const getGlobalSettings = () => {
	return getContext<ReturnType<typeof setGlobalSettings>>(GLOBALSETTINGSKEY);
};
