import { auth } from "@nota/auth";
import type { Context as HonoContext } from "hono";

export type CreateContextOptions = {
	context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions) {
	const session = await auth.api.getSession({
		headers: context.req.raw.headers,
	});
	return {
		auth: null,
		session,
		headers: context.req.raw.headers,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
