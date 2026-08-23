import { eq, like, or } from "drizzle-orm";
import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-orm/zod";
import type z from "zod";
import { db } from "../db";
import { notes } from "../schema/index.js";
import type { LocalNote } from "../types.js";

export const selectNotesSchema = createSelectSchema(notes);
export const selectNotesMetaSchema = selectNotesSchema.omit({
	content: true,
	contentText: true,
});
export const insertNotesSchema = createInsertSchema(notes);
export const updateNotesSchema = createUpdateSchema(notes);
export const updateNotesMetaSchema = updateNotesSchema.omit({
	content: true,
	contentText: true,
});

export type LocalNoteMeta = z.infer<typeof selectNotesMetaSchema>;

export type UpdateNotesContentInput = {
	id: string;
	content: unknown;
	contentText?: string | null;
	content_text?: string | null;
};

export type ExportedNote = {
	id: string;
	name: string;
	content: unknown;
	contentText?: string | null;
};

/**
 * Fetches all notes metadata for a given workspace (excluding content and contentText).
 * @param workspaceId The ID of the workspace.
 * @returns A promise that resolves to an array of note metadata.
 */
export async function fetchNotesByWorkspace(
	workspaceId: string,
): Promise<LocalNoteMeta[]> {
	try {
		const data = await db
			.select({
				id: notes.id,
				workspaceId: notes.workspaceId,
				parentNoteId: notes.parentNoteId,
				icon: notes.icon,
				name: notes.name,
				description: notes.description,
				starred: notes.starred,
				trashedAt: notes.trashedAt,
				createdAt: notes.createdAt,
				updatedAt: notes.updatedAt,
			})
			.from(notes)
			.where(eq(notes.workspaceId, workspaceId));
		const result = selectNotesMetaSchema.array().parse(data);
		return result;
	} catch (error) {
		console.log(error);
		throw new Error("Failed to fetch notes for workspace");
	}
}

/**
 * Fetches note metadata by ID (excluding content and contentText).
 * @param id The ID of the note.
 * @returns A promise that resolves to the note metadata or null if not found.
 */
export async function fetchNotesMeta(
	id: string,
): Promise<LocalNoteMeta | null> {
	try {
		const data = await db
			.select({
				id: notes.id,
				workspaceId: notes.workspaceId,
				parentNoteId: notes.parentNoteId,
				icon: notes.icon,
				name: notes.name,
				description: notes.description,
				starred: notes.starred,
				trashedAt: notes.trashedAt,
				createdAt: notes.createdAt,
				updatedAt: notes.updatedAt,
			})
			.from(notes)
			.where(eq(notes.id, id))
			.limit(1);
		if (!data[0]) return null;
		return selectNotesMetaSchema.parse(data[0]);
	} catch (error) {
		console.log(error);
		throw new Error("Failed to fetch note metadata");
	}
}

/**
 * Updates a note's metadata in the database.
 * @param input The note metadata to update, including its id.
 * @returns A promise that resolves to the updated note metadata.
 */
export async function updateNotesMeta(
	input: z.infer<typeof updateNotesMetaSchema> & { id: string },
) {
	try {
		const noteUpdate = updateNotesMetaSchema.parse(input);
		if (!input.id) {
			throw new Error("Note ID is required to update note metadata");
		}
		const result = await db
			.update(notes)
			.set({
				...noteUpdate,
				updatedAt: new Date(),
			})
			.where(eq(notes.id, input.id))
			.returning();

		if (!result[0]) {
			throw new Error(`Note with id ${input.id} not found`);
		}

		return selectNotesMetaSchema.parse(result[0]);
	} catch (error) {
		console.log(error);
		throw new Error("Failed to update note metadata");
	}
}

/**
 * Applies a batch of move updates (workspace / parent changes) sequentially.
 * @param updates Array of { id, workspaceId?, parentNoteId? } moves.
 * @returns The updated metadata for every touched note.
 */
