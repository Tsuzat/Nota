import { getContext, setContext } from 'svelte';

class Recents {
	#recents = $state(new Set<string>());

	constructor() {
		const raw = localStorage.getItem('recents');
		if (raw) {
			const r = JSON.parse(raw);
			if (Array.isArray(r)) {
				r.forEach((x) => this.#recents.add(x));
			}
		}
	}

	add(path: string) {
		this.#recents.add(path);
		localStorage.setItem('recents', JSON.stringify(Array.from(this.#recents)));
	}

	remove(path: string) {
		this.#recents.delete(path);
		localStorage.setItem('recents', JSON.stringify(Array.from(this.#recents)));
	}

	getRecents() {
		return this.#recents;
	}

	setRecents(recents: string[]) {
		this.#recents = new Set(recents);
		localStorage.setItem('recents', JSON.stringify(Array.from(this.#recents)));
	}

	clear() {
		this.#recents.clear();
	}
}

const RECENTSKEY = Symbol('RECENTSKEY');

export const setRecentsContext = () => {
	return setContext(RECENTSKEY, new Recents());
};

export const getRecentsContext = () => {
	return getContext<ReturnType<typeof setRecentsContext>>(RECENTSKEY);
};
