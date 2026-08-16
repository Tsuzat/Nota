import type {
	CreateNoteInput,
	NoteMeta,
	UpdateNoteMetaInput,
} from "@nota/db/data/notes";
import { createMutation, createQuery } from "@tanstack/svelte-query";
import { isSignedIn } from "#lib/auth-session.svelte.ts";
import { orpc, queryClient } from "#lib/orpc.ts";

export class CloudNotes {
	#workspaceId = $state<string>();

	#listQuery = createQuery(() => {
		return {
			...orpc.notes.listByWorkspace.queryOptions({
				input: { workspaceId: this.#workspaceId ?? "" },
			}),
			enabled: isSignedIn() && !!this.#workspaceId,
		};
	});

	#createMutation = createMutation(() =>
		orpc.notes.create.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({
					queryKey: orpc.notes.listByWorkspace.key(),
				});
			},
		}),
	);

	#updateMetaMutation = createMutation(() =>
		orpc.notes.updateMeta.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({
					queryKey: orpc.notes.listByWorkspace.key(),
				});
				void queryClient.invalidateQueries({
					queryKey: orpc.notes.getMeta.key(),
				});
			},
		}),
	);

	#deleteMutation = createMutation(() =>
		orpc.notes.delete.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({
					queryKey: orpc.notes.listByWorkspace.key(),
				});
				void queryClient.invalidateQueries({
					queryKey: orpc.notes.getMeta.key(),
				});
			},
		}),
	);

	#updateContentMutation = createMutation(() =>
		orpc.notes.updateContent.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({
					queryKey: orpc.notes.listByWorkspace.key(),
				});
				void queryClient.invalidateQueries({
					queryKey: orpc.notes.getMeta.key(),
				});
			},
		}),
	);

	notes(workspaceId: string): NoteMeta[] {
		this.#workspaceId = workspaceId;
		return this.#listQuery.data ?? [];
	}

	get isLoading() {
		return this.#listQuery.isPending;
	}

	get error() {
		return this.#listQuery.error;
	}

	async fetchByWorkspace(workspaceId: string): Promise<void> {
		this.#workspaceId = workspaceId;
		await this.#listQuery.refetch();
	}

	async create(
		input: Partial<CreateNoteInput> & {
			workspaceId: string;
			name: string;
			icon: string;
		},
	) {
		return this.#createMutation.mutate(input);
	}

	async updateMeta(input: UpdateNoteMetaInput) {
		return this.#updateMetaMutation.mutate(input);
	}

	async delete(id: string) {
		return this.#deleteMutation.mutate({ id });
	}

	async updateContent(id: string, content: unknown, contextText: string) {
		return this.#updateContentMutation.mutate({ id, content, contextText });
	}
}
