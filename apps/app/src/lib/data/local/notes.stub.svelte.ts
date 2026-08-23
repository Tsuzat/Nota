import type { LocalNoteMeta } from "@nota/db-local/types";
import type { ILocalNotes } from "../types";

export class LocalNotes implements ILocalNotes {
	notes(_workspaceId: string): readonly LocalNoteMeta[] {
		return [];
	}

	async fetchByWorkspace(_workspaceId: string): Promise<void> {}

	async create(): Promise<never> {
		throw new Error("Local notes are unavailable on web");
	}

	async update(): Promise<never> {
		throw new Error("Local notes are unavailable on web");
	}

	async delete(): Promise<never> {
		throw new Error("Local notes are unavailable on web");
	}

	async saveContent(): Promise<never> {
		throw new Error("Local notes are unavailable on web");
	}

	async applyMoves(): Promise<never> {
		throw new Error("Local notes are unavailable on web");
	}
}
