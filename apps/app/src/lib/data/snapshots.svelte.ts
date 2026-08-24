import {
	createSnapshot,
	deleteSnapshot as deleteLocalSnapshotDb,
	getSnapshotContent as getLocalSnapshotContentDb,
	getWorkspaceSnapshots as getLocalWorkspaceSnapshotsDb,
} from "@nota/db-local/data/note_snapshot";
import { getNotesContent, saveNotesContent } from "@nota/db-local/data/notes";
import type { Content } from "@nota/ui/edra/tiptap/index.js";
import { invoke } from "@tauri-apps/api/core";
import { client, orpc, queryClient } from "#lib/orpc.ts";
import { ISDESKTOP } from "#lib/utils.ts";

export interface UnifiedSnapshotItem {
	id: string;
	noteId: string;
	createdBy?: string | null;
	label: string | null;
	kind: "auto" | "manual" | "pinned";
	contentHash: string;
	size: number;
	createdAt: Date;
	noteName: string;
	noteIcon: string | null;
	isCloud: boolean;
}

export interface SnapshotFilterOptions {
	noteId?: string;
	kind?: "auto" | "manual" | "pinned";
	search?: string;
	limit?: number;
	offset?: number;
	sortBy?: "createdAt" | "name" | "size";
	sortOrder?: "asc" | "desc";
}

export class SnapshotsManager {
	/**
	 * Fetch snapshots for a given workspace.
	 */
	async fetchWorkspaceSnapshots(
		workspaceId: string | undefined,
		isCloud: boolean,
		options: SnapshotFilterOptions = {},
	): Promise<{ items: UnifiedSnapshotItem[]; total: number }> {
		if (isCloud) {
			const res = await client.snapshots.list({
				workspaceId: workspaceId || undefined,
				...options,
			});
			return {
				items: res.items.map((item) => ({
					...item,
					createdAt: new Date(item.createdAt),
					isCloud: true,
				})),
				total: res.total,
			};
		}

		if (!ISDESKTOP) {
			return { items: [], total: 0 };
		}

		const res = await getLocalWorkspaceSnapshotsDb(
			workspaceId || undefined,
			options,
		);
		return {
			items: res.items.map((item) => ({
				...item,
				createdAt: new Date(item.createdAt),
				isCloud: false,
			})),
			total: res.total,
		};
	}

	/**
	 * Get preview content for a snapshot:
	 * Returns either a raw JSON object (for local) or a Uint8Array Yjs binary update (for cloud).
	 */
	async getSnapshotPreviewContent(
		snapshotId: string,
		isCloud: boolean,
	): Promise<
		{ type: "yjs"; content: Uint8Array } | { type: "json"; content: Content }
	> {
		if (isCloud) {
			const res = await client.snapshots.getContent({ snapshotId });
			const binary = Uint8Array.from(atob(res.binaryBase64), (c) =>
				c.charCodeAt(0),
			);
			return { type: "yjs", content: binary };
		}

		const compressed = await getLocalSnapshotContentDb(snapshotId);
		const bytes = Array.from(new Uint8Array(compressed));
		if (bytes.length === 0) {
			throw new Error("Snapshot content is empty or corrupted");
		}
		const jsonStr = await invoke<string>("decompress_data", { data: bytes });
		const parsed = JSON.parse(jsonStr);
		return { type: "json", content: parsed as Content };
	}

	/**
	 * Create a manual snapshot for a note.
	 */
	async createManualSnapshot(
		noteId: string,
		isCloud: boolean,
		label?: string,
	): Promise<void> {
		if (isCloud) {
			await client.snapshots.create({
				noteId,
				label: label || "Manual Snapshot",
			});
			queryClient.invalidateQueries({ queryKey: orpc.snapshots.key() });
			queryClient.invalidateQueries({ queryKey: orpc.userquota.key() });
			return;
		}

		if (!ISDESKTOP) return;

		const currentContent = await getNotesContent(noteId);
		if (!currentContent) {
			throw new Error("Note content is empty");
		}

		const jsonStr = JSON.stringify(currentContent);
		const [contentHash, compressed] = await Promise.all([
			invoke<string>("hash_data", { data: jsonStr }),
			invoke<number[]>("compress_data", { data: jsonStr }),
		]);

		const buffer = new Uint8Array(compressed);
		await createSnapshot({
			noteId,
			label: label || "Manual Snapshot",
			kind: "manual",
			contentCompressed: buffer,
			contentHash,
			size: buffer.byteLength,
			createdAt: new Date(),
		});
	}

	/**
	 * Delete a snapshot.
	 */
	async deleteSnapshot(snapshotId: string, isCloud: boolean): Promise<void> {
		if (isCloud) {
			await client.snapshots.delete({ snapshotId });
			queryClient.invalidateQueries({ queryKey: orpc.snapshots.key() });
			queryClient.invalidateQueries({ queryKey: orpc.userquota.key() });
			return;
		}

		await deleteLocalSnapshotDb(snapshotId);
	}

	/**
	 * Restore a note to a snapshot.
	 */
	async restoreSnapshot(
		snapshotId: string,
		isCloud: boolean,
		noteId?: string,
	): Promise<void> {
		if (isCloud) {
			await client.snapshots.restore({ snapshotId });
			queryClient.invalidateQueries({ queryKey: orpc.snapshots.key() });
			queryClient.invalidateQueries({ queryKey: orpc.notes.key() });
			queryClient.invalidateQueries({ queryKey: orpc.userquota.key() });
			return;
		}

		if (!ISDESKTOP || !noteId) return;

		// 1. Get current content to create auto-restore point
		const currentContent = await getNotesContent(noteId);
		if (currentContent) {
			try {
				const jsonStr = JSON.stringify(currentContent);
				const [contentHash, compressed] = await Promise.all([
					invoke<string>("hash_data", { data: jsonStr }),
					invoke<number[]>("compress_data", { data: jsonStr }),
				]);
				const buffer = new Uint8Array(compressed);
				await createSnapshot({
					noteId,
					label: `Auto-saved before restoring snapshot`,
					kind: "auto",
					contentCompressed: buffer,
					contentHash,
					size: buffer.byteLength,
					createdAt: new Date(),
				});
			} catch (e) {
				console.warn("Failed to create local auto-restore point:", e);
			}
		}

		// 2. Fetch decompressed snapshot content
		const compressed = await getLocalSnapshotContentDb(snapshotId);
		const bytes = Array.from(new Uint8Array(compressed));
		if (bytes.length === 0) {
			throw new Error("Snapshot content is empty or corrupted");
		}
		const jsonStr = await invoke<string>("decompress_data", { data: bytes });
		const parsed = JSON.parse(jsonStr);

		// 3. Save restored content
		await saveNotesContent(noteId, parsed, null);
	}
}

export const snapshotsManager = new SnapshotsManager();
