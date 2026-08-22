import { and, eq, sql } from "drizzle-orm";
import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-orm/zod";
import { db, type GuestRole } from "..";
import { noteGuests, notes, workspace } from "../schema/app";
import { user } from "../schema/auth";
import { getNoteUserPermission } from "./permissions";

export const selectNoteGuestSchema = createSelectSchema(noteGuests);
export const insertNoteGuestSchema = createInsertSchema(noteGuests);
export const updateNoteGuestSchema = createUpdateSchema(noteGuests);

export interface NoteGuestUser {
	id: string;
	noteId: string;
	userId: string;
	role: GuestRole;
	createdAt: Date;
	invitedBy: string;
	user: {
		id: string;
		name: string;
		email: string;
		image: string | null;
	};
}

export interface NoteOwnerUser {
	id: string;
	name: string;
	email: string;
	image: string | null;
}

export interface NoteGuestsResponse {
	owner: NoteOwnerUser | null;
	guests: NoteGuestUser[];
}

/**
 * Checks whether an actor has admin/owner privileges on a note to manage guests.
 */
export const canManageGuests = async (
	noteId: string,
	actorUserId: string,
): Promise<boolean> => {
	const perm = await getNoteUserPermission(noteId, actorUserId);
	if (!perm) return false;
	return perm.isOwner || perm.role === "admin";
};

/**
 * Retrieves the owner and all guests associated with a note.
 */
export const getNoteGuests = async (
	noteId: string,
): Promise<NoteGuestsResponse> => {
	const [noteData] = await db
		.select({
			ownerId: sql<string>`COALESCE(${notes.ownerId}, ${workspace.ownerId})`,
			ownerName: user.name,
			ownerEmail: user.email,
			ownerImage: user.image,
		})
		.from(notes)
		.leftJoin(workspace, eq(workspace.id, notes.workspaceId))
		.leftJoin(
			user,
			eq(user.id, sql`COALESCE(${notes.ownerId}, ${workspace.ownerId})`),
		)
		.where(eq(notes.id, noteId))
		.limit(1);

	const owner: NoteOwnerUser | null = noteData?.ownerId
		? {
				id: noteData.ownerId,
				name: noteData.ownerName ?? "Owner",
				email: noteData.ownerEmail ?? "",
				image: noteData.ownerImage ?? null,
			}
		: null;

	const guestRows = await db
		.select({
			id: noteGuests.id,
			noteId: noteGuests.noteId,
			userId: noteGuests.userId,
			role: noteGuests.role,
			createdAt: noteGuests.createdAt,
			invitedBy: noteGuests.invitedBy,
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				image: user.image,
			},
		})
		.from(noteGuests)
		.innerJoin(user, eq(user.id, noteGuests.userId))
		.where(eq(noteGuests.noteId, noteId))
		.orderBy(noteGuests.createdAt);

	return {
		owner,
		guests: guestRows,
	};
};

/**
 * Adds or updates a guest on a note by email.
 * Only the note owner or note admin can add guests.
 */
