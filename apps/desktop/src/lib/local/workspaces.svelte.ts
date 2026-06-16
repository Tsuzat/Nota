import { toast } from '@nota/ui/shadcn/sonner';
import { getContext, setContext } from 'svelte';
import { getNewUUID } from '$lib/utils';
import { DB } from './db';
import { getLocalNotes } from './notes.svelte';

export interface LocalWorkSpace {
  id: string;
  name: string;
  icon: string;
  created_at: number;
  updated_at: number;
}

class WorkSpaces {
  #workspaces = $state<LocalWorkSpace[]>([]);

  constructor(workspaces: LocalWorkSpace[]) {
    this.#workspaces = workspaces;
  }

  getWorkspaces() {
    return this.#workspaces;
  }

  setWorkspaces(workspaces: LocalWorkSpace[]) {
    this.#workspaces = workspaces;
  }

  async fetchWorkspaces() {
    try {
      const res = await DB.select<LocalWorkSpace[]>('SELECT id, name, icon, created_at, updated_at FROM workspaces');
      this.setWorkspaces(res);
    } catch (e) {
      toast.error('Something went wrong when getting the workspaces');
      console.error(e);
    }
  }

  async createWorkspace(icon: string, name: string) {
    try {
      // insert into database
      const id = getNewUUID(this.#workspaces.map((t) => t.id));
      console.log({ id, name, icon });
      const res = await DB.execute('INSERT INTO workspaces (id, name, icon) VALUES ($1, $2, $3)', [id, name, icon]);
      if (res.rowsAffected === 1) {
        const newWorkspace = await DB.select<LocalWorkSpace[]>(
          'SELECT id, name, icon, created_at, updated_at FROM workspaces WHERE id = $1',
          [id]
        );
        this.setWorkspaces([...this.getWorkspaces(), newWorkspace[0]]);
      } else {
        toast.warning('Could not create workspace.');
      }
    } catch (e) {
      console.error(e);
      toast.error('Something went wrong');
    }
  }

  async deleteWorkspace(workspace: LocalWorkSpace) {
    try {
      const res = await DB.execute('DELETE FROM workspaces WHERE id = $1', [workspace.id]);
      if (res.rowsAffected === 1) {
        this.setWorkspaces(this.getWorkspaces().filter((w) => w.id !== workspace.id));
        try {
          const localNotes = getLocalNotes();
          if (localNotes) {
            localNotes.setNotes(localNotes.getNotes().filter((n) => n.workspace_id !== workspace.id));
          }
        } catch (noteErr) {
          console.error('Failed to update in-memory notes state after workspace deletion:', noteErr);
        }
        toast.success('Workspace deleted successfully');
      } else {
        toast.warning('Could not delete workspace from database.');
      }
    } catch (e) {
      console.error(e);
      toast.error('Something went wrong when deleting the workspace.');
    }
  }

  async updateWorkspace(workspace: LocalWorkSpace) {
    try {
      const res = await DB.execute('UPDATE workspaces SET name = $1, icon = $2 WHERE id = $3', [
        workspace.name,
        workspace.icon,
        workspace.id,
      ]);
      if (res.rowsAffected === 1) {
        this.setWorkspaces(this.getWorkspaces().map((w) => (w.id === workspace.id ? workspace : w)));
      } else {
        toast.warning('Could not update workspace.');
      }
    } catch (e) {
      console.error(e);
      toast.error('Something went wrong when updating the workspace.');
    }
  }
}

const WORKSPACESKEY = Symbol('WORKSPACESID');

export const setLocalWorkspaces = (workspaces: LocalWorkSpace[] = []) => {
  return setContext(WORKSPACESKEY, new WorkSpaces(workspaces));
};

export const getLocalWorkspaces = () => {
  return getContext<ReturnType<typeof setLocalWorkspaces>>(WORKSPACESKEY);
};
