import type {
  CreateLocalWorkspace,
  LocalWorkspace,
  UpdateLocalWorkspace,
} from "@nota/db-local/types";
import {
  createWorkspace,
  fetchWorkspace,
  deleteWorkspace,
  updateWorkspace,
} from "@nota/db-local/data/workspace";
import type { ILocalWorkspaces } from "../types";

export class LocalWorkspaces implements ILocalWorkspaces {
  #workspaces = $state<LocalWorkspace[]>([]);
  get workspaces() {
    return this.#workspaces;
  }
  set workspaces(value: LocalWorkspace[]) {
    this.#workspaces = value;
  }

  /**
   * Create workspace and add it to the store
   * @param input CreateLocalWorkspace
   */
  async insert(input: CreateLocalWorkspace) {
    const newWorkspace = await createWorkspace(input);
    this.#workspaces = [...this.#workspaces, newWorkspace];
  }

  /**
   * Fetch all workspaces and update the store
   */
  async fetch() {
    const workspaces = await fetchWorkspace();
    this.#workspaces = workspaces;
  }

  /**
   * Delete workspace
   * @param id string
   */
  async delete(id: string) {
    await deleteWorkspace(id);
    this.#workspaces = this.#workspaces.filter(
      (workspace) => workspace.id !== id,
    );
  }

  /**
   * Update workspace
   * @param id string
   * @param input UpdateLocalWorkspace
   */
  async update(id: string, input: UpdateLocalWorkspace) {
    const updatedWorkspace = await updateWorkspace({ id, ...input });
    this.#workspaces = this.#workspaces.map((workspace) =>
      workspace.id === id ? updatedWorkspace : workspace,
    );
  }
}
