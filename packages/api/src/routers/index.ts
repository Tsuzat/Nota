import type { RouterClient } from "@orpc/server";

import { protectedProcedure, publicProcedure } from "../index";
import { guestsRouter } from "./guests";
import { notesRouter } from "./notes";
import { storageRouter } from "./storage";
import { quotaRouter } from "./userquota";
import { workspaceRouter } from "./workspaces";

export const appRouter = {
	healthCheck: publicProcedure.handler(() => {
		return "OK";
	}),
	privateData: protectedProcedure.handler(({ context }) => {
		return {
			message: "This is private",
			user: context.session?.user,
		};
	}),
	workspace: workspaceRouter,
	notes: notesRouter,
	guests: guestsRouter,
	storage: storageRouter,
	userquota: quotaRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