export async function moveNotes(
	updates: {
		id: string;
		workspaceId?: string;
		parentNoteId?: string | null;
	}[],
): Promise<LocalNoteMeta[]> {
	const updated: LocalNoteMeta[] = [];
	for (const update of updates) {
		updated.push(await updateNotesMeta(update));
	}
	return updated;
}

/**
 * Deletes a note from the database by ID.
 * @param id The ID of the note.
 * @returns A promise that resolves to true if deleted, false if not found.
 */
export async function deleteNotes(id: string): Promise<boolean> {
	try {
		const result = await db.delete(notes).where(eq(notes.id, id)).returning();
		return result.length === 1;
	} catch (error) {
		console.log(error);
		throw new Error("Failed to delete note");
	}
}

/**
 * Updates a note's content and content_text in the database.
 * @param idOrInput The note ID or input object.
 * @param content The JSON content (if id is passed as first argument).
 * @param contentText The plain text representation of the content.
 * @returns A promise that resolves to the updated note.
 */
export async function saveNotesContent(
	id: string,
	content: unknown,
	contentText?: string | null,
): Promise<void> {
	try {
		const result = await db
			.update(notes)
			.set({
				content,
				contentText: contentText ?? null,
				updatedAt: new Date(),
			})
			.where(eq(notes.id, id))
			.returning();

		if (!result[0]) {
			throw new Error(`Note with id ${id} not found`);
		}
	} catch (error) {
		console.log(error);
		throw new Error("Failed to save note content");
	}
}

/**
 * Searches for notes matching the search text in name, description, or contentText.
 * @param text The search query string.
 * @returns A promise that resolves to matching notes metadata.
 */
export async function searchInNotes(text: string): Promise<LocalNoteMeta[]> {
	try {
		const searchPattern = `%${text}%`;
		const data = await db
			.select({
				id: notes.id,
				workspaceId: notes.workspaceId,
				parentNoteId: notes.parentNoteId,
				icon: notes.icon,
				name: notes.name,
				description: notes.description,
				starred: notes.starred,
				trashedAt: notes.trashedAt,
				createdAt: notes.createdAt,
				updatedAt: notes.updatedAt,
			})
			.from(notes)
			.where(
				or(
					like(notes.name, searchPattern),
					like(notes.description, searchPattern),
					like(notes.contentText, searchPattern),
				),
			);
		return selectNotesMetaSchema.array().parse(data);
	} catch (error) {
		console.log(error);
		throw new Error("Failed to search in notes");
	}
}

/**
 * Exports a note by ID, returning its id, name, content, and contentText.
 * @param id The ID of the note to export.
 * @returns A promise that resolves to the exported note data.
 */
export async function exportNotes(id: string): Promise<ExportedNote> {
	try {
		const data = await db.select().from(notes).where(eq(notes.id, id)).limit(1);
		if (!data[0]) {
			throw new Error(`Note with id ${id} not found`);
		}
		return {
			id: data[0].id,
			name: data[0].name,
			content: data[0].content,
			contentText: data[0].contentText,
		};
	} catch (error) {
		console.log(error);
		throw new Error("Failed to export note");
	}
}

/**
 * Creates a new note in the database.
 * @param input The note data to insert.
 * @returns A promise that resolves to the created LocalNote.
 */
export async function createNotes(
	input: z.infer<typeof insertNotesSchema>,
): Promise<LocalNote> {
	try {
		const noteInsert = insertNotesSchema.parse(input);
		const result = await db.insert(notes).values(noteInsert).returning();
		return selectNotesSchema.parse(result[0]) as LocalNote;
	} catch (error) {
		console.log(error);
		throw new Error("Failed to create note");
	}
}

export async function getNotesContent(id: string): Promise<unknown | null> {
	try {
		const result = await db
			.select({
				content: notes.content,
			})
			.from(notes)
			.where(eq(notes.id, id))
			.limit(1);
		if (!result[0]) {
			throw new Error(`Note with id ${id} not found`);
		}
		return result[0].content;
	} catch (error) {
		console.log(error);
		throw new Error("Failed to get note content");
	}
}
