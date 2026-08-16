import { and, eq } from "drizzle-orm";
import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-orm/zod";
import type z from "zod";
import { db, type Workspace } from "..";
import { workspace } from "../schema/app";

export const selectWorkspaceSchema = createSelectSchema(workspace);
export const insertWorkspaceSchema = createInsertSchema(workspace);
export const updateWorkspaceSchema = createUpdateSchema(workspace);

export type CreateWorkspaceInput = z.infer<typeof insertWorkspaceSchema>;
export type UpdateWorkspaceInput = Partial<
	z.infer<typeof updateWorkspaceSchema>
> & {
	id: string;
	ownerId: string;
};

/**
 * Get all workspaces for a user
 * @param userId string
 * @returns Promise<Workspace[]>
 */
export const fetchUserWorkspaces = async (
	userId: string,
): Promise<Workspace[]> => {
	const data = await db
		.select()
		.from(workspace)
		.where(eq(workspace.ownerId, userId));
	return selectWorkspaceSchema.array().parse(data);
};

/**
 * Create a new workspace
 * @param input CreateWorkspaceInput
 * @returns Promise<Workspace>
 */
export const createWorkspace = async (
	input: CreateWorkspaceInput,
): Promise<Workspace> => {
	const workspaceInsert = insertWorkspaceSchema.parse(input);
	const [data] = await db.insert(workspace).values(workspaceInsert).returning();
	return selectWorkspaceSchema.parse(data);
};

/**
 * Get the count of workspaces for a user
 * @param userId User Id
 * @returns Promise<number>
 */
export const getUserWorkspaceCount = async (
	userId: string,
): Promise<number> => {
	const count = await db.$count(workspace, eq(workspace.ownerId, userId));
	return count;
};

/**
 * Update an existing workspace
 * @param input UpdateWorkspaceInput (id is required)
 * @returns Promise<Workspace>
 */
export const updateWorkspace = async (
	input: UpdateWorkspaceInput,
): Promise<Workspace | null> => {
	const { id, ownerId, ...values } = input;
	const workspaceUpdate = updateWorkspaceSchema.parse({
		...values,
		updatedAt: new Date(),
	});
	const [data] = await db
		.update(workspace)
		.set(workspaceUpdate)
		.where(and(eq(workspace.id, id), eq(workspace.ownerId, ownerId)))
		.returning();
	return data ? selectWorkspaceSchema.parse(data) : null;
};

/**
 * Delete a workspace by ID
 * @param id string
 * @returns Promise<boolean>
 */
export const deleteWorkspace = async (
	id: string,
	userId: string,
): Promise<boolean> => {
	const result = await db
		.delete(workspace)
		.where(and(eq(workspace.id, id), eq(workspace.ownerId, userId)))
		.returning();
	return result.length > 0;
};

/**
 * Check if a user is the owner of a workspace
 * @param id Workspace ID
 * @param userId User ID
 * @returns Promise<boolean>
 */
export const isWorkspaceOwner = async (
	id: string,
	userId: string,
): Promise<boolean> => {
	const count = await db.$count(
		workspace,
		and(eq(workspace.id, id), eq(workspace.ownerId, userId)),
	);
	return count > 0;
};

/**
 * Get the owner ID of a workspace
 * @param id Workspace ID
 * @returns Promise<string | null>
 */
export const getWorkspaceOwnerId = async (
	id: string,
): Promise<string | null> => {
	const [data] = await db
		.select({ ownerId: workspace.ownerId })
		.from(workspace)
		.where(eq(workspace.id, id))
		.limit(1);
	return data?.ownerId ?? null;
};
