import { getContext, setContext } from 'svelte';

class GlobalSearch {
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

const GLOBALSEARCHKEY = Symbol('GLOBALSEARCHKEY');

export const setGlobalSearch = () => {
	return setContext(GLOBALSEARCHKEY, new GlobalSearch());
};

export const getGlobalSearch = () => {
	return getContext<ReturnType<typeof setGlobalSearch>>(GLOBALSEARCHKEY);
};
