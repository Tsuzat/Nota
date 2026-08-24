import { and, eq, ne, or, sql } from "drizzle-orm";
import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-orm/zod";
import type { z } from "zod";
import { db } from "..";
import { publish } from "../schema/app";
import { user } from "../schema/auth";

export const selectPublishSchema = createSelectSchema(publish);
export const selectPublishMetaSchema = selectPublishSchema.omit({
	contentHtml: true,
});

export const insertPublishSchema = createInsertSchema(publish);
export const updatePublishSchema = createUpdateSchema(publish);

export type PublishData = z.infer<typeof selectPublishSchema>;
export type PublishMeta = z.infer<typeof selectPublishMetaSchema>;
export type InsertPublishInput = z.infer<typeof insertPublishSchema>;
export type UpdatePublishInput = Partial<z.infer<typeof updatePublishSchema>>;

export interface PublishAuthor {
	id: string;
	name: string;
	image: string | null;
}

export interface PublishedNoteWithAuthor extends PublishData {
	author: PublishAuthor | null;
}

/**
 * Get published note by note ID (full content)
 */
export const getPublishByNoteId = async (
	noteId: string,
): Promise<PublishData | undefined> => {
	const result = await db.query.publish.findFirst({
		where: { id: noteId },
	});
	return result;
};

/**
 * Get published note metadata by note ID (without heavy HTML)
 */
export const getPublishMetaByNoteId = async (
	noteId: string,
): Promise<PublishMeta | undefined> => {
	const result = await db.query.publish.findFirst({
		where: { id: noteId },
		columns: {
			id: true,
			slug: true,
			title: true,
			status: true,
			shouldIndex: true,
			publishedBy: true,
			publishedAt: true,
			updatedAt: true,
			viewCount: true,
		},
	});
	return result;
};

/**
 * Get published note by slug
 */
export const getPublishBySlug = async (
	slug: string,
): Promise<PublishData | undefined> => {
	const result = await db.query.publish.findFirst({
		where: { slug },
	});
	return result;
};

/**
 * Get published note by slug or note ID (with author information)
 */
export const getPublishBySlugOrId = async (
	slugOrId: string,
): Promise<PublishedNoteWithAuthor | undefined> => {
	const [result] = await db
		.select({
			id: publish.id,
			slug: publish.slug,
			title: publish.title,
			contentHtml: publish.contentHtml,
			status: publish.status,
			shouldIndex: publish.shouldIndex,
			publishedBy: publish.publishedBy,
			publishedAt: publish.publishedAt,
			updatedAt: publish.updatedAt,
			viewCount: publish.viewCount,
			authorId: user.id,
			authorName: user.name,
			authorImage: user.image,
		})
		.from(publish)
		.leftJoin(user, eq(user.id, publish.publishedBy))
		.where(
			and(
				or(eq(publish.slug, slugOrId), eq(publish.id, slugOrId)),
				eq(publish.status, "published"),
			),
		)
		.limit(1);

	if (!result) return undefined;

	const { authorId, authorName, authorImage, ...data } = result;

	return {
		...data,
		author: authorId
			? {
					id: authorId,
					name: authorName ?? "Anonymous",
					image: authorImage ?? null,
				}
			: null,
	};
};

/**
 * Increment view count for a published note
 */
export const incrementPublishViewCount = async (id: string): Promise<void> => {
	await db
		.update(publish)
		.set({
			viewCount: sql`${publish.viewCount} + 1`,
		})
		.where(eq(publish.id, id));
};

/**
 * Check if a slug is already taken
 */
export const isSlugTaken = async (
	slug: string,
	excludeNoteId?: string,
): Promise<boolean> => {
	const whereClause = excludeNoteId
		? and(eq(publish.slug, slug), ne(publish.id, excludeNoteId))
		: eq(publish.slug, slug);

	const count = await db.$count(publish, whereClause);
	return count > 0;
};

/**
 * Create a published note
 */
export const createPublish = async (
	input: InsertPublishInput,
): Promise<PublishData> => {
	const [record] = await db.insert(publish).values(input).returning();
	if (!record) {
		throw new Error("Failed to create published note");
	}
	return record;
};

/**
 * Update a published note
 */
export const updatePublish = async (
	noteId: string,
	input: UpdatePublishInput,
): Promise<PublishData | undefined> => {
	const [record] = await db
		.update(publish)
		.set({
			...input,
			updatedAt: new Date(),
		})
		.where(eq(publish.id, noteId))
		.returning();
	return record;
};

/**
 * Delete a published note
 */
export const deletePublish = async (noteId: string): Promise<boolean> => {
	await db.delete(publish).where(eq(publish.id, noteId));
	return true;
};
