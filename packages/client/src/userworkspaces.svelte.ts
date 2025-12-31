import { getContext, setContext } from 'svelte';
import { PUBLIC_BACKEND_URL } from '$env/static/public';
import request from './request';
import { type UserWorkspace, UserWorkspaceSchema } from './types';

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
    const url = `${PUBLIC_BACKEND_URL}/api/db/userworkspaces`;
    const res = await request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        icon,
        name,
        owner: localStorage.getItem('user_id'),
      }),
    });
    if (res.ok) {
      const userWorkspace = (await res.json()) as UserWorkspace;
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
    const url = `${PUBLIC_BACKEND_URL}/api/db/userworkspaces`;
    const res = await request(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (res.ok) {
      const userWorkspaces = (await res.json()) as UserWorkspace[];
      this.#userWorkspaces = userWorkspaces;
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
    const url = `${PUBLIC_BACKEND_URL}/api/db/userworkspaces/${id}`;
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
   * Update the userworkspace with the given id
   * @param icon The new icon of the userworkspace
   * @param name The new name of the userworkspace
   * @param id The id of the userworkspace to update
   * @throws {Error} If the request fails with a non-200 status code
   */
  async update(icon: string, name: string, id: string) {
    const url = `${PUBLIC_BACKEND_URL}/api/db/userworkspaces/${id}`;
    const res = await request(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        icon,
        name,
      }),
    });
    if (res.ok) {
      const userWorkspace = (await res.json()) as UserWorkspace;
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
