import { getContext, setContext } from 'svelte';
import { PUBLIC_BACKEND_URL } from '$env/static/public';
import request from './request';
import { type UserWorkspace, type UserWorkspaceData, UserWorkspaceDataSchema, UserWorkspaceSchema } from './types';

class UserWorkspaces {
  #userWorkspaces = $state<UserWorkspace[]>([]);
  get userWorkspaces() {
    return this.#userWorkspaces;
  }
  set userWorkspaces(userWorkspaces: UserWorkspace[]) {
    this.#userWorkspaces = userWorkspaces;
  }

  /**
   * Create a new userworkspace with the given icon, name, and owner
   * @param icon The icon of the userworkspace
   * @param name The name of the userworkspace
   * @throws {Error} If the request fails with a non-200 status code
   */
  async create(icon: string, name: string) {
    const url = `${PUBLIC_BACKEND_URL}/api/v1/db/userworkspace`;
    const res = await request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        icon,
        name,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      const userWorkspace = json.data as UserWorkspace;
      const parsedUserWorkspace = UserWorkspaceSchema.parse(userWorkspace);
      this.userWorkspaces.push(parsedUserWorkspace);
    } else {
      throw new Error(await res.text());
    }
  }

  /**
   * Fetch all userworkspaces from the backend
   * @throws {Error} If the request fails with a non-200 status code
   */
  async fetch() {
    const url = `${PUBLIC_BACKEND_URL}/api/v1/db/userworkspace`;
    const res = await request(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (res.ok) {
      const json = await res.json();
      const userWorkspaces = json.data as UserWorkspace[];
      this.#userWorkspaces = userWorkspaces.map((uw) => UserWorkspaceSchema.parse(uw));
    } else {
      throw new Error(await res.text());
    }
  }

  /**
   * Delete the userworkspace with the given id
   * @param id The id of the userworkspace to delete
   * @throws {Error} If the request fails with a non-200 status code
   */
  async delete(id: string) {
    const url = `${PUBLIC_BACKEND_URL}/api/v1/db/userworkspace/${id}`;
    const res = await request(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (res.ok) {
      this.#userWorkspaces = this.#userWorkspaces.filter((userWorkspace) => userWorkspace.id !== id);
    } else {
      throw new Error(await res.text());
    }
  }

  /**
   * Switch to the userworkspace with the given id
   * @param id The id of the userworkspace to switch to
   */
  async fetchData(id: string) {
    const url = `${PUBLIC_BACKEND_URL}/api/v1/db/userworkspace/${id}`;
    const res = await request(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (res.ok) {
      const json = await res.json();
      const userWorkspaceData = json.data as UserWorkspaceData;
      const parsedUserWorkspaceData = UserWorkspaceDataSchema.parse(userWorkspaceData);
      return {
        workspaces: parsedUserWorkspaceData.workspaces,
        notes: parsedUserWorkspaceData.notes,
      };
    }
    throw new Error(await res.text());
  }

  /**
   * Update the userworkspace with the given id
   * @param icon The new icon of the userworkspace
   * @param name The new name of the userworkspace
   * @param id The id of the userworkspace to update
   * @throws {Error} If the request fails with a non-200 status code
   */
  async update(icon: string, name: string, id: string) {
    const url = `${PUBLIC_BACKEND_URL}/api/v1/db/userworkspace/${id}`;
    const res = await request(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        icon,
        name,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      const userWorkspace = json.data as UserWorkspace;
      const parsedUserWorkspace = UserWorkspaceSchema.parse(userWorkspace);
      this.#userWorkspaces = this.#userWorkspaces.map((userWorkspace) =>
        userWorkspace.id === id ? parsedUserWorkspace : userWorkspace
      );
    } else {
      throw new Error(await res.text());
    }
  }
}

const NOTAUSERWORKSPACESKEY = Symbol('NOTAUSERWORKSPACESKEY');

/**
 * Set the userworkspaces context.
 */
export const setUserWorkspacesContext = () => {
  return setContext(NOTAUSERWORKSPACESKEY, new UserWorkspaces());
};

/**
 * Get the userworkspaces context.
 */
export function getUserWorkspacesContext() {
  return getContext<ReturnType<typeof setUserWorkspacesContext>>(NOTAUSERWORKSPACESKEY);
}
