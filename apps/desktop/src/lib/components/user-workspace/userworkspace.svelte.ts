import type { UserWorkspace } from '@nota/client';
import { getContext, setContext } from 'svelte';
import type { LocalUserWorkspace } from '$lib/local/userworkspaces.svelte';

class CurrentUserWorkspace {
  #userworkspace: LocalUserWorkspace | UserWorkspace | null = $state(null);
  #isLocal: boolean = $state(true);

  setCurrentUserWorkspace(userworkspace: LocalUserWorkspace | UserWorkspace | null) {
    this.#userworkspace = userworkspace;
    this.#isLocal = userworkspace === null ? true : !('owner' in userworkspace);
  }

  getCurrentUserWorkspace() {
    return this.#userworkspace;
  }

  getIsLocal() {
    return this.#isLocal;
  }
}

const GLOBALCURRENTUSERWORKSPACEKEY = Symbol('GLOBALCURRENTUSERWORKSPACEKEY');

export const setCurrentUserWorkspaceContext = () => {
  return setContext(GLOBALCURRENTUSERWORKSPACEKEY, new CurrentUserWorkspace());
};

export const useCurrentUserWorkspaceContext = () => {
  return getContext<ReturnType<typeof setCurrentUserWorkspaceContext>>(GLOBALCURRENTUSERWORKSPACEKEY);
};
