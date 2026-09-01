import { auth } from "@nota/auth";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../index";

export const authRouter = {
	setPassword: protectedProcedure
		.input(
			z.object({
				newPassword: z
					.string()
					.min(8, "Password must be at least 8 characters long"),
			}),
		)
		.handler(async ({ context, input }) => {
			try {
				const res = await auth.api.setPassword({
					body: {
						newPassword: input.newPassword,
					},
					headers: context.headers,
				});
				return res;
			} catch (err: unknown) {
				const message =
					err instanceof Error ? err.message : "Failed to set password";
				console.error("[authRouter.setPassword] Error:", err);
				throw new ORPCError("BAD_REQUEST", {
					message,
				});
			}
		}),
};
