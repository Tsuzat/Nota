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
	#getWorkspaceId?: () => string | undefined;

	constructor(getWorkspaceId?: () => string | undefined) {
		this.#getWorkspaceId = getWorkspaceId;
	}

	get workspaceId(): string | undefined {
		return this.#getWorkspaceId ? this.#getWorkspaceId() : this.#workspaceId;
	}

	set workspaceId(value: string | undefined) {
		this.#workspaceId = value;
	}

	#listQuery = createQuery(() => {
		const wsId = this.workspaceId;
		return {
			...orpc.notes.listByWorkspace.queryOptions({
				input: { workspaceId: wsId ?? "" },
			}),
			enabled: isSignedIn() && !!wsId,
		};
	});

	#collabQuery = createQuery(() => ({
		...orpc.notes.getCollabNotes.queryOptions(),
		enabled: isSignedIn(),
	}));

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
		orpc.notes.updateContent.mutationOptions(),
	);

	#moveMutation = createMutation(() =>
		orpc.notes.move.mutationOptions({
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

	notes(_workspaceId?: string): NoteMeta[] {
		return this.#listQuery.data ?? [];
	}

	get collaborated(): (NoteMeta & { role: string })[] {
		return this.#collabQuery.data ?? [];
	}

	get isLoading() {
		return this.#listQuery.isPending;
	}

	get error() {
		return this.#listQuery.error;
	}

	async fetchByWorkspace(workspaceId: string): Promise<void> {
		this.#workspaceId = workspaceId;
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
		return this.#updateMetaMutation.mutateAsync(input);
	}

	async update(id: string, input: Partial<Omit<UpdateNoteMetaInput, "id">>) {
		return this.#updateMetaMutation.mutateAsync({ id, ...input });
	}

	async delete(id: string) {
		return this.#deleteMutation.mutate({ id });
	}

	async move(input: {
		noteId: string;
		targetWorkspaceId: string;
		targetParentId: string | null;
		moveChildren: boolean;
	}) {
		return this.#moveMutation.mutateAsync(input);
	}

	async updateContent(id: string, content: unknown, contextText: string) {
		return this.#updateContentMutation.mutateAsync({
			id,
			content,
			contextText,
		});
	}

	async fetchById(id: string): Promise<NoteMeta | null> {
		try {
			return (
				(await queryClient.fetchQuery(
					orpc.notes.getMeta.queryOptions({
						input: { id },
					}),
				)) ?? null
			);
		} catch {
			return null;
		}
	}

	async getContent(id: string): Promise<unknown> {
		try {
			return (
				(await queryClient.fetchQuery(
					orpc.notes.getNoteContent.queryOptions({
						input: { noteId: id },
					}),
				)) ?? null
			);
		} catch {
			return null;
		}
	}
}
