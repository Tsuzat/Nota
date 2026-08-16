import {
	deleteCachedUserWorkspaces,
	getCachedUserWorkspaces,
	setCachedUserWorkspaces,
} from "@nota/cache/workspace";
import { isUserPro } from "@nota/db/data/user_quota";
import {
	createWorkspace,
	deleteWorkspace,
	fetchUserWorkspaces,
	getUserWorkspaceCount,
	insertWorkspaceSchema,
	updateWorkspace,
	updateWorkspaceSchema,
} from "@nota/db/data/workspace";

import { ORPCError } from "@orpc/server";
import z from "zod";
import { protectedProcedure } from "../index";

export const workspaceRouter = {
	fetchForUser: protectedProcedure.handler(async ({ context }) => {
		const cachedWorkspaces = await getCachedUserWorkspaces(
			context.session.user.id,
		);
		if (cachedWorkspaces) {
			return cachedWorkspaces;
		}
		const workspaces = await fetchUserWorkspaces(context.session.user.id);
		// don't await this, fire and forget, so that the response is faster
		void setCachedUserWorkspaces(context.session.user.id, workspaces).catch(
			(err) => {
				console.error("Cache write failed", { err });
			},
		);
		return workspaces;
	}),
	create: protectedProcedure
		.input(insertWorkspaceSchema.omit({ id: true, ownerId: true }))
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const count = await getUserWorkspaceCount(userId);
			const isPro = await isUserPro(userId);
			if (!isPro && count >= 1) {
				throw new ORPCError("LIMIT_EXCEEDED", {
					message: "You have reached the maximum number of workspaces",
				});
			}
			const result = await createWorkspace({
				ownerId: userId,
				...input,
			});

			void deleteCachedUserWorkspaces(userId).catch((err) => {
				console.error("Cache delete failed", { err });
			});

			return result;
		}),

	update: protectedProcedure
		.input(
			updateWorkspaceSchema
				.omit({ ownerId: true, updatedAt: true })
				.required({ id: true }),
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const updated = await updateWorkspace({ ...input, ownerId: userId });
			if (!updated) {
				throw new ORPCError("NOT_FOUND", { message: "Workspace not found" });
			}
			void deleteCachedUserWorkspaces(userId).catch((err) =>
				console.error("Cache delete failed", { err }),
			);
			return updated;
		}),
	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const deleted = await deleteWorkspace(input.id, userId);
			if (!deleted) {
				throw new ORPCError("NOT_FOUND", { message: "Workspace not found" });
			}
			void deleteCachedUserWorkspaces(userId).catch((err) =>
				console.error("Cache delete failed", { err }),
			);
			return deleted;
		}),
};
