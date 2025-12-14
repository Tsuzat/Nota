import { toast } from '@nota/ui/shadcn/sonner';
import type { User } from '@supabase/supabase-js';
import { getContext, setContext } from 'svelte';
import { supabase } from '..';

export interface CloudUserWorkspace {
  id: string;
  icon: string;
  name: string;
  owner: string;
  created_at: string;
  updated_at: string;
}

class CloudUserWorkspaces {
  #workspaces = $state<CloudUserWorkspace[]>([]);

  setWorkspace(workspace: CloudUserWorkspace[]) {
    this.#workspaces = workspace;
  }

  getWorkspaces() {
    return this.#workspaces;
  }

  async createWorkspace(userworkspace: Partial<CloudUserWorkspace> & { owner: string; name: string }) {
    try {
      const { data, error } = await supabase
        .from('userworkspaces')
        .insert({
          name: userworkspace.name,
          icon: userworkspace.icon ?? '📁',
          owner: userworkspace.owner,
        })
        .select()
        .single();

      if (error) {
        console.error(error);
        toast.error(error.message);
      }
      if (data) {
        this.#workspaces = [...this.#workspaces, data];
      }
    } catch (err) {
      console.error('Error creating user workspace:', err);
      toast.error('Error creating user workspace.');
    }
  }

  /**
   * Update an existing workspace in Supabase & update local state
   */
  async updateWorkspace(workspace: CloudUserWorkspace) {
    try {
      const { data, error } = await supabase
        .from('userworkspaces')
        .update({
          name: workspace.name,
          icon: workspace.icon,
        })
        .eq('id', workspace.id)
        .select()
        .single();

      if (error) {
        console.error(error);
        toast.error(error.message);
      }
      if (data) {
        this.#workspaces = this.#workspaces.map((w) => (w.id === data.id ? data : w));
      }
    } catch (err) {
      console.error('Error updating user workspace:', err);
      toast.error('Error updating user workspace.');
    }
  }

  /**
   * Delete a workspace from Supabase & update local state
   */
  async deleteWorkspace(id: string) {
    try {
      const { error } = await supabase.from('userworkspaces').delete().eq('id', id);

      if (error) {
        console.error(error);
        toast.error(error.message);
        return;
      }
      this.#workspaces = this.#workspaces.filter((w) => w.id !== id);
    } catch (err) {
      console.error('Error deleting workspace:', err);
      throw err;
    }
  }

  /**
   * Fetch workspaces for a specific user
   */
  async fetchWorkspaces(user: User) {
    try {
      const { data, error } = await supabase
        .from('userworkspaces')
        .select('*')
        .eq('owner', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error(error);
        toast.error(error.message);
      }
      if (data) this.#workspaces = data ?? [];
    } catch (err) {
      console.error('Error fetching workspaces:', err);
      toast.error('Something went wrong');
    }
  }
}

const CLOUDUSERWORKSPACES = Symbol('CloudUserWorkspaces');

export const setCloudUserWorkspaces = () => {
  return setContext(CLOUDUSERWORKSPACES, new CloudUserWorkspaces());
};

export const useCloudUserWorkspaces = () => {
  return getContext<ReturnType<typeof setCloudUserWorkspaces>>(CLOUDUSERWORKSPACES);
};
