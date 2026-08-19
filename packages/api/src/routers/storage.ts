import { createAsset } from "@nota/db/data/assets";
import { getNotesMeta } from "@nota/db/data/notes";
import { getNoteUserPermission } from "@nota/db/data/permissions";
import { incrementUserStorage } from "@nota/db/data/user_quota";
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
			region: env.R2_REGION,
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
			const objectKey = `${note.workspaceId}/${input.noteId}/${nanoid()}-${input.name}`;

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
};
