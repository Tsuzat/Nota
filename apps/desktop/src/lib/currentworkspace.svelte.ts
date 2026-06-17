import { getNotesContext, type Workspace } from "@nota/client";
import { getContext, setContext } from "svelte";
import type { LocalWorkSpace } from "./local/workspaces.svelte";
import { getLocalNotes } from "./local/notes.svelte";
import { toast } from "@lib/components/ui/sonner";

class CurrentWorkspace {
  #currentWorkspace = $state<LocalWorkSpace | Workspace>();

  constructor(workspace?: LocalWorkSpace | Workspace) {
    this.#currentWorkspace = workspace;
  }

  public set(workspace?: LocalWorkSpace | Workspace) {
    this.#currentWorkspace = workspace;
    if (!workspace) return;
    const id = toast.loading(`Loading workspace ${workspace.name}...`);
    try {
      if ("owner" in workspace) {
        getNotesContext().fetchByWorkspace(workspace.id);
      } else {
        getLocalNotes().fetchNotesForWorkspace(workspace.id);
      }
    } catch (e) {
      toast.error(`Failed to load workspace ${workspace.name}.`, { id });
    } finally {
      toast.dismiss(id);
    }
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
