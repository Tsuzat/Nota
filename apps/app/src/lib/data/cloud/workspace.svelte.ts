import type { UpdateWorkspaceInput } from "@nota/db/data/workspace";
import type { CloudWorkspace } from "@nota/db/types";
import { createMutation, createQuery } from "@tanstack/svelte-query";
import { isSignedIn } from "#lib/auth-session.svelte.ts";
import { orpc, queryClient } from "#lib/orpc.ts";

export class CloudWorkspaces {
	#query = createQuery(() => ({
		...orpc.workspace.fetchForUser.queryOptions(),
		enabled: isSignedIn(),
	}));

	#createMutation = createMutation(() =>
		orpc.workspace.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.workspace.fetchForUser.key(),
				});
			},
		}),
	);

	#updateMutation = createMutation(() =>
		orpc.workspace.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.workspace.fetchForUser.key(),
				});
			},
		}),
	);

	#deleteMutation = createMutation(() =>
		orpc.workspace.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.workspace.fetchForUser.key(),
				});
			},
		}),
	);

	get workspaces(): CloudWorkspace[] {
		if (!isSignedIn()) return [];
		return this.#query.data ?? [];
	}

	get isLoading() {
		return this.#query.isPending;
	}

	get error() {
		return this.#query.error;
	}

	async fetch() {
		await this.#query.refetch();
	}

	async insert(input: { name: string; icon: string }) {
		return this.#createMutation.mutate(input);
	}

	async update(input: UpdateWorkspaceInput) {
		return this.#updateMutation.mutate(input);
	}

	async delete(id: string) {
		return this.#deleteMutation.mutate({ id });
	}
}
