import { eq, inArray } from "drizzle-orm";
import { db } from "..";
import { assets, noteSnapshots, notes } from "../schema/app";
import { getNotesDescendants } from "./notes";

export interface CleanableAsset {
	id: string;
	path: string;
	size: number;
}

export const getNoteCleanableStorage = async (noteId: string) => {
	const descendants = await getNotesDescendants(noteId);
	const noteIds = [noteId, ...descendants.map((d) => d.id)];

	const noteAssets = await db
		.select({ id: assets.id, path: assets.path, size: assets.size })
		.from(assets)
		.where(inArray(assets.noteId, noteIds));

	const snapshots = await db
		.select({ size: noteSnapshots.size })
		.from(noteSnapshots)
		.where(inArray(noteSnapshots.noteId, noteIds));

	const totalAssetsSize = noteAssets.reduce((sum, a) => sum + (a.size || 0), 0);
	const totalSnapshotsSize = snapshots.reduce(
		(sum, s) => sum + (s.size || 0),
		0,
	);

	return {
		assets: noteAssets,
		totalAssetsSize,
		totalSnapshotsSize,
		totalFreedBytes: totalAssetsSize + totalSnapshotsSize,
	};
};

export const getWorkspaceCleanableStorage = async (workspaceId: string) => {
	const workspaceNotes = await db
		.select({ id: notes.id })
		.from(notes)
		.where(eq(notes.workspaceId, workspaceId));

	const noteIds = workspaceNotes.map((n) => n.id);
	if (noteIds.length === 0) {
		return {
			assets: [],
			totalAssetsSize: 0,
			totalSnapshotsSize: 0,
			totalFreedBytes: 0,
		};
	}

	const wsAssets = await db
		.select({ id: assets.id, path: assets.path, size: assets.size })
		.from(assets)
		.where(inArray(assets.noteId, noteIds));

	const snapshots = await db
		.select({ size: noteSnapshots.size })
		.from(noteSnapshots)
		.where(inArray(noteSnapshots.noteId, noteIds));

	const totalAssetsSize = wsAssets.reduce((sum, a) => sum + (a.size || 0), 0);
	const totalSnapshotsSize = snapshots.reduce(
		(sum, s) => sum + (s.size || 0),
		0,
	);

	return {
		assets: wsAssets,
		totalAssetsSize,
		totalSnapshotsSize,
		totalFreedBytes: totalAssetsSize + totalSnapshotsSize,
	};
};
