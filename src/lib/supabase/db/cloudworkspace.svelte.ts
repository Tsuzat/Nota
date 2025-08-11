import type { CloudUserWorkspace } from './clouduserworkspaces.svelte';
import { getContext, setContext } from 'svelte';
import { supabase } from '..';
import { toast } from 'svelte-sonner';

export type CloudWorkspace = {
	id: string;
	icon: string;
	name: string;
	description: string;
	created_at: string;
	updated_at: string;
	owner: string;
	userworkspace: string;
};

class CloudWorkspaces {
	#workspaces = $state<CloudWorkspace[]>([]);

	getWorkspaces() {
		return this.#workspaces;
	}

	/**
	 * Fetch workspaces for a specific user workspace
	 */
	async fetchWorkspaces(userworkspace: CloudUserWorkspace) {
		try {
			const { data, error } = await supabase
				.from('workspaces')
				.select('*')
				.eq('userworkspace', userworkspace.id)
				.order('created_at', { ascending: true });

			if (error) {
				console.error(error);
				toast.error(error.message);
				return;
			}
			this.#workspaces = data ?? [];
		} catch (err) {
			console.error('Error fetching workspaces:', err);
			throw err;
		}
	}

	/**
	 * Create a new workspace in Supabase & update local state
	 */
	async createWorkspace(
		workspace: Partial<CloudWorkspace> & { owner: string; userworkspace: string }
	) {
		try {
			const { data, error } = await supabase
				.from('workspaces')
				.insert({
					name: workspace.name,
					icon: workspace.icon ?? '📁',
					description: workspace.description ?? '',
					owner: workspace.owner,
					userworkspace: workspace.userworkspace
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
			console.error('Error creating workspace:', err);
			toast.error('Error creating workspace.');
		}
	}

	/**
	 * Update an existing workspace in Supabase & update local state
	 */
	async updateWorkspace(workspace: CloudWorkspace) {
		try {
			const { data, error } = await supabase
				.from('workspaces')
				.update({
					name: workspace.name,
					icon: workspace.icon,
					description: workspace.description
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
			console.error('Error updating workspace:', err);
			toast.error('Error updating workspace.');
		}
	}

	/**
	 * Delete a workspace from Supabase & update local state
	 */
	async deleteWorkspace(id: string) {
		try {
			const { error } = await supabase.from('workspaces').delete().eq('id', id);

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
}

const CLOUDWORKSPACES = Symbol('CloudWorkspaces');

export const setCloudWorkspaces = () => {
	return setContext(CLOUDWORKSPACES, new CloudWorkspaces());
};

export const useCloudWorkspaces = () => {
	return getContext<ReturnType<typeof setCloudWorkspaces>>(CLOUDWORKSPACES);
};
