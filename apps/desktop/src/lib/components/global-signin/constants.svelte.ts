import { getContext, setContext } from 'svelte';

class GlobalSignIn {
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

const GLOBALSIGNINKEY = Symbol('GLOBALSIGNINKEY');

export const setGlobalSignInContext = () => {
  return setContext(GLOBALSIGNINKEY, new GlobalSignIn());
};

export const getGlobalSignInContext = () => {
  return getContext<ReturnType<typeof setGlobalSignInContext>>(GLOBALSIGNINKEY);
};
