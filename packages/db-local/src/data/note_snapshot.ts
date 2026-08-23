import { and, asc, desc, eq, inArray, lt, ne, sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { db } from "../db";
import { notes, notesSnapshot } from "../schema/index.js";

export const selectSnapshotSchema = createSelectSchema(notesSnapshot, {
	contentCompressed: z.union([z.instanceof(Uint8Array), z.any()]),
});
export const selectSnapshotMetaSchema = selectSnapshotSchema.omit({
	contentCompressed: true,
});
export const insertSnapshotSchema = createInsertSchema(notesSnapshot, {
	contentCompressed: z.union([z.instanceof(Uint8Array), z.any()]),
});

export type NoteSnapshotMeta = z.infer<typeof selectSnapshotMetaSchema>;
export type InsertNoteSnapshot = z.infer<typeof insertSnapshotSchema>;

export interface LocalWorkspaceSnapshotItem extends NoteSnapshotMeta {
	noteName: string;
	noteIcon: string | null;
}

export interface GetLocalWorkspaceSnapshotsOptions {
	noteId?: string;
	kind?: "auto" | "manual" | "pinned";
	search?: string;
	limit?: number;
	offset?: number;
	sortBy?: "createdAt" | "name" | "size";
	sortOrder?: "asc" | "desc";
}

/**
 * Gets a paginated list of all snapshot metadata for a specific note.
 * Returns snapshots ordered by newest first.
 */
export async function getSnapshots(
	noteId: string,
	limit: number = 20,
	offset: number = 0,
): Promise<NoteSnapshotMeta[]> {
	try {
		const data = await db
			.select({
				id: notesSnapshot.id,
				noteId: notesSnapshot.noteId,
				label: notesSnapshot.label,
				kind: notesSnapshot.kind,
				contentHash: notesSnapshot.contentHash,
				size: notesSnapshot.size,
				createdAt: notesSnapshot.createdAt,
			})
			.from(notesSnapshot)
			.where(eq(notesSnapshot.noteId, noteId))
			.orderBy(desc(notesSnapshot.createdAt))
			.limit(limit)
			.offset(offset);

		return selectSnapshotMetaSchema.array().parse(data);
	} catch (error) {
		console.error("Failed to get snapshots:", error);
		throw new Error("Failed to get snapshots");
	}
}

/**
 * Gets snapshots for all notes in a local workspace with joined note details.
 */
export async function getWorkspaceSnapshots(
	workspaceId: string,
	options: GetLocalWorkspaceSnapshotsOptions = {},
): Promise<{ items: LocalWorkspaceSnapshotItem[]; total: number }> {
	try {
		const {
			noteId,
			kind,
			search,
			limit = 20,
			offset = 0,
			sortBy = "createdAt",
			sortOrder = "desc",
		} = options;

		const conditions = [
			eq(notes.workspaceId, workspaceId),
			noteId ? eq(notesSnapshot.noteId, noteId) : undefined,
			kind ? eq(notesSnapshot.kind, kind) : undefined,
			search
				? sql`(${notes.name} LIKE ${`%${search}%`} OR ${notesSnapshot.label} LIKE ${`%${search}%`})`
				: undefined,
		].filter((c): c is NonNullable<typeof c> => c !== undefined);

		const whereClause = and(...conditions);

		const [countResult] = await db
			.select({ count: sql<number>`count(*)` })
			.from(notesSnapshot)
			.innerJoin(notes, eq(notesSnapshot.noteId, notes.id))
			.where(whereClause);

		const total = countResult?.count ?? 0;

		let orderClause = desc(notesSnapshot.createdAt);
		if (sortBy === "name") {
			orderClause = sortOrder === "asc" ? asc(notes.name) : desc(notes.name);
		} else if (sortBy === "size") {
			orderClause =
				sortOrder === "asc"
					? asc(notesSnapshot.size)
					: desc(notesSnapshot.size);
		} else {
			orderClause =
				sortOrder === "asc"
					? asc(notesSnapshot.createdAt)
					: desc(notesSnapshot.createdAt);
		}

		const rows = await db
			.select({
				id: notesSnapshot.id,
				noteId: notesSnapshot.noteId,
				label: notesSnapshot.label,
				kind: notesSnapshot.kind,
				contentHash: notesSnapshot.contentHash,
				size: notesSnapshot.size,
				createdAt: notesSnapshot.createdAt,
				noteName: notes.name,
				noteIcon: notes.icon,
			})
			.from(notesSnapshot)
			.innerJoin(notes, eq(notesSnapshot.noteId, notes.id))
			.where(whereClause)
			.orderBy(orderClause)
			.limit(limit)
			.offset(offset);

		return {
			items: rows.map((r) => ({
				...selectSnapshotMetaSchema.parse(r),
				noteName: r.noteName,
				noteIcon: r.noteIcon,
			})),
			total,
		};
	} catch (error) {
		console.error("Failed to get workspace snapshots:", error);
		throw new Error("Failed to get workspace snapshots");
	}
}

/**
 * Creates a new snapshot for a note.
 */
export async function createSnapshot(
	input: Omit<InsertNoteSnapshot, "createdAt"> & { createdAt?: Date },
): Promise<NoteSnapshotMeta> {
	try {
		const insertData = insertSnapshotSchema.parse({
			...input,
			createdAt: input.createdAt ?? new Date(),
		});
		const result = await db.insert(notesSnapshot).values(insertData).returning({
			id: notesSnapshot.id,
			noteId: notesSnapshot.noteId,
			label: notesSnapshot.label,
			kind: notesSnapshot.kind,
			contentHash: notesSnapshot.contentHash,
			size: notesSnapshot.size,
			createdAt: notesSnapshot.createdAt,
		});

		return selectSnapshotMetaSchema.parse(result[0]);
	} catch (error) {
		console.error("Failed to create snapshot:", error);
		throw new Error("Failed to create snapshot");
	}
}

/**
 * Conditionally creates an 'auto' snapshot based on time and count thresholds:
 * 1. Skips creation if the content hash matches the last auto snapshot.
 * 2. Skips creation if the last auto snapshot was taken within the last 10 minutes.
 * 3. Cleans up non-manual snapshots older than 90 days.
 * 4. Ensures at most 50 non-manual snapshots per note (retaining newest 49 before insert).
 */
export async function mayCreateSnapshot(
	input: Omit<InsertNoteSnapshot, "kind" | "createdAt"> & {
		kind?: "auto";
		createdAt?: Date;
	},
): Promise<NoteSnapshotMeta | null> {
	try {
		const noteId = input.noteId;
		const now = input.createdAt ?? new Date();

		// 1. Check previous auto snapshot
		const latestAuto = await db
			.select({
				createdAt: notesSnapshot.createdAt,
				contentHash: notesSnapshot.contentHash,
			})
			.from(notesSnapshot)
			.where(
				and(eq(notesSnapshot.noteId, noteId), eq(notesSnapshot.kind, "auto")),
			)
			.orderBy(desc(notesSnapshot.createdAt))
			.limit(1);

		if (latestAuto.length > 0) {
			const last = latestAuto[0];
			if (!last) return null;

			// Skip if content has not changed
			if (last.contentHash === input.contentHash) {
				return null;
			}

			// Skip if less than 10 minutes (600,000 ms)
			const timeSinceLast = now.getTime() - last.createdAt.getTime();
			if (timeSinceLast < 10 * 60 * 1000) {
				return null;
			}
		}

		// 2. Clean up non-manual snapshots older than 90 days
		const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
		await db
			.delete(notesSnapshot)
			.where(
				and(
					eq(notesSnapshot.noteId, noteId),
					ne(notesSnapshot.kind, "manual"),
					ne(notesSnapshot.kind, "pinned"),
					lt(notesSnapshot.createdAt, ninetyDaysAgo),
				),
			);

		// 3. Enforce max limit of 50 non-manual snapshots (clean up excess beyond 49)
		const MAX_AUTO_RETAIN = 49;
		const excessSnapshots = await db
			.select({ id: notesSnapshot.id })
			.from(notesSnapshot)
			.where(
				and(
					eq(notesSnapshot.noteId, noteId),
					ne(notesSnapshot.kind, "manual"),
					ne(notesSnapshot.kind, "pinned"),
				),
			)
			.orderBy(desc(notesSnapshot.createdAt))
			.limit(1000)
			.offset(MAX_AUTO_RETAIN);

		if (excessSnapshots.length > 0) {
			const idsToDelete = excessSnapshots.map((s) => s.id);
			await db
				.delete(notesSnapshot)
				.where(inArray(notesSnapshot.id, idsToDelete));
		}

		// 4. Create the snapshot
		const created = await createSnapshot({
			...input,
			kind: "auto",
			createdAt: now,
		});

		return created;
	} catch (error) {
		console.error("Failed in mayCreateSnapshot:", error);
		throw new Error("Failed to conditionally create snapshot");
	}
}

/**
 * Gets the raw compressed content of a specific snapshot.
 */
export async function getSnapshotContent(id: string): Promise<Uint8Array> {
	try {
		const result = await db
			.select({ contentCompressed: notesSnapshot.contentCompressed })
			.from(notesSnapshot)
			.where(eq(notesSnapshot.id, id))
			.limit(1);

		const row = result[0];
		if (!row) {
			throw new Error(`Snapshot with id ${id} not found`);
		}

		return row.contentCompressed as unknown as Uint8Array;
	} catch (error) {
		console.error("Failed to get snapshot content:", error);
		throw new Error("Failed to get snapshot content");
	}
}

/**
 * Deletes a local snapshot.
 */
export async function deleteSnapshot(id: string): Promise<boolean> {
	try {
		const result = await db
			.delete(notesSnapshot)
			.where(eq(notesSnapshot.id, id))
			.returning({ id: notesSnapshot.id });

		return result.length > 0;
	} catch (error) {
		console.error("Failed to delete snapshot:", error);
		throw new Error("Failed to delete snapshot");
	}
}
