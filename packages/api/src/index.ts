import { ORPCError, os } from "@orpc/server";

import type { Context } from "./context";

export const o = os.$context<Context>();

const errorMiddleware = o.middleware(async ({ next }) => {
	try {
		return await next();
	} catch (err) {
		if (err instanceof ORPCError) throw err;
		console.error("unhandled procedure error", { err });
		throw new ORPCError("INTERNAL_SERVER_ERROR");
	}
});

export const publicProcedure = o.use(errorMiddleware);

const requireAuth = o.middleware(async ({ context, next }) => {
	if (!context.session?.user) {
		throw new ORPCError("UNAUTHORIZED");
	}
	return next({
		context: {
			session: context.session,
			headers: context.headers,
		},
	});
});

export const protectedProcedure = publicProcedure.use(requireAuth);
