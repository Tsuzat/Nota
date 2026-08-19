import { and, desc, eq, ilike, type SQL } from "drizzle-orm";
import { db } from "..";
import { assets, notes } from "../schema/app";

export interface CreateAssetInput {
	noteId: string;
	name: string;
	mimeType: string;
	size: number;
	uploadedBy: string;
	path: string;
}

export const createAsset = async (input: CreateAssetInput) => {
	const [asset] = await db.insert(assets).values(input).returning();
	return asset;
};

export const deleteAsset = async (id: string) => {
	const [deleted] = await db
		.delete(assets)
		.where(eq(assets.id, id))
		.returning();
	return deleted;
};

export interface GetAssetsFilter {
	workspaceId: string;
	noteId?: string;
	searchTerm?: string;
	createdAt?: Date;
	mimeType?: string;
}

export const getAssetsByWorkspace = async (filters: GetAssetsFilter) => {
	let conditions: SQL | undefined = eq(notes.workspaceId, filters.workspaceId);

	if (filters.noteId) {
		conditions = and(conditions, eq(assets.noteId, filters.noteId));
	}
	if (filters.searchTerm) {
		conditions = and(conditions, ilike(assets.name, `%${filters.searchTerm}%`));
	}
	if (filters.mimeType) {
		conditions = and(conditions, eq(assets.mimeType, filters.mimeType));
	}
	if (filters.createdAt) {
		conditions = and(conditions, eq(assets.createdAt, filters.createdAt));
	}

	return await db
		.select({
			id: assets.id,
			noteId: assets.noteId,
			name: assets.name,
			mimeType: assets.mimeType,
			size: assets.size,
			uploadedBy: assets.uploadedBy,
			path: assets.path,
			createdAt: assets.createdAt,
			noteName: notes.name,
		})
		.from(assets)
		.innerJoin(notes, eq(assets.noteId, notes.id))
		.where(conditions)
		.orderBy(desc(assets.createdAt));
};
