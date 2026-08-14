import { db } from "../db";
import { notesSnapshot } from "../schema/index.js";
import { createSelectSchema, createInsertSchema } from "drizzle-orm/zod";
import type z from "zod";
import { eq, desc, and, inArray } from "drizzle-orm";

export const selectSnapshotSchema = createSelectSchema(notesSnapshot);
export const selectSnapshotMetaSchema = selectSnapshotSchema.omit({
  contentCompressed: true,
});
export const insertSnapshotSchema = createInsertSchema(notesSnapshot);

export type NoteSnapshotMeta = z.infer<typeof selectSnapshotMetaSchema>;
export type InsertNoteSnapshot = z.infer<typeof insertSnapshotSchema>;

/**
 * Gets a paginated list of all snapshot metadata for a specific note.
 * Returns snapshots ordered by newest first.
 * 
 * @param noteId The ID of the note
 * @param limit Maximum number of snapshots to return (default: 20)
 * @param offset Number of snapshots to skip (default: 0)
 */
export async function getSnapshots(
  noteId: string,
  limit: number = 20,
  offset: number = 0
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
 * Creates a new snapshot for a note.
 * 
 * @param input The snapshot data to insert
 */
export async function createSnapshot(
  input: Omit<InsertNoteSnapshot, "createdAt"> & { createdAt?: Date }
): Promise<NoteSnapshotMeta> {
  try {
    const insertData = insertSnapshotSchema.parse({
      ...input,
      createdAt: input.createdAt ?? new Date(),
    });
    const result = await db
      .insert(notesSnapshot)
      .values(insertData)
      .returning({
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
 * Conditionally creates an 'auto' snapshot based on time and count thresholds.
 * 
 * 1. Skips creation if the last 'auto' snapshot was taken within the last 10 minutes.
 * 2. If created, ensures that there are at most 100 'auto' snapshots for the note,
 *    deleting any older ones beyond that limit.
 * 
 * @param input The snapshot data to insert (kind should be 'auto')
 * @returns The created snapshot metadata, or null if creation was skipped.
 */
export async function mayCreateSnapshot(
  input: Omit<InsertNoteSnapshot, 'kind' | 'createdAt'> & { kind?: 'auto', createdAt?: Date }
): Promise<NoteSnapshotMeta | null> {
  try {
    const noteId = input.noteId;
    const now = input.createdAt ?? new Date();

    // 1. Check time threshold (10 minutes = 600,000 ms)
    const latestAuto = await db
      .select({ createdAt: notesSnapshot.createdAt })
      .from(notesSnapshot)
      .where(
        and(
          eq(notesSnapshot.noteId, noteId),
          eq(notesSnapshot.kind, 'auto')
        )
      )
      .orderBy(desc(notesSnapshot.createdAt))
      .limit(1);

    if (latestAuto.length > 0) {
      const timeSinceLast = now.getTime() - latestAuto[0]!.createdAt.getTime();
      if (timeSinceLast < 10 * 60 * 1000) {
        return null; // Skip if less than 10 minutes
      }
    }

    // 2. Create the snapshot
    const created = await createSnapshot({
      ...input,
      kind: 'auto',
      createdAt: now,
    });

    // 3. Enforce max limit of 100 auto snapshots
    const MAX_AUTO_SNAPSHOTS = 100;
    
    // Find the IDs of snapshots beyond the limit
    const excessSnapshots = await db
      .select({ id: notesSnapshot.id })
      .from(notesSnapshot)
      .where(
        and(
          eq(notesSnapshot.noteId, noteId),
          eq(notesSnapshot.kind, 'auto')
        )
      )
      .orderBy(desc(notesSnapshot.createdAt))
      .limit(1000) // SQLite requires LIMIT when using OFFSET
      .offset(MAX_AUTO_SNAPSHOTS);

    if (excessSnapshots.length > 0) {
      const idsToDelete = excessSnapshots.map(s => s.id);
      
      // In SQLite, limits on IN clauses depend on build, but 
      // usually 100s is safe. If many, chunk them. Here it's typical 1.
      await db
        .delete(notesSnapshot)
        .where(inArray(notesSnapshot.id, idsToDelete));
    }

    return created;
  } catch (error) {
    console.error("Failed in mayCreateSnapshot:", error);
    throw new Error("Failed to conditionally create snapshot");
  }
}

/**
 * Gets the raw compressed content of a specific snapshot.
 * 
 * @param id The ID of the snapshot
 * @returns The compressed content buffer
 */
export async function getSnapshotContent(
  id: string
): Promise<Buffer | Uint8Array> {
  try {
    const result = await db
      .select({ contentCompressed: notesSnapshot.contentCompressed })
      .from(notesSnapshot)
      .where(eq(notesSnapshot.id, id))
      .limit(1);

    if (result.length === 0) {
      throw new Error(`Snapshot with id ${id} not found`);
    }

    return result[0]!.contentCompressed as Buffer | Uint8Array;
  } catch (error) {
    console.error("Failed to get snapshot content:", error);
    throw new Error("Failed to get snapshot content");
  }
}
