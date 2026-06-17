import { getContext, setContext } from "svelte";
import { PUBLIC_BACKEND_URL } from "$env/static/public";
import request from "./request";
import { type Workspace, WorkspaceSchema } from "./types";

class Workspaces {
  #workspaces = $state<Workspace[]>([]);

  get workspaces() {
    return this.#workspaces;
  }

  set workspaces(workspaces: Workspace[]) {
    this.#workspaces = workspaces;
  }

  /**
   * Fetch all workspaces from the backend
   * @throws {Error} If the request fails with a non-200 status code
   */
  async fetch() {
    const url = `${PUBLIC_BACKEND_URL}/api/v1/db/workspace`;
    const res = await request(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (res.ok) {
      const json = await res.json();
      const workspaces = json.data as Workspace[];
      const parsedWorkspaces = workspaces.map((workspace) =>
        WorkspaceSchema.parse(workspace),
      );
      console.log(parsedWorkspaces);
      this.workspaces = parsedWorkspaces;
    } else {
      throw new Error(await res.text());
    }
  }

  /**
   * Create a new workspace
   * @param name Workspace name
   * @param icon Workspace icon
   * @throws {Error} If the request fails with a non-200 status code
   */
  async create(name: string, icon: string) {
    const url = `${PUBLIC_BACKEND_URL}/api/v1/db/workspace`;
    const res = await request(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        icon,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      const createdWorkspace = json.data as Workspace;
      const parsedWorkspace = WorkspaceSchema.parse(createdWorkspace);
      this.workspaces.push(parsedWorkspace);
    } else {
      throw new Error(await res.text());
    }
  }

  /**
   * Update a workspace
   * @param workspaceId Workspace ID
   * @param name Workspace name
   * @param icon Workspace icon
   * @throws {Error} If the request fails with a non-200 status code
   */
  async update(workspaceId: string, name: string, icon: string) {
    const url = `${PUBLIC_BACKEND_URL}/api/v1/db/workspace/${workspaceId}`;
    const res = await request(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        icon,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      const updatedWorkspace = json.data as Workspace;
      const parsedWorkspace = WorkspaceSchema.parse(updatedWorkspace);
      this.workspaces = this.workspaces.map((workspace) =>
        workspace.id === workspaceId ? parsedWorkspace : workspace,
      );
    } else {
      throw new Error(await res.text());
    }
  }

  /**
   * Delete a workspace
   * @param workspaceId Workspace ID
   * @throws {Error} If the request fails with a non-200 status code
   */
  async delete(workspaceId: string) {
    const url = `${PUBLIC_BACKEND_URL}/api/v1/db/workspace/${workspaceId}`;
    const res = await request(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (res.ok) {
      this.workspaces = this.workspaces.filter(
        (workspace) => workspace.id !== workspaceId,
      );
    } else {
      throw new Error(await res.text());
    }
  }
}

const NOTAWORKSPACESKEY = Symbol("NOTAWORKSPACESKEY");

/**
 * Set the workspaces context.
 */
export const setWorkspacesContext = () => {
  return setContext(NOTAWORKSPACESKEY, new Workspaces());
};

/**
 * Get the workspaces context.
 */
export function getWorkspacesContext() {
  return getContext<ReturnType<typeof setWorkspacesContext>>(NOTAWORKSPACESKEY);
}