export const addNoteGuest = async (input: {
	noteId: string;
	email: string;
	role: GuestRole;
	actorUserId: string;
}): Promise<NoteGuestUser> => {
	const canManage = await canManageGuests(input.noteId, input.actorUserId);
	if (!canManage) {
		throw new Error("Unauthorized: Only note owner or admin can add guests");
	}

	const normalizedEmail = input.email.toLowerCase().trim();

	const [targetUser] = await db
		.select({
			id: user.id,
			name: user.name,
			email: user.email,
			image: user.image,
		})
		.from(user)
		.where(eq(user.email, normalizedEmail))
		.limit(1);

	if (!targetUser) {
		throw new Error("User with this email not found");
	}

	if (targetUser.id === input.actorUserId) {
		throw new Error("Cannot add yourself as a guest");
	}

	const [note] = await db
		.select({
			ownerId: sql<string>`COALESCE(${notes.ownerId}, ${workspace.ownerId})`,
		})
		.from(notes)
		.leftJoin(workspace, eq(workspace.id, notes.workspaceId))
		.where(eq(notes.id, input.noteId))
		.limit(1);

	if (!note) {
		throw new Error("Note not found");
	}

	if (note.ownerId === targetUser.id) {
		throw new Error("User is already the note owner");
	}

	const [inserted] = await db
		.insert(noteGuests)
		.values({
			noteId: input.noteId,
			userId: targetUser.id,
			role: input.role,
			invitedBy: input.actorUserId,
		})
		.onConflictDoUpdate({
			target: [noteGuests.noteId, noteGuests.userId],
			set: {
				role: input.role,
				invitedBy: input.actorUserId,
			},
		})
		.returning();

	if (!inserted) {
		throw new Error("Failed to add or update note guest");
	}

	return {
		id: inserted.id,
		noteId: inserted.noteId,
		userId: inserted.userId,
		role: inserted.role,
		createdAt: inserted.createdAt,
		invitedBy: inserted.invitedBy,
		user: targetUser,
	};
};

/**
 * Updates a guest's role on a note.
 * Only the note owner or note admin can update guests. They cannot update themselves.
 */
export const updateNoteGuest = async (input: {
	noteId: string;
	userId: string;
	role: GuestRole;
	actorUserId: string;
}): Promise<NoteGuestUser> => {
	if (input.actorUserId === input.userId) {
		throw new Error("Cannot modify your own guest role");
	}

	const canManage = await canManageGuests(input.noteId, input.actorUserId);
	if (!canManage) {
		throw new Error("Unauthorized: Only note owner or admin can update guests");
	}

	const [note] = await db
		.select({
			ownerId: sql<string>`COALESCE(${notes.ownerId}, ${workspace.ownerId})`,
		})
		.from(notes)
		.leftJoin(workspace, eq(workspace.id, notes.workspaceId))
		.where(eq(notes.id, input.noteId))
		.limit(1);

	if (!note) {
		throw new Error("Note not found");
	}

	if (note.ownerId === input.userId) {
		throw new Error("Cannot modify note owner role");
	}

	const [targetUser] = await db
		.select({
			id: user.id,
			name: user.name,
			email: user.email,
			image: user.image,
		})
		.from(user)
		.where(eq(user.id, input.userId))
		.limit(1);

	if (!targetUser) {
		throw new Error("User not found");
	}

	const [updated] = await db
		.update(noteGuests)
		.set({ role: input.role })
		.where(
			and(
				eq(noteGuests.noteId, input.noteId),
				eq(noteGuests.userId, input.userId),
			),
		)
		.returning();

	if (!updated) {
		throw new Error("Guest not found on this note");
	}

	return {
		id: updated.id,
		noteId: updated.noteId,
		userId: updated.userId,
		role: updated.role,
		createdAt: updated.createdAt,
		invitedBy: updated.invitedBy,
		user: targetUser,
	};
};

/**
 * Removes a guest from a note.
 * Only the note owner or note admin can remove guests. They cannot remove themselves.
 */
export const removeNoteGuest = async (input: {
	noteId: string;
	userId: string;
	actorUserId: string;
}): Promise<{ id: string; noteId: string; userId: string }> => {
	if (input.actorUserId === input.userId) {
		throw new Error("Cannot remove yourself as a guest");
	}

	const canManage = await canManageGuests(input.noteId, input.actorUserId);
	if (!canManage) {
		throw new Error("Unauthorized: Only note owner or admin can remove guests");
	}

	const [deleted] = await db
		.delete(noteGuests)
		.where(
			and(
				eq(noteGuests.noteId, input.noteId),
				eq(noteGuests.userId, input.userId),
			),
		)
		.returning({
			id: noteGuests.id,
			noteId: noteGuests.noteId,
			userId: noteGuests.userId,
		});

	if (!deleted) {
		throw new Error("Guest not found on this note");
	}

	return deleted;
};
