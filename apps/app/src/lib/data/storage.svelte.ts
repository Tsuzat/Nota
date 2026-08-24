import {
	deleteAsset as deleteLocalAssetDb,
	getLocalAssets as getLocalAssetsDb,
} from "@nota/db-local/data/assets";
import { getWorkspaceSnapshots as getLocalWorkspaceSnapshotsDb } from "@nota/db-local/data/note_snapshot";
import { client, orpc, queryClient } from "#lib/orpc.ts";
import { ISDESKTOP } from "#lib/utils.ts";

export interface UnifiedAssetItem {
	id: string;
	noteId: string;
	name: string;
	mimeType: string;
	size: number;
	path?: string;
	uploadedBy?: string;
	createdAt: Date;
	noteName: string | null;
	noteIcon: string | null;
	workspaceId: string | null;
	workspaceName: string | null;
	isCloud: boolean;
}

export interface StorageFilterOptions {
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

export interface UnifiedStorageStats {
	quota?: {
		userId: string;
		planTier: "free" | "pro";
		aiCreditBalanceCents: number;
		assignedStorageBytes: number;
		usedStorageBytes: number;
		updatedAt: Date;
	};
	media: {
		count: number;
		sizeBytes: number;
	};
	snapshots: {
		count: number;
		sizeBytes: number;
	};
	totalUsedBytes: number;
}

export class StorageManager {
	async fetchAssets(
		isCloud: boolean,
		options: StorageFilterOptions = {},
	): Promise<{
		items: UnifiedAssetItem[];
		total: number;
		totalSizeBytes: number;
	}> {
		if (isCloud) {
			const res = await client.storage.listAssets(options);
			return {
				items: res.items.map((item) => ({
					...item,
					createdAt: new Date(item.createdAt),
					isCloud: true,
				})),
				total: res.total,
				totalSizeBytes: res.totalSizeBytes,
			};
		}

		if (!ISDESKTOP) {
			return { items: [], total: 0, totalSizeBytes: 0 };
		}

		const res = await getLocalAssetsDb({
			workspaceId: options.workspaceId,
			noteId: options.noteId,
			search: options.searchTerm,
			mimeType: options.mimeType,
			limit: options.limit,
			offset: options.offset,
			sortBy: options.sortBy,
			sortOrder: options.sortOrder,
		});

		return {
			items: res.items.map((item) => ({
				...item,
				createdAt: new Date(item.createdAt),
				isCloud: false,
			})),
			total: res.total,
			totalSizeBytes: res.totalSizeBytes,
		};
	}

	async fetchStats(
		isCloud: boolean,
		workspaceId?: string,
	): Promise<UnifiedStorageStats> {
		if (isCloud) {
			const res = await client.storage.getStats({ workspaceId });
			return {
				...res,
				quota: res.quota
					? { ...res.quota, updatedAt: new Date(res.quota.updatedAt) }
					: undefined,
			};
		}

		if (!ISDESKTOP) {
			return {
				media: { count: 0, sizeBytes: 0 },
				snapshots: { count: 0, sizeBytes: 0 },
				totalUsedBytes: 0,
			};
		}

		const assetsRes = await getLocalAssetsDb({ workspaceId, limit: 1 });
		const snapshotsRes = await getLocalWorkspaceSnapshotsDb(workspaceId, {
			limit: 1,
		});

		const totalMediaSize = assetsRes.totalSizeBytes;
		const totalSnapshotsSize = snapshotsRes.totalSizeBytes;

		return {
			media: { count: assetsRes.total, sizeBytes: totalMediaSize },
			snapshots: { count: snapshotsRes.total, sizeBytes: totalSnapshotsSize },
			totalUsedBytes: totalMediaSize + totalSnapshotsSize,
		};
	}

	async deleteAsset(assetId: string, isCloud: boolean): Promise<void> {
		if (isCloud) {
			await client.storage.deleteAsset({ assetId });
			queryClient.invalidateQueries({
				queryKey: orpc.storage.listAssets.key(),
			});
			queryClient.invalidateQueries({ queryKey: orpc.storage.getStats.key() });
			queryClient.invalidateQueries({ queryKey: orpc.userquota.key() });
			return;
		}

		if (!ISDESKTOP) return;

		await deleteLocalAssetDb(assetId);
	}
}

export const storageManager = new StorageManager();
