import { and, eq, getColumns, inArray } from "drizzle-orm";
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
 * Get all strict descendants of a note (excluding the note itself).
 */
export const getNotesDescendants = async (
	noteId: string,
): Promise<NoteMeta[]> => {
	const all: NoteMeta[] = [];
	let frontier: string[] = [noteId];
	while (frontier.length > 0) {
		const children = await db
			.select(noteMetaColumns)
			.from(notes)
			.where(inArray(notes.parentNoteId, frontier));
		all.push(...children.map((c) => selectNoteMetaSchema.parse(c)));
		frontier = children.map((c) => c.id);
	}
	return all;
};

/**
 * Walk up the ancestor chain of a note and return the ancestor ids
 * (nearest parent first, excluding the note itself).
 */
export const getNotesAncestorIds = async (
	noteId: string,
): Promise<string[]> => {
	const ids: string[] = [];
	const seen = new Set([noteId]);
	let cursor = noteId;
	for (;;) {
		const meta = await getNotesMeta(cursor);
		const parentId = meta?.parentNoteId ?? null;
		if (!parentId || seen.has(parentId)) break;
		ids.push(parentId);
		seen.add(parentId);
		cursor = parentId;
	}
	return ids;
};

export interface MoveNotesSubtreeInput {
	noteId: string;
	targetWorkspaceId: string;
	targetParentId: string | null;
	moveChildren: boolean;
}

/**
 * Authoritatively move a note (optionally with its whole subtree) to another
 * workspace / parent. Children left behind are promoted to the moved note's
 * previous parent.
 */
export const moveNotesSubtree = async (input: MoveNotesSubtreeInput) => {
	const source = await getNotesMeta(input.noteId);
	if (!source) throw new Error("Source note not found");

	const now = new Date();
	const movedIds: string[] = [input.noteId];

	if (input.moveChildren) {
		const subtree = await getNotesDescendants(input.noteId);
		await updateNotesMeta({
			id: input.noteId,
			workspaceId: input.targetWorkspaceId,
			parentNoteId: input.targetParentId,
		});
		movedIds.push(...subtree.map((n) => n.id));
		if (input.targetWorkspaceId !== source.workspaceId) {
			for (const node of subtree) {
				await updateNotesMeta({
					id: node.id,
					workspaceId: input.targetWorkspaceId,
				});
			}
		}
	} else {
		// Promote direct children to the source note's previous parent.
		const children = await db
			.select(noteMetaColumns)
			.from(notes)
			.where(eq(notes.parentNoteId, input.noteId));
		for (const child of children) {
			if (child.parentNoteId !== source.parentNoteId) {
				await db
					.update(notes)
					.set({ parentNoteId: source.parentNoteId, updatedAt: now })
					.where(eq(notes.id, child.id));
			}
		}
		await updateNotesMeta({
			id: input.noteId,
			workspaceId: input.targetWorkspaceId,
			parentNoteId: input.targetParentId,
		});
	}

	return { movedIds, sourceWorkspaceId: source.workspaceId };
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
