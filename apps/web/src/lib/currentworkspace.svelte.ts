import type { Workspace } from '@nota/client';
import { getContext, setContext } from 'svelte';

class CurrentWorkspace {
  #value = $state<Workspace | undefined>(undefined);

  constructor(value?: Workspace) {
    this.#value = value;
  }

  set value(workspace: Workspace | undefined) {
    this.#value = workspace;
  }

  get value(): Workspace | undefined {
    return this.#value;
  }
}

const CURRENTWORKSPACEKEY = Symbol('CURRENTWORKSPACEKEY');

export const setCurrentWorkspaceContext = (value?: Workspace) => {
  return setContext(CURRENTWORKSPACEKEY, new CurrentWorkspace(value));
};

export const getCurrentWorkspaceContext = () => {
  return getContext<CurrentWorkspace>(CURRENTWORKSPACEKEY);
};
