import type { Workspace } from "@nota/client";
import type { LocalWorkSpace } from "./local/workspaces.svelte";
import { getContext, setContext } from "svelte";

class CurrentWorkspace {
  #currentWorkspace = $state<LocalWorkSpace | Workspace>();

  constructor(workspace?: LocalWorkSpace | Workspace) {
    this.#currentWorkspace = workspace;
  }

  public set(workspace?: LocalWorkSpace | Workspace) {
    this.#currentWorkspace = workspace;
  }

  public get() {
    return this.#currentWorkspace;
  }
}

const CURRENTWORKSPACEKEY = Symbol("CURRENTWORKSPACEKEY");

export const setCurrentWorkspace = (workspace?: LocalWorkSpace | Workspace) => {
  return setContext(CURRENTWORKSPACEKEY, new CurrentWorkspace(workspace));
};

export const getCurrentWorkspace = () => {
  return getContext<CurrentWorkspace>(CURRENTWORKSPACEKEY);
};
