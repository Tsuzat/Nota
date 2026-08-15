import { eq } from "drizzle-orm/sqlite-core/expressions";
import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-orm/zod";
import type z from "zod";
import { db } from "../db";
import { workspace } from "../schema/index.js";
import type { LocalWorkspace } from "../types.js";

const selectWorkspaceSchema = createSelectSchema(workspace);
const insertWorkspaceSchema = createInsertSchema(workspace);
const updateWorkspaceSchema = createUpdateSchema(workspace);

/**
 * Fetches all workspaces from the database.
 * @returns A promise that resolves to an array of LocalWorkspace.
 */
export async function fetchWorkspace(): Promise<LocalWorkspace[]> {
	try {
		const data = await db.select().from(workspace);
		const result = selectWorkspaceSchema.array().parse(data);
		return result;
	} catch (error) {
		console.log(error);
		throw new Error("Failed to fetch workspaces");
	}
}

/**
 * Creates a new workspace in the database.
 * @param input The workspace to create.
 * @returns A promise that resolves to the created LocalWorkspace.
 */
export async function createWorkspace(
	input: z.infer<typeof insertWorkspaceSchema>,
) {
	try {
		const workspaceInsert = insertWorkspaceSchema.parse(input);
		const result = await db
			.insert(workspace)
			.values(workspaceInsert)
			.returning();
		return selectWorkspaceSchema.parse(result[0]);
	} catch (error) {
		console.log(error);
		throw new Error("Failed to create workspace");
	}
}

/**
 * Updates a workspace in the database.
 * @param input The workspace to update.
 * @returns A promise that resolves to the updated LocalWorkspace.
 */
export async function updateWorkspace(
	input: Partial<z.infer<typeof updateWorkspaceSchema>> & { id: string },
) {
	try {
		const workspaceUpdate = updateWorkspaceSchema.parse(input);
		const result = await db.update(workspace).set(workspaceUpdate).returning();
		return selectWorkspaceSchema.parse(result[0]);
	} catch (error) {
		console.log(error);
		throw new Error("Failed to update workspace");
	}
}

/**
 * Deletes a workspace from the database.
 * @param input The workspace to delete.
 * @returns A promise that resolves to the deleted LocalWorkspace.
 */
export async function deleteWorkspace(id: string): Promise<boolean> {
	try {
		const result = await db
			.delete(workspace)
			.where(eq(workspace.id, id))
			.returning();
		return result.length === 1;
	} catch (error) {
		console.log(error);
		throw new Error("Failed to delete workspace");
	}
}
