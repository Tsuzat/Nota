import {
	deleteCachedNoteMeta,
	deleteCachedNotesByWorkspace,
	getCachedCollabNotes,
	getCachedNotesByWorkspace,
	invalidateNoteMetaCache,
	setCachedCollabNotes,
	setCachedNotesByWorkspace,
} from "@nota/cache/notes";
import {
	getCachedNoteUserPermission,
	invalidateNoteUserPermission,
	setCachedNoteUserPermission,
} from "@nota/cache/permissions";
import { isUserPro } from "@nota/cache/user_quota";
import {
	createNotes,
	deleteNotes,
	getCollabNotes,
	getContent,
	getNotesAncestorIds,
	getNotesByWorkspace,
	getNotesMeta,
	getUserNoteCount,
	insertNoteSchema,
	moveNotesSubtree,
	updateContent,
	updateNoteSchema,
	updateNotesMeta,
} from "@nota/db/data/notes";
import { getNoteUserPermission } from "@nota/db/data/permissions";
import { isWorkspaceOwner } from "@nota/db/data/workspace";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../index";
import { cleanupNoteStorage } from "../utils/storage-cleanup";

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

export const notesRouter = {
	getMeta: protectedProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const perm = await resolvePermission(input.id, userId);

			if (!perm) {
				throw new ORPCError("NOT_FOUND", { message: "Note not found" });
			}

			// If user has no permission (neither owner nor any guest role)
			if (!perm.isOwner && !perm.role) {
				throw new ORPCError("UNAUTHORIZED", {
					message: "You do not have access to this note",
				});
			}

			const meta = await getNotesMeta(input.id);
			if (!meta) throw new ORPCError("NOT_FOUND");
			return meta;
		}),

	create: protectedProcedure
		.input(insertNoteSchema.omit({ ownerId: true, id: true }))
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;

			const isOwner = await isWorkspaceOwner(input.workspaceId, userId);
			if (!isOwner) {
				throw new ORPCError("UNAUTHORIZED", {
					message: "You are not authorized to create notes in this workspace",
				});
			}

			const isPro = await isUserPro(userId);
			if (!isPro) {
				const count = await getUserNoteCount(userId);
				if (count >= 10) {
					throw new ORPCError("LIMIT_EXCEEDED", {
						message:
							"Free plan allows a maximum of 10 cloud notes. Please upgrade to Pro for unlimited notes.",
					});
				}
			}

			const note = await createNotes({
				...input,
				ownerId: userId,
			});

			// After creation, invalidate workspace list cache to reflect new note
			void invalidateNoteMetaCache(note.id, note.workspaceId).catch(
				console.error,
			);

			return note;
		}),

	updateMeta: protectedProcedure
		.input(updateNoteSchema.required({ id: true }))
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const perm = await resolvePermission(input.id, userId);

			if (!perm) {
				throw new ORPCError("NOT_FOUND", { message: "Note not found" });
			}

			if (!perm.isOwner && perm.role !== "editor" && perm.role !== "admin") {
				throw new ORPCError("UNAUTHORIZED", {
					message: "You are not authorized to update this note",
				});
			}

			const updated = await updateNotesMeta(input);
			if (!updated) throw new ORPCError("NOT_FOUND");

			// Invalidate specific note cache and parent workspace's notes cache
			void invalidateNoteMetaCache(updated.id, updated.workspaceId).catch(
				console.error,
			);
			return updated;
		}),

	move: protectedProcedure
		.input(
			z.object({
				noteId: z.string(),
				targetWorkspaceId: z.string(),
				targetParentId: z.string().nullable(),
				moveChildren: z.boolean(),
			}),
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;

			const perm = await resolvePermission(input.noteId, userId);
			if (!perm) {
				throw new ORPCError("NOT_FOUND", { message: "Note not found" });
			}
			if (!perm.isOwner) {
				throw new ORPCError("UNAUTHORIZED", {
					message: "Only the note owner can move it",
				});
			}

			const source = await getNotesMeta(input.noteId);
			if (!source) throw new ORPCError("NOT_FOUND");

			if (!(await isWorkspaceOwner(input.targetWorkspaceId, userId))) {
				throw new ORPCError("UNAUTHORIZED", {
					message: "You are not authorized to move notes into this workspace",
				});
			}

			if (input.targetParentId) {
				const parent = await getNotesMeta(input.targetParentId);
				if (!parent || parent.workspaceId !== input.targetWorkspaceId) {
					throw new ORPCError("NOT_FOUND", {
						message: "Target parent note not found",
					});
				}
				if (parent.id === input.noteId) {
					throw new ORPCError("BAD_REQUEST", {
						message: "Cannot move a note into itself",
					});
				}
				const ancestors = await getNotesAncestorIds(parent.id);
				if (ancestors.includes(input.noteId)) {
					throw new ORPCError("BAD_REQUEST", {
						message: "Cannot move a note into its own sub-note",
					});
				}
			}

			const result = await moveNotesSubtree(input);

			// Invalidate caches for both workspaces + every touched note.
			void deleteCachedNotesByWorkspace(result.sourceWorkspaceId, userId).catch(
				console.error,
			);
			void deleteCachedNotesByWorkspace(input.targetWorkspaceId, userId).catch(
				console.error,
			);
			for (const id of result.movedIds) {
				void deleteCachedNoteMeta(id).catch(console.error);
			}

			return result;
		}),

	updateContent: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				content: z.any(), // Assuming client passes buffer/Uint8Array depending on ORPC serialization
				contextText: z.string(),
			}),
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const perm = await resolvePermission(input.id, userId);

			if (!perm) {
				throw new ORPCError("NOT_FOUND", { message: "Note not found" });
			}

			if (!perm.isOwner && perm.role !== "editor" && perm.role !== "admin") {
				throw new ORPCError("UNAUTHORIZED", {
					message: "You are not authorized to edit this note",
				});
			}

			const success = await updateContent(
				input.id,
				Buffer.from(JSON.stringify(input.content)),
				input.contextText,
			);
			if (!success) throw new ORPCError("NOT_FOUND");

			// Note: Content updates might not change meta immediately, but good practice to clear cache if updatedAt changes
			void invalidateNoteMetaCache(input.id).catch(console.error);

			return success;
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const perm = await resolvePermission(input.id, userId);

			if (!perm) {
				throw new ORPCError("NOT_FOUND", { message: "Note not found" });
			}

			// Strictly owner-only operation
			if (!perm.isOwner) {
				throw new ORPCError("UNAUTHORIZED", {
					message: "Only the note owner can delete it",
				});
			}

			const meta = await getNotesMeta(input.id);
			if (!meta) throw new ORPCError("NOT_FOUND");

			// Free all assets and snapshots quota from R2 and decrement user storage quota
			await cleanupNoteStorage(input.id, meta.ownerId);

			const success = await deleteNotes(input.id);
			if (!success) throw new ORPCError("NOT_FOUND");

			void invalidateNoteUserPermission(input.id, userId).catch(console.error);
			void invalidateNoteMetaCache(input.id, meta.workspaceId).catch(
				console.error,
			);

			return success;
		}),

	getCollabNotes: protectedProcedure.handler(async ({ context }) => {
		const userId = context.session.user.id;
		const cached = await getCachedCollabNotes(userId);
		if (cached) return cached;

		const notes = await getCollabNotes(userId);
		void setCachedCollabNotes(userId, notes).catch(console.error);
		return notes;
	}),

	listByWorkspace: protectedProcedure
		.input(z.object({ workspaceId: z.string() }))
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const { workspaceId } = input;

			const cached = await getCachedNotesByWorkspace(workspaceId, userId);
			if (cached) return cached;

			const notes = await getNotesByWorkspace(workspaceId, userId);
			void setCachedNotesByWorkspace(workspaceId, userId, notes).catch(
				console.error,
			);
			return notes;
		}),

	getMetaById: protectedProcedure
		.input(z.object({ noteId: z.string() }))
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const { noteId } = input;
			const perm = await resolvePermission(noteId, userId);
			if (!perm)
				throw new ORPCError("NOT_FOUND", {
					message: "Note not found",
				});
			if (!perm.isOwner && !perm.role) {
				throw new ORPCError("UNAUTHORIZED", {
					message: "You are not authorized to access this note",
				});
			}
			const note = await getNotesMeta(noteId);
			if (!note)
				throw new ORPCError("NOT_FOUND", {
					message: "Note not found",
				});
			return note;
		}),
	getNoteContent: protectedProcedure
		.input(z.object({ noteId: z.string() }))
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const { noteId } = input;
			const perm = await resolvePermission(noteId, userId);
			if (!perm)
				throw new ORPCError("NOT_FOUND", {
					message: "Note not found",
				});
			if (!perm.isOwner && !perm.role) {
				throw new ORPCError("UNAUTHORIZED", {
					message: "You are not authorized to access this note",
				});
			}
			const note = await getContent(noteId);
			return note;
		}),
};
