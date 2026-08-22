import {
	createNotes,
	deleteNotes,
	fetchNotesByWorkspace,
	fetchNotesMeta,
	getNotesContent,
	saveNotesContent,
	updateNotesMeta,
} from "@nota/db-local/data/notes";
import type {
	InsertLocalNote,
	LocalNoteMeta,
	UpdateLocalNote,
} from "@nota/db-local/types";
import type { Content } from "@nota/ui/edra/tiptap/index.js";
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
	}

	async fetchById(id: string): Promise<LocalNoteMeta | null> {
		return await fetchNotesMeta(id);
	}

	async getContent(id: string): Promise<Content> {
		const data = await getNotesContent(id);
		return data as Content;
	}
}
