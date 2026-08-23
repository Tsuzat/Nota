import { deleteCachedUserQuota } from "@nota/cache/user_quota";
import {
	createCloudSnapshot,
	deleteCloudSnapshot,
	getSnapshotById,
	getSnapshotContent,
	getSnapshotsForWorkspace,
	restoreCloudSnapshot,
} from "@nota/db/data/note_snapshots";
import { getNotesMeta } from "@nota/db/data/notes";
import { getNoteUserPermission } from "@nota/db/data/permissions";
import { isWorkspaceOwner } from "@nota/db/data/workspace";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "..";

export const snapshotsRouter = {
	list: protectedProcedure
		.input(
			z.object({
				workspaceId: z.string(),
				noteId: z.string().optional(),
				kind: z.enum(["auto", "manual", "pinned"]).optional(),
				search: z.string().optional(),
				limit: z.number().min(1).max(100).default(20),
				offset: z.number().min(0).default(0),
				sortBy: z.enum(["createdAt", "name", "size"]).default("createdAt"),
				sortOrder: z.enum(["asc", "desc"]).default("desc"),
			}),
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;

			const isOwner = await isWorkspaceOwner(input.workspaceId, userId);
			if (!isOwner) {
				throw new ORPCError("UNAUTHORIZED", {
					message:
						"You are not authorized to view snapshots for this workspace",
				});
			}

			return await getSnapshotsForWorkspace(input.workspaceId, input);
		}),

	getContent: protectedProcedure
		.input(
			z.object({
				snapshotId: z.string(),
			}),
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const snapshot = await getSnapshotById(input.snapshotId);
			if (!snapshot) {
				throw new ORPCError("NOT_FOUND", { message: "Snapshot not found" });
			}

			const perm = await getNoteUserPermission(snapshot.noteId, userId);
			if (!perm || (!perm.isOwner && !perm.role)) {
				throw new ORPCError("UNAUTHORIZED", {
					message: "You do not have access to this note snapshot",
				});
			}

			const buffer = await getSnapshotContent(input.snapshotId);
			return {
				snapshot,
				binaryBase64: buffer.toString("base64"),
			};
		}),

	create: protectedProcedure
		.input(
			z.object({
				noteId: z.string(),
				label: z.string().min(1).max(100).optional(),
			}),
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const perm = await getNoteUserPermission(input.noteId, userId);
			if (!perm) {
				throw new ORPCError("NOT_FOUND", { message: "Note not found" });
			}

			if (!perm.isOwner && perm.role !== "admin") {
				throw new ORPCError("UNAUTHORIZED", {
					message: "Only note owners or admins can take manual snapshots",
				});
			}

			try {
				const snapshot = await createCloudSnapshot({
					noteId: input.noteId,
					userId,
					label: input.label ?? "Manual Snapshot",
					kind: "manual",
				});

				const note = await getNotesMeta(input.noteId);
				if (note?.ownerId) {
					void deleteCachedUserQuota(note.ownerId).catch(console.error);
				}

				return snapshot;
			} catch (err) {
				const message =
					err instanceof Error ? err.message : "Failed to create snapshot";
				throw new ORPCError("BAD_REQUEST", { message });
			}
		}),

	delete: protectedProcedure
		.input(
			z.object({
				snapshotId: z.string(),
			}),
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const snapshot = await getSnapshotById(input.snapshotId);
			if (!snapshot) {
				throw new ORPCError("NOT_FOUND", { message: "Snapshot not found" });
			}

			const perm = await getNoteUserPermission(snapshot.noteId, userId);
			const isCreator = snapshot.createdBy === userId;

			if (!perm?.isOwner && !isCreator && perm?.role !== "admin") {
				throw new ORPCError("UNAUTHORIZED", {
					message: "You do not have permission to delete this snapshot",
				});
			}

			const note = await getNotesMeta(snapshot.noteId);
			const deleted = await deleteCloudSnapshot(input.snapshotId);

			if (deleted && note?.ownerId) {
				void deleteCachedUserQuota(note.ownerId).catch(console.error);
			}

			return { success: deleted };
		}),

	restore: protectedProcedure
		.input(
			z.object({
				snapshotId: z.string(),
			}),
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const snapshot = await getSnapshotById(input.snapshotId);
			if (!snapshot) {
				throw new ORPCError("NOT_FOUND", { message: "Snapshot not found" });
			}

			const perm = await getNoteUserPermission(snapshot.noteId, userId);
			if (
				!perm ||
				(!perm.isOwner && perm.role !== "admin" && perm.role !== "editor")
			) {
				throw new ORPCError("UNAUTHORIZED", {
					message: "You do not have permission to restore this note",
				});
			}

			const result = await restoreCloudSnapshot(input.snapshotId, userId);

			const note = await getNotesMeta(snapshot.noteId);
			if (note?.ownerId) {
				void deleteCachedUserQuota(note.ownerId).catch(console.error);
			}

			return result;
		}),
};
