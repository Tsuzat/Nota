import {
	and,
	asc,
	desc,
	eq,
	gte,
	ilike,
	lte,
	or,
	type SQL,
	sql,
} from "drizzle-orm";
import { db } from "..";
import {
	assets,
	noteSnapshots,
	notes,
	userQuota,
	workspace,
} from "../schema/app";

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
	if (!asset) {
		throw new Error("Failed to insert asset");
	}
	return asset;
};

export const deleteAsset = async (id: string) => {
	const [deleted] = await db
		.delete(assets)
		.where(eq(assets.id, id))
		.returning();
	return deleted;
};

export interface AssetWithMeta {
	id: string;
	noteId: string;
	name: string;
	mimeType: string;
	size: number;
	uploadedBy: string;
	path: string;
	createdAt: Date;
	noteName: string;
	noteIcon: string | null;
	workspaceId: string;
	workspaceName: string;
}

export interface GetAssetsFilter {
	userId: string;
	workspaceId?: string;
	noteId?: string;
	searchTerm?: string;
	mimeType?: string;
	minSize?: number;
	maxSize?: number;
	limit?: number;
	offset?: number;
	sortBy?: "createdAt" | "name" | "size";
	sortOrder?: "asc" | "desc";
}

/**
 * Fetch asset with joined note and workspace metadata by ID
 */
export const getAssetById = async (id: string) => {
	const [data] = await db
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
			noteOwnerId: notes.ownerId,
			workspaceId: notes.workspaceId,
			workspaceOwnerId: workspace.ownerId,
			workspaceName: workspace.name,
		})
		.from(assets)
		.innerJoin(notes, eq(assets.noteId, notes.id))
		.innerJoin(workspace, eq(notes.workspaceId, workspace.id))
		.where(eq(assets.id, id))
		.limit(1);

	return data ?? null;
};

/**
 * Get assets with filters, search, pagination, and sorting for cloud storage management.
 */
export const getAssets = async (
	filters: GetAssetsFilter,
): Promise<{
	items: AssetWithMeta[];
	total: number;
	totalSizeBytes: number;
}> => {
	const {
		userId,
		workspaceId,
		noteId,
		searchTerm,
		mimeType,
		minSize,
		maxSize,
		limit = 20,
		offset = 0,
		sortBy = "createdAt",
		sortOrder = "desc",
	} = filters;

	const conditions: (SQL | undefined)[] = [];

	// Workspace scope or all workspaces owned by the user / uploaded by user
	if (workspaceId) {
		conditions.push(eq(notes.workspaceId, workspaceId));
	} else {
		conditions.push(
			or(eq(workspace.ownerId, userId), eq(assets.uploadedBy, userId)),
		);
	}

	if (noteId) {
		conditions.push(eq(assets.noteId, noteId));
	}

	if (searchTerm) {
		conditions.push(
			sql`(${assets.name} ILIKE ${`%${searchTerm}%`} OR ${notes.name} ILIKE ${`%${searchTerm}%`})`,
		);
	}

	if (mimeType) {
		conditions.push(ilike(assets.mimeType, `${mimeType}%`));
	}

	if (minSize !== undefined) {
		conditions.push(gte(assets.size, minSize));
	}

	if (maxSize !== undefined) {
		conditions.push(lte(assets.size, maxSize));
	}

	const whereClause = and(
		...conditions.filter((c): c is SQL => c !== undefined),
	);

	// Total count & total size
	const [aggregate] = await db
		.select({
			count: sql<number>`count(*)::int`,
			totalSize: sql<number>`COALESCE(sum(${assets.size}), 0)::bigint`,
		})
		.from(assets)
		.innerJoin(notes, eq(assets.noteId, notes.id))
		.innerJoin(workspace, eq(notes.workspaceId, workspace.id))
		.where(whereClause);

	const total = aggregate?.count ?? 0;
	const totalSizeBytes = Number(aggregate?.totalSize ?? 0);

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
			uploadedBy: assets.uploadedBy,
			path: assets.path,
			createdAt: assets.createdAt,
			noteName: notes.name,
			noteIcon: notes.icon,
			workspaceId: notes.workspaceId,
			workspaceName: workspace.name,
		})
		.from(assets)
		.innerJoin(notes, eq(assets.noteId, notes.id))
		.innerJoin(workspace, eq(notes.workspaceId, workspace.id))
		.where(whereClause)
		.orderBy(orderClause)
		.limit(limit)
		.offset(offset);

	return {
		items: rows,
		total,
		totalSizeBytes,
	};
};

/**
 * Legacy compatibility wrapper for getAssetsByWorkspace
 */
export const getAssetsByWorkspace = async (filters: {
	workspaceId: string;
	noteId?: string;
	searchTerm?: string;
	createdAt?: Date;
	mimeType?: string;
}) => {
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

/**
 * Aggregated storage stats for a user / workspace
 */
export const getStorageStats = async (userId: string, workspaceId?: string) => {
	// 1. User Quota
	const [quota] = await db
		.select()
		.from(userQuota)
		.where(eq(userQuota.userId, userId))
		.limit(1);

	// 2. Media aggregation
	const mediaConditions = workspaceId
		? [eq(notes.workspaceId, workspaceId)]
		: [eq(workspace.ownerId, userId)];

	const [mediaAgg] = await db
		.select({
			count: sql<number>`count(*)::int`,
			totalSize: sql<number>`COALESCE(sum(${assets.size}), 0)::bigint`,
		})
		.from(assets)
		.innerJoin(notes, eq(assets.noteId, notes.id))
		.innerJoin(workspace, eq(notes.workspaceId, workspace.id))
		.where(and(...mediaConditions));

	// 3. Snapshots aggregation
	const snapshotConditions = workspaceId
		? [eq(notes.workspaceId, workspaceId)]
		: [eq(workspace.ownerId, userId)];

	const [snapshotAgg] = await db
		.select({
			count: sql<number>`count(*)::int`,
			totalSize: sql<number>`COALESCE(sum(${noteSnapshots.size}), 0)::bigint`,
		})
		.from(noteSnapshots)
		.innerJoin(notes, eq(noteSnapshots.noteId, notes.id))
		.innerJoin(workspace, eq(notes.workspaceId, workspace.id))
		.where(and(...snapshotConditions));

	const mediaCount = mediaAgg?.count ?? 0;
	const mediaSizeBytes = Number(mediaAgg?.totalSize ?? 0);
	const snapshotsCount = snapshotAgg?.count ?? 0;
	const snapshotsSizeBytes = Number(snapshotAgg?.totalSize ?? 0);

	return {
		quota: quota ?? {
			userId,
			planTier: "free" as const,
			aiCreditBalanceCents: 0,
			assignedStorageBytes: 524_288_000,
			usedStorageBytes: mediaSizeBytes + snapshotsSizeBytes,
			updatedAt: new Date(),
		},
		media: {
			count: mediaCount,
			sizeBytes: mediaSizeBytes,
		},
		snapshots: {
			count: snapshotsCount,
			sizeBytes: snapshotsSizeBytes,
		},
		totalUsedBytes: mediaSizeBytes + snapshotsSizeBytes,
	};
};
