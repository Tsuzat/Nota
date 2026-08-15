import { CloudWorkspaces } from "./cloud/workspace.svelte";
import { LocalWorkspaces } from "./local/workspace.svelte";
import type { Workspace } from "./types";
import { getContext, setContext } from "svelte";

class Workspaces {
  cloud = new CloudWorkspaces();
  local = new LocalWorkspaces();
  current = $state<Workspace | null>(null);

  all = $derived([...this.local.workspaces, ...this.cloud.workspaces]);

  async init() {
    await this.cloud.fetch();
    await this.local.fetch();
    this.current = this.local.workspaces[0] || this.cloud.workspaces[0];
  }
}

const WORKSPACE = Symbol("WORKSPACE");

/**
 * Sets the workspace context for the current component tree.
 * @returns The Workspaces instance.
 */
export const setWorkspaceContext = () => {
  return setContext(WORKSPACE, new Workspaces());
};

/**
 * Gets the workspace context from the current component tree.
 * @returns The Workspaces instance.
 */
export const getWorkspaceContext = () => {
  return getContext<ReturnType<typeof setWorkspaceContext>>(WORKSPACE);
};
