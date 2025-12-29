import { getContext, setContext } from 'svelte';
import { PUBLIC_BACKEND_URL } from '$env/static/public';

import request from './request';

import type { Workspace } from './types';

import { WorkspaceSchema } from './types';

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
   * @param userworkspaceId UserWorkspace ID
   * @throws {Error} If the request fails with a non-200 status code
   */
  async fetch(userworkspaceId: string) {
    const url = `${PUBLIC_BACKEND_URL}/api/db/workspaces?userworkspace_id=${userworkspaceId}`;
    const res = await request(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (res.ok) {
      const workspaces = (await res.json()) as Workspace[];
      const parsedWorkspaces = workspaces.map((workspace) => WorkspaceSchema.parse(workspace));
      this.workspaces = parsedWorkspaces;
    } else {
      throw new Error(await res.text());
    }
  }

  /**
   * Create a new workspace
   * @param workspace Partial workspace object
   * @throws {Error} If the request fails with a non-200 status code
   */
  async create(icon: string, name: string, userworkspaceId: string, description?: string) {
    const url = `${PUBLIC_BACKEND_URL}/api/db/workspaces`;
    const res = await request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        icon,
        name,
        userworkspaceId,
        description,
      }),
    });
    if (res.ok) {
      const createdWorkspace = (await res.json()) as Workspace;
      const parsedWorkspace = WorkspaceSchema.parse(createdWorkspace);
      this.workspaces.push(parsedWorkspace);
    } else {
      throw new Error(await res.text());
    }
  }

  /**
   * Delete a workspace by ID
   * @param workspaceId Workspace ID
   * @throws {Error} If the request fails with a non-200 status code
   */
  async delete(workspaceId: string) {
    const url = `${PUBLIC_BACKEND_URL}/api/db/workspaces/${workspaceId}`;
    const res = await request(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (res.ok) {
      this.workspaces = this.workspaces.filter((workspace) => workspace.id !== workspaceId);
    } else {
      throw new Error(await res.text());
    }
  }

  /**
   * Update a workspace by ID
   * @param icon The new icon of the workspace
   * @param name The new name of the workspace
   * @param id The ID of the workspace to update
   * @throws {Error} If the request fails with a non-200 status code
   */
  async update(icon: string, name: string, id: string, description?: string) {
    const url = `${PUBLIC_BACKEND_URL}/api/db/workspaces/${id}`;
    const res = await request(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        icon,
        name,
        description,
      }),
    });
    if (res.ok) {
      const updatedWorkspace = (await res.json()) as Workspace;
      const parsedWorkspace = WorkspaceSchema.parse(updatedWorkspace);
      this.workspaces = this.workspaces.map((workspace) => (workspace.id === id ? parsedWorkspace : workspace));
    } else {
      throw new Error(await res.text());
    }
  }
}

const NOTAWORKSPACEKEY = Symbol('NOTAWORKSPACEKEY');

/**
 * Set the workspaces context.
 */
export const setWorkspacesContext = () => {
  setContext(NOTAWORKSPACEKEY, new Workspaces());
};

/**
 * Get the workspaces context.
 */
export function getWorkspacesContext() {
  return getContext<ReturnType<typeof setWorkspacesContext>>(NOTAWORKSPACEKEY);
}
