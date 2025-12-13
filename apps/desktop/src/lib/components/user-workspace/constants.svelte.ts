import { getContext, setContext } from 'svelte';

class NewUserWorkspace {
  #open = $state(false);

  constructor(open = false) {
    this.#open = open;
  }

  get open() {
    return this.#open;
  }

  set open(value) {
    this.#open = value;
  }
}

const NEWUSERWORKSPACEKEY = Symbol('NEWUSERWORKSPACEKEY');

export const setNewUserWorkspace = () => {
  return setContext(NEWUSERWORKSPACEKEY, new NewUserWorkspace());
};

export const getNewUserWorkspace = () => {
  return getContext<ReturnType<typeof setNewUserWorkspace>>(NEWUSERWORKSPACEKEY);
};
