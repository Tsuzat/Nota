import {
	getCachedNoteUserPermission,
	setCachedNoteUserPermission,
} from "@nota/cache/permissions";
import { isUserPro } from "@nota/cache/user_quota";
import { getNotesMeta } from "@nota/db/data/notes";
import { getNoteUserPermission } from "@nota/db/data/permissions";
import {
	createPublish,
	deletePublish,
	getPublishBySlugOrId,
	getPublishMetaByNoteId,
	incrementPublishViewCount,
	isSlugTaken,
	updatePublish,
} from "@nota/db/data/publish";
import { ORPCError } from "@orpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { protectedProcedure, publicProcedure } from "../index";

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

const getProcedure = publicProcedure
	.input(z.object({ slug: z.string() }))
	.handler(async ({ input }) => {
		const published = await getPublishBySlugOrId(input.slug);
		if (!published) {
			throw new ORPCError("NOT_FOUND", {
				message: "Published note not found or has been unpublished.",
			});
		}

		// Increment view count asynchronously
		void incrementPublishViewCount(published.id).catch(console.error);

		return published;
	});

const getMetaProcedure = protectedProcedure
	.input(z.object({ noteId: z.string() }))
	.handler(async ({ context, input }) => {
		const userId = context.session.user.id;
		const perm = await resolvePermission(input.noteId, userId);
		if (!perm) {
			throw new ORPCError("NOT_FOUND", { message: "Note not found" });
		}
		if (!perm.isOwner && !perm.role) {
			throw new ORPCError("UNAUTHORIZED", {
				message: "You are not authorized to access this note",
			});
		}
		const meta = await getPublishMetaByNoteId(input.noteId);
		return meta ?? null;
	});

const createProcedure = protectedProcedure
	.input(
		z.object({
			noteId: z.string(),
			slug: z.string().trim().max(100).optional(),
			title: z.string().optional(),
			contentHtml: z.string(),
			shouldIndex: z.boolean().optional(),
		}),
	)
	.handler(async ({ context, input }) => {
		const userId = context.session.user.id;
		const perm = await resolvePermission(input.noteId, userId);
		if (!perm) {
			throw new ORPCError("NOT_FOUND", { message: "Note not found" });
		}
		if (!perm.isOwner) {
			throw new ORPCError("FORBIDDEN", {
				message: "Only the note owner can publish this note",
			});
		}

		const isPro = await isUserPro(userId);
		if (!isPro) {
			throw new ORPCError("FORBIDDEN", {
				message:
					"Publishing is a Pro feature. Please upgrade to Pro to publish notes.",
			});
		}

		const note = await getNotesMeta(input.noteId);
		if (!note) {
			throw new ORPCError("NOT_FOUND", { message: "Note not found" });
		}

		const existing = await getPublishMetaByNoteId(input.noteId);
		if (existing) {
			throw new ORPCError("CONFLICT", {
				message: "This note is already published. Use update to update it.",
			});
		}

		let slug = input.slug?.trim().toLowerCase();
		if (!slug) {
			slug = nanoid(15);
		} else {
			if (!/^[a-z0-9_-]+$/i.test(slug)) {
				throw new ORPCError("BAD_REQUEST", {
					message:
						"Custom URL slug can only contain letters, numbers, hyphens, and underscores.",
				});
			}
			const taken = await isSlugTaken(slug);
			if (taken) {
				throw new ORPCError("CONFLICT", {
					message:
						"This URL slug is already in use. Please choose a different one.",
				});
			}
		}

		const published = await createPublish({
			id: input.noteId,
			slug,
			title: input.title || note.name || "Untitled",
			contentHtml: input.contentHtml,
			shouldIndex: input.shouldIndex ?? true,
			publishedBy: userId,
			status: "published",
		});

		return published;
	});

const updateProcedure = protectedProcedure
	.input(
		z.object({
			noteId: z.string(),
			slug: z.string().trim().max(100).optional(),
			title: z.string().optional(),
			contentHtml: z.string().optional(),
			shouldIndex: z.boolean().optional(),
			status: z.enum(["published", "unpublished"]).optional(),
		}),
	)
	.handler(async ({ context, input }) => {
		const userId = context.session.user.id;
		const perm = await resolvePermission(input.noteId, userId);
		if (!perm) {
			throw new ORPCError("NOT_FOUND", { message: "Note not found" });
		}
		if (!perm.isOwner) {
			throw new ORPCError("FORBIDDEN", {
				message: "Only the note owner can update the published note",
			});
		}

		const isPro = await isUserPro(userId);
		if (!isPro) {
			throw new ORPCError("FORBIDDEN", {
				message:
					"Publishing is a Pro feature. Please upgrade to Pro to publish notes.",
			});
		}

		const existing = await getPublishMetaByNoteId(input.noteId);
		if (!existing) {
			throw new ORPCError("NOT_FOUND", {
				message: "This note has not been published yet.",
			});
		}

		const slug = input.slug?.trim().toLowerCase();
		if (slug && slug !== existing.slug) {
			if (!/^[a-z0-9_-]+$/i.test(slug)) {
				throw new ORPCError("BAD_REQUEST", {
					message:
						"Custom URL slug can only contain letters, numbers, hyphens, and underscores.",
				});
			}
			const taken = await isSlugTaken(slug, input.noteId);
			if (taken) {
				throw new ORPCError("CONFLICT", {
					message:
						"This URL slug is already in use. Please choose a different one.",
				});
			}
		}

		const note = await getNotesMeta(input.noteId);

		const updated = await updatePublish(input.noteId, {
			...(slug ? { slug } : {}),
			...(input.title !== undefined
				? { title: input.title }
				: note?.name
					? { title: note.name }
					: {}),
			...(input.contentHtml !== undefined
				? { contentHtml: input.contentHtml }
				: {}),
			...(input.shouldIndex !== undefined
				? { shouldIndex: input.shouldIndex }
				: {}),
			...(input.status !== undefined ? { status: input.status } : {}),
		});

		return updated;
	});

const deleteProcedure = protectedProcedure
	.input(z.object({ noteId: z.string() }))
	.handler(async ({ context, input }) => {
		const userId = context.session.user.id;
		const perm = await resolvePermission(input.noteId, userId);
		if (!perm) {
			throw new ORPCError("NOT_FOUND", { message: "Note not found" });
		}
		if (!perm.isOwner) {
			throw new ORPCError("FORBIDDEN", {
				message: "Only the note owner can unpublish this note",
			});
		}

		const success = await deletePublish(input.noteId);
		return { success };
	});

export const publishRouter = {
	get: getProcedure,
	getMeta: getMetaProcedure,
	create: createProcedure,
	update: updateProcedure,
	delete: deleteProcedure,

	// Compatibility aliases
	getPublish: getProcedure,
	getPublishMeta: getMetaProcedure,
	createPublish: createProcedure,
	updatePublish: updateProcedure,
	deletePublish: deleteProcedure,
};
