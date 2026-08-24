import { and, asc, desc, eq, like, or, type SQL, sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import type z from "zod";
import { db } from "../db";
import { assets, notes, workspace } from "../schema/index";

export const selectAssetSchema = createSelectSchema(assets);
export const insertAssetSchema = createInsertSchema(assets);

export type Asset = z.infer<typeof selectAssetSchema>;
export type InsertAsset = z.infer<typeof insertAssetSchema>;

export interface LocalAssetItem {
	id: string;
	noteId: string;
	name: string;
	mimeType: string;
	size: number;
	createdAt: Date;
	noteName: string | null;
	noteIcon: string | null;
	workspaceId: string | null;
	workspaceName: string | null;
}

export type AssetWithNoteName = Asset & {
	noteName: string | null;
};

export interface GetLocalAssetsOptions {
	workspaceId?: string;
	noteId?: string;
	search?: string;
	mimeType?: string;
	limit?: number;
	offset?: number;
	sortBy?: "createdAt" | "name" | "size";
	sortOrder?: "asc" | "desc";
}

/**
 * Inserts a new asset.
 *
 * @param input The asset data to insert
 * @returns The newly created asset
 */
export async function createAsset(
	input: Omit<InsertAsset, "createdAt"> & { createdAt?: Date },
): Promise<Asset> {
	try {
		const insertData = insertAssetSchema.parse({
			...input,
			createdAt: input.createdAt ?? new Date(),
		});

		const result = await db.insert(assets).values(insertData).returning();

		return selectAssetSchema.parse(result[0]);
	} catch (error) {
		console.error("Failed to create asset:", error);
		throw new Error("Failed to create asset");
	}
}

/**
 * Gets a local asset by ID
 */
export async function getLocalAssetById(
	id: string,
): Promise<LocalAssetItem | null> {
	try {
		const rows = await db
			.select({
				id: assets.id,
				noteId: assets.noteId,
				name: assets.name,
				mimeType: assets.mimeType,
				size: assets.size,
				createdAt: assets.createdAt,
				noteName: sql<string | null>`${notes.name}`.as("note_name"),
				noteIcon: sql<string | null>`${notes.icon}`.as("note_icon"),
				workspaceId: sql<string | null>`${notes.workspaceId}`.as(
					"note_workspace_id",
				),
				workspaceName: sql<string | null>`${workspace.name}`.as("ws_name"),
			})
			.from(assets)
			.leftJoin(notes, eq(assets.noteId, notes.id))
			.leftJoin(workspace, eq(notes.workspaceId, workspace.id))
			.where(eq(assets.id, id))
			.limit(1);

		const row = rows[0];
		if (!row) return null;

		return {
			...row,
			createdAt: new Date(row.createdAt),
		};
	} catch (error) {
		console.error("Failed to get asset by ID:", error);
		throw new Error("Failed to get asset by ID");
	}
}

/**
 * Deletes an asset by its ID and returns true if deleted, false otherwise.
 *
 * @param id The ID of the asset to delete
 * @returns true if deleted, false otherwise
 */
export async function deleteAsset(id: string): Promise<boolean> {
	try {
		const result = await db.delete(assets).where(eq(assets.id, id)).returning();

		return result.length > 0;
	} catch (error) {
		console.error("Failed to delete asset:", error);
		throw new Error("Failed to delete asset");
	}
}

/**
 * Get local assets with filters, search, pagination, and sorting.
 */
export async function getLocalAssets(
	options: GetLocalAssetsOptions = {},
): Promise<{ items: LocalAssetItem[]; total: number; totalSizeBytes: number }> {
	try {
		const {
			workspaceId,
			noteId,
			search,
			mimeType,
			limit = 20,
			offset = 0,
			sortBy = "createdAt",
			sortOrder = "desc",
		} = options;

		const conditions: (SQL | undefined)[] = [
			workspaceId ? eq(notes.workspaceId, workspaceId) : undefined,
			noteId ? eq(assets.noteId, noteId) : undefined,
			mimeType ? like(assets.mimeType, `${mimeType}%`) : undefined,
			search
				? or(like(assets.name, `%${search}%`), like(notes.name, `%${search}%`))
				: undefined,
		];

		const whereClause = and(
			...conditions.filter((c): c is NonNullable<typeof c> => c !== undefined),
		);

		const [countResult] = await db
			.select({
				count: sql<number>`count(*)`,
				totalSize: sql<number>`COALESCE(sum(${assets.size}), 0)`,
			})
			.from(assets)
			.leftJoin(notes, eq(assets.noteId, notes.id))
			.leftJoin(workspace, eq(notes.workspaceId, workspace.id))
			.where(whereClause);

		const total = Number(countResult?.count ?? 0);
		const totalSizeBytes = Number(countResult?.totalSize ?? 0);

		let orderClause = desc(assets.createdAt);
		if (sortBy === "name") {
			orderClause = sortOrder === "asc" ? asc(assets.name) : desc(assets.name);
		} else if (sortBy === "size") {
			orderClause = sortOrder === "asc" ? asc(assets.size) : desc(assets.size);
		} else {
			orderClause =
				sortOrder === "asc" ? asc(assets.createdAt) : desc(assets.createdAt);
		}

		const rows = await db
			.select({
				id: assets.id,
				noteId: assets.noteId,
				name: assets.name,
				mimeType: assets.mimeType,
				size: assets.size,
				createdAt: assets.createdAt,
				noteName: sql<string | null>`${notes.name}`.as("note_name"),
				noteIcon: sql<string | null>`${notes.icon}`.as("note_icon"),
				workspaceId: sql<string | null>`${notes.workspaceId}`.as(
					"note_workspace_id",
				),
				workspaceName: sql<string | null>`${workspace.name}`.as("ws_name"),
			})
			.from(assets)
			.leftJoin(notes, eq(assets.noteId, notes.id))
			.leftJoin(workspace, eq(notes.workspaceId, workspace.id))
			.where(whereClause)
			.orderBy(orderClause)
			.limit(limit)
			.offset(offset);

		return {
			items: rows.map((r) => ({
				...r,
				createdAt: new Date(r.createdAt),
			})),
			total,
			totalSizeBytes,
		};
	} catch (error) {
		console.error("Failed to get local assets:", error);
		throw new Error("Failed to get local assets");
	}
}

/**
 * Fetches assets with pagination, optional mimetype filtering,
 * and includes the parent note's name.
 */
export async function fetchAllAssets(
	limit: number = 20,
	offset: number = 0,
	mimeType?: string,
): Promise<AssetWithNoteName[]> {
	try {
		const queryConditions = mimeType
			? like(assets.mimeType, `${mimeType}%`)
			: undefined;

		const data = await db
			.select({
				id: assets.id,
				noteId: assets.noteId,
				name: assets.name,
				mimeType: assets.mimeType,
				size: assets.size,
				createdAt: assets.createdAt,
				noteName: sql<string | null>`${notes.name}`.as("note_name"),
			})
			.from(assets)
			.leftJoin(notes, eq(assets.noteId, notes.id))
			.where(queryConditions)
			.orderBy(desc(assets.createdAt))
			.limit(limit)
			.offset(offset);

		return data.map((row) => ({
			...selectAssetSchema.parse({
				id: row.id,
				noteId: row.noteId,
				name: row.name,
				mimeType: row.mimeType,
				size: row.size,
				createdAt: row.createdAt,
			}),
			noteName: row.noteName,
		}));
	} catch (error) {
		console.error("Failed to fetch assets:", error);
		throw new Error("Failed to fetch assets");
	}
}
