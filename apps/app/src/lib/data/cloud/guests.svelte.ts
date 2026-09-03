import type { NoteGuestUser, NoteOwnerUser } from "@nota/db/data/guests";
import type { GuestRole } from "@nota/db/types";
import { toast } from "@nota/ui";
import { isSignedIn } from "#lib/auth-session.svelte.ts";
import { client } from "#lib/orpc.ts";

export class CloudGuests {
	#noteId = $state<string>();
	owner = $state<NoteOwnerUser | null>(null);
	guests = $state<NoteGuestUser[]>([]);
	totalGuests = $state<number>(0);
	hasMore = $state<boolean>(false);
	isLoading = $state<boolean>(false);
	isLoadingMore = $state<boolean>(false);
	isAdding = $state<boolean>(false);
	isUpdating = $state<boolean>(false);
	isRemoving = $state<boolean>(false);
	error = $state<Error | null>(null);

	constructor(initialNoteId?: string) {
		this.#noteId = initialNoteId;
	}

	get noteId() {
		return this.#noteId;
	}

	set noteId(id: string | undefined) {
		if (this.#noteId !== id) {
			this.#noteId = id;
			this.owner = null;
			this.guests = [];
			this.totalGuests = 0;
			this.hasMore = false;
			this.error = null;
		}
	}

	get isMutating() {
		return this.isAdding || this.isUpdating || this.isRemoving;
	}

	async fetch(noteId?: string) {
		if (noteId) this.noteId = noteId;
		if (!this.noteId || !isSignedIn()) return;

		this.isLoading = true;
		this.error = null;
		try {
			const res = await client.guests.list({
				noteId: this.noteId,
				limit: 20,
				offset: 0,
			});
			this.owner = res.owner;
			this.guests = res.guests;
			this.totalGuests = res.totalGuests ?? res.guests.length;
			this.hasMore = res.hasMore ?? false;
		} catch (err: unknown) {
			this.error =
				err instanceof Error ? err : new Error("Failed to load guests");
		} finally {
			this.isLoading = false;
		}
	}

	async loadMore() {
		if (!this.noteId || !this.hasMore || this.isLoadingMore) return;

		this.isLoadingMore = true;
		try {
			const res = await client.guests.list({
				noteId: this.noteId,
				limit: 20,
				offset: this.guests.length,
			});
			if (res.owner) this.owner = res.owner;

			const toAdd = res.guests.filter(
				(newGuest) => !this.guests.some((g) => g.id === newGuest.id),
			);
			this.guests = [...this.guests, ...toAdd];
			this.totalGuests = res.totalGuests ?? this.guests.length;
			this.hasMore = res.hasMore ?? this.guests.length < this.totalGuests;
		} catch (err: unknown) {
			console.error("Failed to load more guests:", err);
			toast.error("Failed to load more members");
		} finally {
			this.isLoadingMore = false;
		}
	}

	async add(input: { noteId: string; email: string; role: GuestRole }) {
		this.isAdding = true;
		try {
			const guest = await client.guests.add(input);
			await this.fetch(input.noteId);
			return guest;
		} finally {
			this.isAdding = false;
		}
	}

	async updateRole(input: { noteId: string; userId: string; role: GuestRole }) {
		this.isUpdating = true;
		try {
			const guest = await client.guests.updateRole(input);
			this.guests = this.guests.map((g) =>
				g.userId === input.userId ? { ...g, role: input.role } : g,
			);
			return guest;
		} finally {
			this.isUpdating = false;
		}
	}

	async remove(input: { noteId: string; userId: string }) {
		this.isRemoving = true;
		try {
			const res = await client.guests.remove(input);
			this.guests = this.guests.filter((g) => g.userId !== input.userId);
			this.totalGuests = Math.max(0, this.totalGuests - 1);
			return res;
		} finally {
			this.isRemoving = false;
		}
	}
}
