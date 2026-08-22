import { and, eq, getColumns } from "drizzle-orm";
import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-orm/zod";
import { z } from "zod";
import { db } from "..";
import { noteGuests, notes, workspace } from "../schema/app";

// Exclude heavy fields from metadata selection
const { content, contentVector, contextText, ...noteMetaColumns } =
	getColumns(notes);

const fullNoteSchema = createSelectSchema(notes);

export const selectNoteMetaSchema = fullNoteSchema.omit({
	content: true,
	contextText: true,
	contentVector: true,
});

export type NoteMeta = z.infer<typeof selectNoteMetaSchema>;

export const insertNoteSchema = createInsertSchema(notes, {
	content: z.any().optional(),
});

export const updateNoteSchema = createUpdateSchema(notes, {
	content: z.any().optional(),
});

export type CreateNoteInput = z.infer<typeof insertNoteSchema>;
export type UpdateNoteMetaInput = Partial<z.infer<typeof updateNoteSchema>> & {
	id: string;
};

/**
 * Get all notes metadata for a workspace (only if user is workspace owner).
 */
export const getNotesByWorkspace = async (
	workspaceId: string,
	userId: string,
): Promise<NoteMeta[]> => {
	const isOwner = await db.$count(
		workspace,
		and(eq(workspace.id, workspaceId), eq(workspace.ownerId, userId)),
	);
	if (!isOwner) return [];

	const data = await db
		.select(noteMetaColumns)
		.from(notes)
		.where(eq(notes.workspaceId, workspaceId));

	return selectNoteMetaSchema.array().parse(data);
};

/**
 * Get note metadata
 */
export const getNotesMeta = async (id: string): Promise<NoteMeta | null> => {
	const [data] = await db
		.select(noteMetaColumns)
		.from(notes)
		.where(eq(notes.id, id))
		.limit(1);

	return data ? selectNoteMetaSchema.parse(data) : null;
};

/**
 * Create a new note
 */
export const createNotes = async (
	input: CreateNoteInput,
): Promise<NoteMeta> => {
	const noteInsert = insertNoteSchema.parse(input);
	const [data] = await db
		.insert(notes)
		.values(noteInsert)
		.returning(noteMetaColumns);
	return selectNoteMetaSchema.parse(data);
};

/**
 * Update note metadata
 */
export const updateNotesMeta = async (
	input: UpdateNoteMetaInput,
): Promise<NoteMeta | null> => {
	const { id, ...values } = input;

	const noteUpdate = updateNoteSchema.parse({
		...values,
		updatedAt: new Date(),
	});

	const [data] = await db
		.update(notes)
		.set(noteUpdate)
		.where(eq(notes.id, id))
		.returning(noteMetaColumns);

	return data ? selectNoteMetaSchema.parse(data) : null;
};

/**
 * Delete a note
 */
export const deleteNotes = async (id: string): Promise<boolean> => {
	const result = await db
		.delete(notes)
		.where(eq(notes.id, id))
		.returning({ id: notes.id });
	return result.length > 0;
};

/**
 * Get all notes where the user is a guest (shared notes).
 */
export const getCollabNotes = async (
	userId: string,
): Promise<(NoteMeta & { role: string })[]> => {
	const rows = await db
		.select({
			...noteMetaColumns,
			role: noteGuests.role,
		})
		.from(notes)
		.innerJoin(noteGuests, eq(noteGuests.noteId, notes.id))
		.where(eq(noteGuests.userId, userId));

	return rows.map((r) => ({
		...selectNoteMetaSchema.parse(r),
		role: r.role,
	}));
};

/**
 * Update binary content of a note
 */
export const updateContent = async (
	id: string,
	yjsdoc: Buffer,
	contextText: string,
): Promise<boolean> => {
	const result = await db
		.update(notes)
		.set({
			content: yjsdoc,
			contextText,
			updatedAt: new Date(),
		})
		.where(eq(notes.id, id))
		.returning({ id: notes.id });

	return result.length > 0;
};

export const getContent = async (id: string) => {
	const [data] = await db
		.select({ content: notes.content })
		.from(notes)
		.where(eq(notes.id, id))
		.limit(1);

	return data ? data.content : null;
};

/**
 * Update only binary content of a note (used by realtime collaboration)
 */
export const updateContentState = async (
	id: string,
	yjsdoc: Buffer,
): Promise<boolean> => {
	const result = await db
		.update(notes)
		.set({
			content: yjsdoc,
			updatedAt: new Date(),
		})
		.where(eq(notes.id, id))
		.returning({ id: notes.id });

	return result.length > 0;
};
