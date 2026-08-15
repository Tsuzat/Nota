import {
  fetchUserWorkspaces,
  createWorkspace,
  getUserWorkspaceCount,
  insertWorkspaceSchema,
  updateWorkspaceSchema,
  updateWorkspace,
  isUserOwnerOfWorkspace,
  deleteWorkspace,
} from "@nota/db/data/workspace";
import { isUserPro } from "@nota/db/data/user_quota";
import { protectedProcedure } from "../index";

import { ORPCError } from "@orpc/server";
import z from "zod";

export const workspaceRouter = {
  fetchUsers: protectedProcedure.handler(async ({ context }) => {
    try {
      return await fetchUserWorkspaces(context.session.user.id);
    } catch (err) {
      console.error("fetchUserWorkspaces failed", {
        userId: context.session.user.id,
        err,
      });
      if (err instanceof z.ZodError) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Data integrity error",
        });
      }
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to fetch workspaces",
      });
    }
  }),
  create: protectedProcedure
    .input(insertWorkspaceSchema.omit({ id: true, ownerId: true }))
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;
      const count = await getUserWorkspaceCount(userId);
      const isPro = await isUserPro(userId);
      if (!isPro && count >= 10) {
        throw new ORPCError("LIMIT_EXCEEDED", {
          message: "You have reached the maximum number of workspaces",
        });
      }
      try {
        return await createWorkspace({
          ownerId: userId,
          name: input.name,
        });
      } catch (err) {
        console.error("createWorkspace failed", {
          userId: context.session.user.id,
          err,
        });
        if (err instanceof z.ZodError) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Data integrity error",
          });
        }
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to create workspace",
        });
      }
    }),

  update: protectedProcedure
    .input(
      updateWorkspaceSchema
        .omit({ ownerId: true, updatedAt: true })
        .required({ id: true }),
    )
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;
      try {
        const isUserOwner = await isUserOwnerOfWorkspace(userId, input.id);
        if (!isUserOwner) {
          throw new ORPCError("UNAUTHORIZED", {
            message: "User is not the owner of the workspace",
          });
        }
        return await updateWorkspace(input);
      } catch (err) {
        console.error("updateWorkspace failed", {
          userId: context.session.user.id,
          err,
        });
        if (err instanceof z.ZodError) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Data integrity error",
          });
        }
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to update workspace",
        });
      }
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;
      try {
        const isUserOwner = await isUserOwnerOfWorkspace(userId, input.id);
        if (!isUserOwner) {
          throw new ORPCError("UNAUTHORIZED", {
            message: "User is not the owner of the workspace",
          });
        }
        return await deleteWorkspace(input.id);
      } catch (err) {
        console.error("deleteWorkspace failed", {
          userId: context.session.user.id,
          err,
        });
        if (err instanceof z.ZodError) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Data integrity error",
          });
        }
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to delete workspace",
        });
      }
    }),
};
