import type { LocalNoteMeta } from "@nota/db-local/types";
import type { ILocalNotes } from "../types";

export class LocalNotes implements ILocalNotes {
	notes(): readonly LocalNoteMeta[] {
		return [];
	}

	async fetchByWorkspace(): Promise<void> {}

	async create(): Promise<never> {
		throw new Error("Local notes are unavailable on web");
	}

	async update(): Promise<never> {
		throw new Error("Local notes are unavailable on web");
	}

	async delete(): Promise<never> {
		throw new Error("Local notes are unavailable on web");
	}

	async duplicate(): Promise<never> {
		throw new Error("Local notes are unavailable on web");
	}

	async saveContent(): Promise<never> {
		throw new Error("Local notes are unavailable on web");
	}

	async applyMoves(): Promise<never> {
		throw new Error("Local notes are unavailable on web");
	}
}
