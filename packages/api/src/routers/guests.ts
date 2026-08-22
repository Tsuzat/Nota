import {
	deleteCachedNoteGuests,
	getCachedNoteGuests,
	setCachedNoteGuests,
} from "@nota/cache/guests";
import { deleteCachedCollabNotes } from "@nota/cache/notes";
import {
	getCachedNoteUserPermission,
	invalidateNoteUserPermission,
	setCachedNoteUserPermission,
} from "@nota/cache/permissions";
import {
	addNoteGuest,
	getNoteGuests,
	removeNoteGuest,
	updateNoteGuest,
} from "@nota/db/data/guests";
import { getNoteUserPermission } from "@nota/db/data/permissions";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../index";

const guestRoleSchema = z.enum(["viewer", "comment", "editor", "admin"]);

const resolvePermission = async (noteId: string, userId: string) => {
	let perm = await getCachedNoteUserPermission(noteId, userId);
	if (!perm) {
		perm = await getNoteUserPermission(noteId, userId);
		if (perm) {
			void setCachedNoteUserPermission(noteId, userId, perm).catch(
				console.error,
			);
		}
	}
	return perm;
};

export const guestsRouter = {
	list: protectedProcedure
		.input(z.object({ noteId: z.string() }))
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const perm = await resolvePermission(input.noteId, userId);

			if (!perm) {
				throw new ORPCError("NOT_FOUND", { message: "Note not found" });
			}

			if (!perm.isOwner && !perm.role) {
				throw new ORPCError("UNAUTHORIZED", {
					message: "You do not have access to this note",
				});
			}

			const cached = await getCachedNoteGuests(input.noteId);
			if (cached?.owner) return cached;

			const result = await getNoteGuests(input.noteId);
			if (result.owner) {
				void setCachedNoteGuests(input.noteId, result).catch(console.error);
			}
			return result;
		}),

	add: protectedProcedure
		.input(
			z.object({
				noteId: z.string(),
				email: z.email(),
				role: guestRoleSchema,
			}),
		)
		.handler(async ({ context, input }) => {
			const actorUserId = context.session.user.id;

			try {
				const guest = await addNoteGuest({
					noteId: input.noteId,
					email: input.email,
					role: input.role,
					actorUserId,
				});

				// Invalidate note guests list, permission, and collab notes caches
				void deleteCachedNoteGuests(input.noteId).catch(console.error);
				void invalidateNoteUserPermission(input.noteId, guest.userId).catch(
					console.error,
				);
				void deleteCachedCollabNotes(guest.userId).catch(console.error);

				return guest;
			} catch (error: unknown) {
				const message =
					error instanceof Error ? error.message : "Failed to add guest";
				if (message.startsWith("Unauthorized")) {
					throw new ORPCError("UNAUTHORIZED", { message });
				}
				if (message.includes("not found")) {
					throw new ORPCError("NOT_FOUND", { message });
				}
				throw new ORPCError("BAD_REQUEST", { message });
			}
		}),

	updateRole: protectedProcedure
		.input(
			z.object({
				noteId: z.string(),
				userId: z.string(),
				role: guestRoleSchema,
			}),
		)
		.handler(async ({ context, input }) => {
			const actorUserId = context.session.user.id;

			try {
				const guest = await updateNoteGuest({
					noteId: input.noteId,
					userId: input.userId,
					role: input.role,
					actorUserId,
				});

				// Invalidate note guests list, permission, and collab notes caches
				void deleteCachedNoteGuests(input.noteId).catch(console.error);
				void invalidateNoteUserPermission(input.noteId, input.userId).catch(
					console.error,
				);
				void deleteCachedCollabNotes(input.userId).catch(console.error);

				return guest;
			} catch (error: unknown) {
				const message =
					error instanceof Error
						? error.message
						: "Failed to update guest role";
				if (message.startsWith("Unauthorized")) {
					throw new ORPCError("UNAUTHORIZED", { message });
				}
				if (message.includes("not found")) {
					throw new ORPCError("NOT_FOUND", { message });
				}
				throw new ORPCError("BAD_REQUEST", { message });
			}
		}),

	remove: protectedProcedure
		.input(
			z.object({
				noteId: z.string(),
				userId: z.string(),
			}),
		)
		.handler(async ({ context, input }) => {
			const actorUserId = context.session.user.id;

			try {
				const result = await removeNoteGuest({
					noteId: input.noteId,
					userId: input.userId,
					actorUserId,
				});

				// Invalidate note guests list, permission, and collab notes caches
				void deleteCachedNoteGuests(input.noteId).catch(console.error);
				void invalidateNoteUserPermission(input.noteId, input.userId).catch(
					console.error,
				);
				void deleteCachedCollabNotes(input.userId).catch(console.error);

				return result;
			} catch (error: unknown) {
				const message =
					error instanceof Error ? error.message : "Failed to remove guest";
				if (message.startsWith("Unauthorized")) {
					throw new ORPCError("UNAUTHORIZED", { message });
				}
				if (message.includes("not found")) {
					throw new ORPCError("NOT_FOUND", { message });
				}
				throw new ORPCError("BAD_REQUEST", { message });
			}
		}),
};
