import {
	createNotes,
	deleteNotes,
	fetchNotesByWorkspace,
	fetchNotesMeta,
	saveNotesContent,
	updateNotesMeta,
} from "@nota/db-local/data/notes";
import type {
	InsertLocalNote,
	LocalNoteMeta,
	UpdateLocalNote,
} from "@nota/db-local/types";
import type { ILocalNotes } from "../types";

export class LocalNotes implements ILocalNotes {
	#notesByWorkspace = $state<Record<string, LocalNoteMeta[]>>({});

	notes(workspaceId: string): readonly LocalNoteMeta[] {
		return this.#notesByWorkspace[workspaceId] ?? [];
	}

	async fetchByWorkspace(workspaceId: string): Promise<void> {
		const notes = await fetchNotesByWorkspace(workspaceId);
		this.#notesByWorkspace = {
			...this.#notesByWorkspace,
			[workspaceId]: notes,
		};
	}

	async create(input: InsertLocalNote & { content?: object }): Promise<void> {
		const note = await createNotes(input);
		const workspaceId = note.workspaceId;
		const current = this.#notesByWorkspace[workspaceId] ?? [];
		const meta: LocalNoteMeta = {
			id: note.id,
			workspaceId: note.workspaceId,
			parentNoteId: note.parentNoteId,
			icon: note.icon,
			name: note.name,
			description: note.description,
			starred: note.starred,
			trashedAt: note.trashedAt,
			createdAt: note.createdAt,
			updatedAt: note.updatedAt,
		};
		this.#notesByWorkspace = {
			...this.#notesByWorkspace,
			[workspaceId]: [...current, meta],
		};
	}

	#findWorkspaceId(id: string): string | null {
		for (const [wid, list] of Object.entries(this.#notesByWorkspace)) {
			if (list.some((n) => n.id === id)) return wid;
		}
		return null;
	}

	async update(id: string, input: UpdateLocalNote): Promise<void> {
		const updated = await updateNotesMeta({ id, ...input });
		const workspaceId = updated.workspaceId ?? this.#findWorkspaceId(id);
		if (!workspaceId) return;
		const current = this.#notesByWorkspace[workspaceId] ?? [];
		this.#notesByWorkspace = {
			...this.#notesByWorkspace,
			[workspaceId]: current.map((n) =>
				n.id === id ? { ...n, ...updated } : n,
			),
		};
	}

	async delete(id: string): Promise<void> {
		let workspaceId = this.#findWorkspaceId(id);
		if (!workspaceId) {
			const meta = await fetchNotesMeta(id);
			workspaceId = meta?.workspaceId ?? null;
		}
		await deleteNotes(id);
		if (!workspaceId) return;
		const current = this.#notesByWorkspace[workspaceId] ?? [];
		this.#notesByWorkspace = {
			...this.#notesByWorkspace,
			[workspaceId]: current.filter((n) => n.id !== id),
		};
	}

	async saveContent(
		id: string,
		content: unknown,
		contentText?: string | null,
	): Promise<void> {
		await saveNotesContent(id, content, contentText ?? null);
	}
}
