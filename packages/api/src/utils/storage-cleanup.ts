import { deleteCachedUserQuota } from "@nota/cache/user_quota";
import {
	getNoteCleanableStorage,
	getWorkspaceCleanableStorage,
} from "@nota/db/data/storage_cleanup";
import { decrementUserStorage } from "@nota/db/data/user_quota";
import { env } from "@nota/env/server";
import { S3Client } from "bun";

let s3Client: S3Client | null = null;

export const getS3Client = (): S3Client => {
	if (!s3Client) {
		s3Client = new S3Client({
			accessKeyId: env.R2_ACCESS_KEY_ID,
			secretAccessKey: env.R2_SECRET_ACCESS_KEY,
			endpoint: env.R2_ENDPOINT_URL,
			bucket: env.R2_BUCKET_NAME,
		});
	}
	return s3Client;
};

/**
 * Free all storage (R2 assets + snapshots size) associated with a note and its descendants,
 * and decrement the owner's usedStorageBytes in user_quota.
 */
export const cleanupNoteStorage = async (
	noteId: string,
	ownerId: string,
): Promise<{ freedAssetsBytes: number; freedSnapshotsBytes: number }> => {
	try {
		const { assets, totalAssetsSize, totalSnapshotsSize, totalFreedBytes } =
			await getNoteCleanableStorage(noteId);

		// Delete asset files from S3/R2
		const s3 = getS3Client();
		for (const asset of assets) {
			const objectKey = asset.path.split("/").slice(-3).join("/");
			try {
				await s3.delete(objectKey);
			} catch (e) {
				console.error(`Failed to delete S3 asset ${objectKey}:`, e);
			}
		}

		if (totalFreedBytes > 0) {
			await decrementUserStorage(ownerId, totalFreedBytes);
			void deleteCachedUserQuota(ownerId).catch(console.error);
		}

		return {
			freedAssetsBytes: totalAssetsSize,
			freedSnapshotsBytes: totalSnapshotsSize,
		};
	} catch (error) {
		console.error("Failed to cleanup note storage:", error);
		return { freedAssetsBytes: 0, freedSnapshotsBytes: 0 };
	}
};

/**
 * Free all storage (R2 assets + snapshots size) associated with all notes in a workspace,
 * and decrement the owner's usedStorageBytes in user_quota.
 */
export const cleanupWorkspaceStorage = async (
	workspaceId: string,
	ownerId: string,
): Promise<{ freedAssetsBytes: number; freedSnapshotsBytes: number }> => {
	try {
		const { assets, totalAssetsSize, totalSnapshotsSize, totalFreedBytes } =
			await getWorkspaceCleanableStorage(workspaceId);

		// Delete asset files from S3/R2
		const s3 = getS3Client();
		for (const asset of assets) {
			const objectKey = asset.path.split("/").slice(-3).join("/");
			try {
				await s3.delete(objectKey);
			} catch (e) {
				console.error(`Failed to delete S3 asset ${objectKey}:`, e);
			}
		}

		if (totalFreedBytes > 0) {
			await decrementUserStorage(ownerId, totalFreedBytes);
			void deleteCachedUserQuota(ownerId).catch(console.error);
		}

		return {
			freedAssetsBytes: totalAssetsSize,
			freedSnapshotsBytes: totalSnapshotsSize,
		};
	} catch (error) {
		console.error("Failed to cleanup workspace storage:", error);
		return { freedAssetsBytes: 0, freedSnapshotsBytes: 0 };
	}
};
