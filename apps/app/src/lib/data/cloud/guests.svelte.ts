import type { GuestRole } from "@nota/db/types";
import { createMutation, createQuery } from "@tanstack/svelte-query";
import { isSignedIn } from "#lib/auth-session.svelte.ts";
import { orpc, queryClient } from "#lib/orpc.ts";

export class CloudGuests {
	noteId = $state<string>();

	constructor(initialNoteId?: string) {
		this.noteId = initialNoteId;
	}

	#query = createQuery(() => {
		const id = this.noteId;
		return {
			...orpc.guests.list.queryOptions({
				input: { noteId: id ?? "" },
			}),
			enabled: isSignedIn() && !!id,
		};
	});

	#addMutation = createMutation(() =>
		orpc.guests.add.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.guests.list.key(),
				});
			},
		}),
	);

	#updateRoleMutation = createMutation(() =>
		orpc.guests.updateRole.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.guests.list.key(),
				});
			},
		}),
	);

	#removeMutation = createMutation(() =>
		orpc.guests.remove.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.guests.list.key(),
				});
			},
		}),
	);

	get data() {
		return this.#query.data;
	}

	get owner() {
		return this.#query.data?.owner ?? null;
	}

	get guests() {
		return this.#query.data?.guests ?? [];
	}

	get isLoading() {
		return this.#query.isLoading;
	}

	get isFetching() {
		return this.#query.isFetching;
	}

	get isRefetching() {
		return this.#query.isRefetching;
	}

	get isAdding() {
		return this.#addMutation.isPending;
	}

	get isUpdating() {
		return this.#updateRoleMutation.isPending;
	}

	get isRemoving() {
		return this.#removeMutation.isPending;
	}

	get isMutating() {
		return (
			this.#addMutation.isPending ||
			this.#updateRoleMutation.isPending ||
			this.#removeMutation.isPending
		);
	}

	get error() {
		return this.#query.error;
	}

	async fetch(noteId?: string) {
		if (noteId) this.noteId = noteId;
		await this.#query.refetch();
	}

	async add(input: { noteId: string; email: string; role: GuestRole }) {
		return this.#addMutation.mutateAsync(input);
	}

	async updateRole(input: { noteId: string; userId: string; role: GuestRole }) {
		return this.#updateRoleMutation.mutateAsync(input);
	}

	async remove(input: { noteId: string; userId: string }) {
		return this.#removeMutation.mutateAsync(input);
	}
}
