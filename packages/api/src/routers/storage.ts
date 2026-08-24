import { deleteCachedUserQuota } from "@nota/cache/user_quota";
import {
	createAsset,
	deleteAsset,
	getAssetById,
	getAssets,
	getStorageStats,
} from "@nota/db/data/assets";
import { getNotesMeta } from "@nota/db/data/notes";
import { getNoteUserPermission } from "@nota/db/data/permissions";
import { incrementUserStorage } from "@nota/db/data/user_quota";
import { isWorkspaceOwner } from "@nota/db/data/workspace";
import { env } from "@nota/env/server";
import { ORPCError } from "@orpc/server";
import { S3Client } from "bun";
import { nanoid } from "nanoid";
import { z } from "zod";
import { protectedProcedure } from "../index";

let s3Client: S3Client | null = null;
const getS3Client = () => {
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

export const storageRouter = {
	uploadFile: protectedProcedure
		.input(
			z.object({
				noteId: z.string(),
				name: z.string(),
				mimeType: z.string(),
				size: z.number().int().positive(),
			}),
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const perm = await getNoteUserPermission(input.noteId, userId);

			if (!perm) {
				throw new ORPCError("NOT_FOUND", { message: "Note not found" });
			}

			if (!perm.isOwner && perm.role !== "editor" && perm.role !== "admin") {
				throw new ORPCError("UNAUTHORIZED", {
					message: "You are not authorized to upload files to this note",
				});
			}

			// Generate an object key for the file
			const note = await getNotesMeta(input.noteId);
			if (!note) {
				throw new ORPCError("NOT_FOUND", { message: "Note meta not found" });
			}
			const objectKey = `${note.workspaceId}/${input.noteId}/${nanoid(12)}-${input.name}`;
			const publicUrl = `${env.R2_PUBLIC_URL}/${objectKey}`;

			// Generate presigned URL
			const s3 = getS3Client();
			const signedUrl = s3.presign(objectKey, {
				method: "PUT",
				type: input.mimeType,
				expiresIn: 3600, // 1 hour
			});

			return {
				signedUrl,
				objectKey,
				publicUrl,
			};
		}),

	confirm: protectedProcedure
		.input(
			z.object({
				noteId: z.string(),
				name: z.string(),
				mimeType: z.string(),
				size: z.number().int().positive(),
				path: z.string(),
			}),
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const perm = await getNoteUserPermission(input.noteId, userId);

			if (!perm) {
				throw new ORPCError("NOT_FOUND", { message: "Note not found" });
			}

			if (!perm.isOwner && perm.role !== "editor" && perm.role !== "admin") {
				throw new ORPCError("UNAUTHORIZED", {
					message: "You are not authorized to upload files to this note",
				});
			}

			const note = await getNotesMeta(input.noteId);
			if (!note) {
				throw new ORPCError("NOT_FOUND", { message: "Note meta not found" });
			}

			// Charge the quota to the note owner
			try {
				await incrementUserStorage(note.ownerId, input.size);
			} catch (error) {
				throw new ORPCError("BAD_REQUEST", {
					message:
						error instanceof Error ? error.message : "Storage limit exceeded",
				});
			}

			const asset = await createAsset({
				noteId: input.noteId,
				name: input.name,
				mimeType: input.mimeType,
				size: input.size,
				uploadedBy: userId,
				path: input.path,
			});

			return asset;
		}),

	listAssets: protectedProcedure
		.input(
			z.object({
				workspaceId: z.string().optional(),
				noteId: z.string().optional(),
				searchTerm: z.string().optional(),
				mimeType: z.string().optional(),
				minSize: z.number().optional(),
				maxSize: z.number().optional(),
				limit: z.number().min(1).max(100).default(20),
				offset: z.number().min(0).default(0),
				sortBy: z.enum(["createdAt", "name", "size"]).default("createdAt"),
				sortOrder: z.enum(["asc", "desc"]).default("desc"),
			}),
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			if (input.workspaceId) {
				const isOwner = await isWorkspaceOwner(input.workspaceId, userId);
				if (!isOwner) {
					throw new ORPCError("UNAUTHORIZED", {
						message: "You are not authorized to view assets for this workspace",
					});
				}
			}
			const result = await getAssets({ ...input, userId });
			return {
				...result,
				items: result.items.map((item) => ({
					...item,
					path: item.path.startsWith("http")
						? item.path
						: `${env.R2_PUBLIC_URL}/${item.path}`,
				})),
			};
		}),

	getStats: protectedProcedure
		.input(
			z.object({
				workspaceId: z.string().optional(),
			}),
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			if (input.workspaceId) {
				const isOwner = await isWorkspaceOwner(input.workspaceId, userId);
				if (!isOwner) {
					throw new ORPCError("UNAUTHORIZED", {
						message: "You are not authorized to view stats for this workspace",
					});
				}
			}
			return await getStorageStats(userId, input.workspaceId);
		}),

	deleteAsset: protectedProcedure
		.input(
			z.object({
				assetId: z.string(),
			}),
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const asset = await getAssetById(input.assetId);
			if (!asset) {
				throw new ORPCError("NOT_FOUND", { message: "Asset not found" });
			}

			if (asset.workspaceOwnerId !== userId && asset.uploadedBy !== userId) {
				throw new ORPCError("UNAUTHORIZED", {
					message: "You are not authorized to delete this asset",
				});
			}

			// Delete from S3
			const s3 = getS3Client();
			// Reconstruct object key (workspaceId/noteId/...)
			const objectKey = asset.path.split("/").slice(-3).join("/"); // Basic heuristic or we could extract it from path if it's the full url
			try {
				await s3.delete(objectKey);
			} catch (e) {
				console.error("Failed to delete from S3:", e);
			}

			const deleted = await deleteAsset(input.assetId);

			if (deleted) {
				// We don't have decrement in assets so it's done elsewhere?
				// Actually wait, assets don't have decrement trigger right now.
				// We should decrement the owner quota.
				const { decrementUserStorage } = await import(
					"@nota/db/data/user_quota"
				);
				await decrementUserStorage(asset.workspaceOwnerId, asset.size).catch(
					console.error,
				);
				void deleteCachedUserQuota(asset.workspaceOwnerId).catch(console.error);
			}

			return { success: !!deleted };
		}),
};
