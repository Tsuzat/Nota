import { mayCreateSnapshot } from "@nota/db-local/data/note_snapshot";
import {
	createNotes,
	deleteNotes,
	fetchNotesByWorkspace,
	fetchNotesMeta,
	getNotesContent,
	moveNotes,
	saveNotesContent,
	updateNotesMeta,
} from "@nota/db-local/data/notes";
import type {
	InsertLocalNote,
	LocalNoteMeta,
	UpdateLocalNote,
} from "@nota/db-local/types";
import type { Content } from "@nota/ui/edra/tiptap/index.js";
import { invoke } from "@tauri-apps/api/core";
import type { MoveUpdate } from "../move-notes";
import type { ILocalNotes } from "../types";

export class LocalNotes implements ILocalNotes {
	#notes = $state<LocalNoteMeta[]>([]);

	notes(_workspaceId: string): LocalNoteMeta[] {
		return this.#notes;
	}

	async fetchByWorkspace(workspaceId: string): Promise<void> {
		const notes = await fetchNotesByWorkspace(workspaceId);
		this.#notes = notes;
	}

	async create(input: InsertLocalNote & { content?: object }): Promise<void> {
		const note = await createNotes(input);
		this.#notes = [...this.#notes, note];
	}

	async update(id: string, input: UpdateLocalNote): Promise<void> {
		const updated = await updateNotesMeta({ id, ...input });
		this.#notes = this.#notes.map((n) =>
			n.id === id ? { ...n, ...updated } : n,
		);
	}

	async delete(id: string): Promise<void> {
		await deleteNotes(id);
		this.#notes = this.#notes.filter((n) => n.id !== id);
	}

	async saveContent(
		id: string,
		content: unknown,
		contentText?: string | null,
	): Promise<void> {
		await saveNotesContent(id, content, contentText ?? null);

		if (content) {
			void (async () => {
				try {
					const jsonStr =
						typeof content === "string" ? content : JSON.stringify(content);
					const [contentHash, compressed] = await Promise.all([
						invoke<string>("hash_data", { data: jsonStr }),
						invoke<number[]>("compress_data", { data: jsonStr }),
					]);
					const buffer = new Uint8Array(compressed);
					await mayCreateSnapshot({
						noteId: id,
						label: "Auto Snapshot",
						contentCompressed: buffer,
						contentHash,
						size: buffer.byteLength,
					});
				} catch (err) {
					console.warn("[LocalNotes] Auto snapshot error:", err);
				}
			})();
		}
	}

	async fetchById(id: string): Promise<LocalNoteMeta | null> {
		return await fetchNotesMeta(id);
	}

	async getContent(id: string): Promise<Content> {
		const data = await getNotesContent(id);
		return data as Content;
	}

	async applyMoves(updates: MoveUpdate[]): Promise<void> {
		if (updates.length === 0) return;
		await moveNotes(updates);
	}
}
