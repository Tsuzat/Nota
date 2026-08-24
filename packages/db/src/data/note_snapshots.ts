import { createHash } from "node:crypto";
import { brotliCompressSync, brotliDecompressSync } from "node:zlib";
import { and, asc, desc, eq, inArray, lt, ne, sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import type z from "zod";
import { db } from "..";
import { noteSnapshots, notes, workspace } from "../schema/app";
import { getNotesMeta, updateContentState } from "./notes";
import { decrementUserStorage, incrementUserStorage } from "./user_quota";

export const selectNoteSnapshotSchema = createSelectSchema(noteSnapshots);
export const selectNoteSnapshotMetaSchema = selectNoteSnapshotSchema.omit({
	contentCompressed: true,
});
export const insertNoteSnapshotSchema = createInsertSchema(noteSnapshots);

export type NoteSnapshot = z.infer<typeof selectNoteSnapshotSchema>;
export type NoteSnapshotMeta = z.infer<typeof selectNoteSnapshotMetaSchema>;
export type InsertNoteSnapshot = z.infer<typeof insertNoteSnapshotSchema>;

export interface WorkspaceSnapshotItem extends NoteSnapshotMeta {
	noteName: string;
	noteIcon: string | null;
	workspaceId?: string;
	workspaceName?: string;
}

export interface GetWorkspaceSnapshotsOptions {
	userId?: string;
	noteId?: string;
	kind?: "auto" | "manual" | "pinned";
	search?: string;
	limit?: number;
	offset?: number;
	sortBy?: "createdAt" | "name" | "size";
	sortOrder?: "asc" | "desc";
}

/**
 * Get snapshots for a workspace (or user) with joined note and workspace details, sorting, filtering, and pagination.
 */
export const getSnapshotsForWorkspace = async (
	workspaceId?: string,
	options: GetWorkspaceSnapshotsOptions = {},
): Promise<{ items: WorkspaceSnapshotItem[]; total: number }> => {
	const {
		userId,
		noteId,
		kind,
		search,
		limit = 20,
		offset = 0,
		sortBy = "createdAt",
		sortOrder = "desc",
	} = options;

	const conditions = [
		workspaceId
			? eq(notes.workspaceId, workspaceId)
			: userId
				? eq(workspace.ownerId, userId)
				: undefined,
		noteId ? eq(noteSnapshots.noteId, noteId) : undefined,
		kind ? eq(noteSnapshots.kind, kind) : undefined,
		search
			? sql`(${notes.name} ILIKE ${`%${search}%`} OR ${noteSnapshots.label} ILIKE ${`%${search}%`})`
			: undefined,
	].filter((c): c is NonNullable<typeof c> => c !== undefined);

	const whereClause = and(...conditions);

	const [countResult] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(noteSnapshots)
		.innerJoin(notes, eq(noteSnapshots.noteId, notes.id))
		.innerJoin(workspace, eq(notes.workspaceId, workspace.id))
		.where(whereClause);

	const total = countResult?.count ?? 0;

	let orderClause = desc(noteSnapshots.createdAt);
	if (sortBy === "name") {
		orderClause = sortOrder === "asc" ? asc(notes.name) : desc(notes.name);
	} else if (sortBy === "size") {
		orderClause =
			sortOrder === "asc" ? asc(noteSnapshots.size) : desc(noteSnapshots.size);
	} else {
		orderClause =
			sortOrder === "asc"
				? asc(noteSnapshots.createdAt)
				: desc(noteSnapshots.createdAt);
	}

	const rows = await db
		.select({
			id: noteSnapshots.id,
			noteId: noteSnapshots.noteId,
			createdBy: noteSnapshots.createdBy,
			label: noteSnapshots.label,
			kind: noteSnapshots.kind,
			contentHash: noteSnapshots.contentHash,
			size: noteSnapshots.size,
			createdAt: noteSnapshots.createdAt,
			noteName: notes.name,
			noteIcon: notes.icon,
			workspaceId: notes.workspaceId,
			workspaceName: workspace.name,
		})
		.from(noteSnapshots)
		.innerJoin(notes, eq(noteSnapshots.noteId, notes.id))
		.innerJoin(workspace, eq(notes.workspaceId, workspace.id))
		.where(whereClause)
		.orderBy(orderClause)
		.limit(limit)
		.offset(offset);

	return {
		items: rows.map((r) => ({
			...selectNoteSnapshotMetaSchema.parse(r),
			noteName: r.noteName,
			noteIcon: r.noteIcon,
			workspaceId: r.workspaceId,
			workspaceName: r.workspaceName,
		})),
		total,
	};
};

/**
 * Get snapshot metadata by ID.
 */
export const getSnapshotById = async (
	id: string,
): Promise<NoteSnapshotMeta | null> => {
	const [data] = await db
		.select({
			id: noteSnapshots.id,
			noteId: noteSnapshots.noteId,
			createdBy: noteSnapshots.createdBy,
			label: noteSnapshots.label,
			kind: noteSnapshots.kind,
			contentHash: noteSnapshots.contentHash,
			size: noteSnapshots.size,
			createdAt: noteSnapshots.createdAt,
		})
		.from(noteSnapshots)
		.where(eq(noteSnapshots.id, id))
		.limit(1);

	return data ? selectNoteSnapshotMetaSchema.parse(data) : null;
};

/**
 * Get uncompressed snapshot Yjs binary content.
 */
export const getSnapshotContent = async (id: string): Promise<Buffer> => {
	const [data] = await db
		.select({ contentCompressed: noteSnapshots.contentCompressed })
		.from(noteSnapshots)
		.where(eq(noteSnapshots.id, id))
		.limit(1);

	if (!data?.contentCompressed) {
		throw new Error(`Snapshot with id ${id} not found`);
	}

	return brotliDecompressSync(data.contentCompressed);
};

/**
 * Clean up old / excess non-manual snapshots for a note.
 * Retains at most maxAutoCount (e.g. 49 before inserting, to stay <= 50)
 * and removes any created > 90 days ago.
 */
export const cleanupOldAutoSnapshots = async (
	noteId: string,
	ownerId: string,
	maxAutoCount = 49,
): Promise<number> => {
	const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

	// 1. Find non-manual snapshots older than 90 days
	const expired = await db
		.select({ id: noteSnapshots.id, size: noteSnapshots.size })
		.from(noteSnapshots)
		.where(
			and(
				eq(noteSnapshots.noteId, noteId),
				ne(noteSnapshots.kind, "manual"),
				ne(noteSnapshots.kind, "pinned"),
				lt(noteSnapshots.createdAt, ninetyDaysAgo),
			),
		);

	const expiredIds = new Set(expired.map((s) => s.id));
	let totalFreedBytes = expired.reduce((acc, s) => acc + s.size, 0);

	// 2. Find excess non-manual snapshots beyond max count
	const excess = await db
		.select({ id: noteSnapshots.id, size: noteSnapshots.size })
		.from(noteSnapshots)
		.where(
			and(
				eq(noteSnapshots.noteId, noteId),
				ne(noteSnapshots.kind, "manual"),
				ne(noteSnapshots.kind, "pinned"),
			),
		)
		.orderBy(desc(noteSnapshots.createdAt))
		.limit(1000)
		.offset(maxAutoCount);

	for (const item of excess) {
		if (!expiredIds.has(item.id)) {
			expiredIds.add(item.id);
			totalFreedBytes += item.size;
		}
	}

	if (expiredIds.size > 0) {
		await db
			.delete(noteSnapshots)
			.where(inArray(noteSnapshots.id, Array.from(expiredIds)));

		if (totalFreedBytes > 0) {
			await decrementUserStorage(ownerId, totalFreedBytes).catch(console.error);
		}
	}

	return totalFreedBytes;
};

/**
 * Periodically create an auto snapshot for a cloud note:
 * - Checks if content changed (via sha256 hash)
 * - Checks if last auto snapshot was at least 10 minutes ago
 * - Enforces 90 days expiration and 50 max auto snapshots limit
 * - Increments owner storage quota
 */
export const mayCreateAutoCloudSnapshot = async (
	noteId: string,
	yjsState: Buffer,
	customHash?: string,
): Promise<NoteSnapshotMeta | null> => {
	const note = await getNotesMeta(noteId);
	if (!note) return null;

	const contentHash =
		customHash ?? createHash("sha256").update(yjsState).digest("hex");

	const now = new Date();

	// Check latest auto snapshot
	const latestAuto = await db
		.select({
			createdAt: noteSnapshots.createdAt,
			contentHash: noteSnapshots.contentHash,
		})
		.from(noteSnapshots)
		.where(
			and(eq(noteSnapshots.noteId, noteId), eq(noteSnapshots.kind, "auto")),
		)
		.orderBy(desc(noteSnapshots.createdAt))
		.limit(1);

	if (latestAuto.length > 0) {
		const last = latestAuto[0];
		if (!last) return null;

		// 1. Skip if content hasn't changed
		if (last.contentHash === contentHash) {
			return null;
		}

		// 2. Skip if taken less than 10 minutes ago
		const timeSinceLast = now.getTime() - last.createdAt.getTime();
		if (timeSinceLast < 10 * 60 * 1000) {
			return null;
		}
	}

	// 3. Clean up old auto snapshots before inserting
	await cleanupOldAutoSnapshots(noteId, note.ownerId, 49);

	// 4. Compress content
	const contentCompressed = brotliCompressSync(yjsState);
	const size = contentCompressed.byteLength;

	// 5. Update quota for owner
	try {
		await incrementUserStorage(note.ownerId, size);
	} catch (quotaError) {
		console.warn(
			`[Snapshot] Storage quota exceeded for user ${note.ownerId}:`,
			quotaError,
		);
		return null;
	}

	// 6. Insert snapshot
	const [result] = await db
		.insert(noteSnapshots)
		.values({
			noteId,
			createdBy: null,
			label: "Auto Snapshot",
			kind: "auto",
			contentCompressed,
			contentHash,
			size,
			createdAt: now,
		})
		.returning({
			id: noteSnapshots.id,
			noteId: noteSnapshots.noteId,
			createdBy: noteSnapshots.createdBy,
			label: noteSnapshots.label,
			kind: noteSnapshots.kind,
			contentHash: noteSnapshots.contentHash,
			size: noteSnapshots.size,
			createdAt: noteSnapshots.createdAt,
		});

	return result ? selectNoteSnapshotMetaSchema.parse(result) : null;
};

/**
 * Manually create a snapshot for a note with custom label.
 * Always charged to the note owner.
 */
export const createCloudSnapshot = async (input: {
	noteId: string;
	userId: string;
	label?: string;
	kind?: "auto" | "manual" | "pinned";
	yjsState?: Buffer;
}): Promise<NoteSnapshotMeta> => {
	const note = await getNotesMeta(input.noteId);
	if (!note) throw new Error("Note not found");

	let yjsState = input.yjsState;
	if (!yjsState) {
		const [rawNote] = await db
			.select({ content: notes.content })
			.from(notes)
			.where(eq(notes.id, input.noteId))
			.limit(1);

		if (!rawNote?.content) {
			throw new Error("Note content is empty or not found");
		}
		yjsState = rawNote.content;
	}

	const contentHash = createHash("sha256").update(yjsState).digest("hex");
	const contentCompressed = brotliCompressSync(yjsState);
	const size = contentCompressed.byteLength;

	// Charge storage to note owner
	await incrementUserStorage(note.ownerId, size);

	const [result] = await db
		.insert(noteSnapshots)
		.values({
			noteId: input.noteId,
			createdBy: input.userId,
			label: input.label ?? "Manual Snapshot",
			kind: input.kind ?? "manual",
			contentCompressed,
			contentHash,
			size,
			createdAt: new Date(),
		})
		.returning({
			id: noteSnapshots.id,
			noteId: noteSnapshots.noteId,
			createdBy: noteSnapshots.createdBy,
			label: noteSnapshots.label,
			kind: noteSnapshots.kind,
			contentHash: noteSnapshots.contentHash,
			size: noteSnapshots.size,
			createdAt: noteSnapshots.createdAt,
		});

	if (!result) throw new Error("Failed to create snapshot");
	return selectNoteSnapshotMetaSchema.parse(result);
};

/**
 * Delete a cloud snapshot and release storage quota back to the note owner.
 */
export const deleteCloudSnapshot = async (id: string): Promise<boolean> => {
	const [snapshot] = await db
		.select({
			id: noteSnapshots.id,
			size: noteSnapshots.size,
			noteId: noteSnapshots.noteId,
		})
		.from(noteSnapshots)
		.where(eq(noteSnapshots.id, id))
		.limit(1);

	if (!snapshot) return false;

	const note = await getNotesMeta(snapshot.noteId);

	await db.delete(noteSnapshots).where(eq(noteSnapshots.id, id));

	if (note?.ownerId && snapshot.size > 0) {
		await decrementUserStorage(note.ownerId, snapshot.size).catch(
			console.error,
		);
	}

	return true;
};

/**
 * Restore a cloud note to a snapshot:
 * 1. Creates an auto-restore snapshot of the current state before replacing.
 * 2. Replaces note content in DB with the snapshot's Yjs update.
 */
export const restoreCloudSnapshot = async (
	snapshotId: string,
	userId: string,
): Promise<{ success: boolean; autoRestorePointId?: string }> => {
	const snapshot = await getSnapshotById(snapshotId);
	if (!snapshot) throw new Error("Snapshot not found");

	const note = await getNotesMeta(snapshot.noteId);
	if (!note) throw new Error("Note not found");

	// 1. Get current content and create auto-restore point
	const [current] = await db
		.select({ content: notes.content })
		.from(notes)
		.where(eq(notes.id, note.id))
		.limit(1);

	let autoRestorePointId: string | undefined;

	if (current?.content) {
		try {
			const formattedDate = snapshot.createdAt.toLocaleDateString(undefined, {
				month: "short",
				day: "numeric",
				hour: "numeric",
				minute: "numeric",
			});
			const restorePoint = await createCloudSnapshot({
				noteId: note.id,
				userId,
				label: `Auto-saved before restoring snapshot from ${formattedDate}`,
				kind: "auto",
				yjsState: current.content,
			});
			autoRestorePointId = restorePoint.id;
		} catch (e) {
			console.warn("Failed to create auto-restore point before restore:", e);
		}
	}

	// 2. Fetch decompressed snapshot content
	const restoredYjsBuffer = await getSnapshotContent(snapshotId);

	// 3. Update note content
	await updateContentState(note.id, restoredYjsBuffer);

	return { success: true, autoRestorePointId };
};
