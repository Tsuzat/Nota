import type { NoteMeta as CloudNoteMeta } from "@nota/db/data/notes";
import type { LocalNoteMeta } from "@nota/db-local/types";
import { getContext, setContext } from "svelte";
import { isSignedIn } from "#lib/auth-session.svelte.ts";
import { CloudNotes } from "./cloud/notes.svelte";
import { LocalNotes } from "./local/notes.svelte.ts";
import { resolveMove } from "./move-notes";
import type { NoteMeta } from "./types";
import { getWorkspaceContext } from "./workspace.svelte.ts";

class Notes {
	#workspaceCtx = getWorkspaceContext();
	cloud = new CloudNotes(() => {
		const ws = this.#workspaceCtx.current;
		return ws && "ownerId" in ws ? ws.id : undefined;
	});
	local = new LocalNotes();
	current = $state<NoteMeta | null>(null);

	list = $derived.by(() => {
		const ws = this.#workspaceCtx.current;
		if (!ws) return [];
		const isCloud = "ownerId" in ws;
		return isCloud ? this.cloud.notes(ws.id) : this.local.notes(ws.id);
	});

	collaborated = $derived.by(() => {
		if (!isSignedIn()) return [];
		return this.cloud.collaborated;
	});

	constructor() {
		$effect(() => {
			const ws = this.#workspaceCtx.current;
			if (!ws) return;
			const workspaceId = ws.id;
			const isCloud = "ownerId" in ws;
			(async () => {
				if (isCloud) {
					await this.cloud.fetchByWorkspace(workspaceId);
				} else {
					await this.local.fetchByWorkspace(workspaceId);
				}
			})();
		});

		$effect(() => {
			if (this.current && this.list.some((n) => n.id === this.current?.id)) {
				return;
			}
			this.current = this.list[0] ?? null;
		});
	}

	async init() {}

	async create(input: {
		name: string;
		icon: string;
		description?: string | null;
		parentNoteId?: string | null;
		content?: unknown;
		contextText?: string | null;
	}) {
		const ws = this.#workspaceCtx.current;
		if (!ws) throw new Error("No active workspace");
		const workspaceId = ws.id;
		if ("ownerId" in ws && isSignedIn()) {
			await this.cloud.create({
				workspaceId,
				name: input.name,
				description: input.description ?? null,
				icon: input.icon,
				parentNoteId: input.parentNoteId ?? null,
				content: (input.content ?? new Uint8Array([0, 0])) as never,
				contextText: input.contextText ?? null,
			});
		} else {
			await this.local.create({
				workspaceId,
				icon: input.icon ?? "📝",
				name: input.name,
				description: input.description ?? null,
				parentNoteId: input.parentNoteId ?? null,
				content: (input.content ?? {}) as never,
				contentText: input.contextText ?? null,
			});
		}
	}

	async updateMeta(
		id: string,
		input: Partial<LocalNoteMeta> | Partial<CloudNoteMeta>,
	) {
		const ws = this.#workspaceCtx.current;
		if (!ws) throw new Error("No active workspace");
		if ("ownerId" in ws && isSignedIn()) {
			await this.cloud.updateMeta({ id, ...input } as never);
		} else {
			await this.local.update(id, input as LocalNoteMeta);
		}
	}

	async delete(id: string) {
		const ws = this.#workspaceCtx.current;
		if (!ws) throw new Error("No active workspace");
		if ("ownerId" in ws) {
			await this.cloud.delete(id);
		} else {
			await this.local.delete(id);
		}
	}

	/**
	 * Move a note to another workspace and/or parent.
	 * Cloud notes are moved authoritatively by the server;
	 * local moves are resolved client-side then persisted in a batch.
	 */
	async move(input: {
		note: NoteMeta;
		targetWorkspaceId: string;
		targetParentId: string | null;
		moveChildren: boolean;
	}) {
		const isCloudNote = "ownerId" in input.note && isSignedIn();
		if (isCloudNote) {
			await this.cloud.move({
				noteId: input.note.id,
				targetWorkspaceId: input.targetWorkspaceId,
				targetParentId: input.targetParentId,
				moveChildren: input.moveChildren,
			});
			return;
		}

		const plan = resolveMove({
			notes: this.list,
			noteId: input.note.id,
			targetWorkspaceId: input.targetWorkspaceId,
			targetParentId: input.targetParentId,
			moveChildren: input.moveChildren,
		});
		await this.local.applyMoves(plan.updates);

		// Resync the visible (current workspace) list.
		const ws = this.#workspaceCtx.current;
		if (ws && !("ownerId" in ws)) {
			await this.local.fetchByWorkspace(ws.id);
		}
	}

	async updateContent(
		id: string,
		content: unknown,
		contextText?: string | null,
	) {
		const ws = this.#workspaceCtx.current;
		if (!ws) throw new Error("No active workspace");
		if ("ownerId" in ws && isSignedIn()) {
			await this.cloud.updateContent(id, content, contextText ?? "");
		} else {
			await this.local.saveContent(id, content, contextText);
		}
	}
}

const NOTES = Symbol("NOTES");

export const setNotesContext = () => {
	return setContext(NOTES, new Notes());
};

export const getNotesContext = () => {
	return getContext<ReturnType<typeof setNotesContext>>(NOTES);
};
