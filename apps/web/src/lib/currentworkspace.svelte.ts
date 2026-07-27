import type { Workspace } from '@nota/client';
import { getContext, setContext } from 'svelte';

class CurrentWorkspace {
  #currentWorkspace = $state<Workspace | null>(null);

  constructor(workspace?: Workspace | null) {
    this.#currentWorkspace = workspace ?? null;
  }

  public set(workspace?: Workspace | null) {
    this.#currentWorkspace = workspace ?? null;
  }

  public get() {
    return this.#currentWorkspace;
  }
}

const CURRENTWORKSPACEKEY = Symbol('CURRENTWORKSPACEKEY');

export const setCurrentWorkspace = (workspace?: Workspace | null) => {
  return setContext(CURRENTWORKSPACEKEY, new CurrentWorkspace(workspace));
};

export const getCurrentWorkspace = () => {
  return getContext<CurrentWorkspace>(CURRENTWORKSPACEKEY);
};
