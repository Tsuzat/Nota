import { and, eq, sql } from "drizzle-orm";
import { db, type GuestRole } from "..";
import { noteGuests, notes } from "../schema/app";

export interface NoteUserPermission {
	isOwner: boolean;
	role: GuestRole | null;
}

/**
 * Retrieves the user's permission for a specific note.
 * Returns null if the note does not exist.
 */
export const getNoteUserPermission = async (
	noteId: string,
	userId: string,
): Promise<NoteUserPermission | null> => {
	const [permission] = await db
		.select({
			isOwner: sql<boolean>`${notes.ownerId} = ${userId}`,
			role: noteGuests.role,
		})
		.from(notes)
		.leftJoin(
			noteGuests,
			and(eq(noteGuests.noteId, notes.id), eq(noteGuests.userId, userId)),
		)
		.where(eq(notes.id, noteId));

	return permission ?? null;
};
