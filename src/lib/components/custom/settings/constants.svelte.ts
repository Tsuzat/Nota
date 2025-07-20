import { getContext, setContext } from 'svelte';

class GlobalSettings {
	#open = $state(false);

	constructor(open: boolean = false) {
		this.#open = open;
	}

	get open() {
		return this.#open;
	}

	set open(value) {
		this.#open = value;
	}
}

const GLOBALSETTINGSKEY = Symbol('GLOBALSETTINGSKEY');

export const setGlobalSettings = () => {
	return setContext(GLOBALSETTINGSKEY, new GlobalSettings());
};

export const getGlobalSettings = () => {
	return getContext<ReturnType<typeof setGlobalSettings>>(GLOBALSETTINGSKEY);
};
