import { getCachedAiLedger, setCachedAiLedger } from "@nota/cache/ai_ledger";
import { getAILedger } from "@nota/db/data/ai_ledger";
import { z } from "zod";
import { protectedProcedure } from "../index";

export const aiRouter = {
	getLedger: protectedProcedure
		.input(
			z
				.object({
					limit: z.number().int().min(1).max(100).optional().default(20),
					offset: z.number().int().min(0).optional().default(0),
					order: z.enum(["asc", "desc"]).optional().default("desc"),
				})
				.optional()
				.default({ limit: 20, offset: 0, order: "desc" }),
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const { limit = 20, offset = 0, order = "desc" } = input ?? {};

			// Try cache first
			const cacheOpts = { userId, limit, offset };
			const cached = await getCachedAiLedger(cacheOpts).catch(() => null);
			if (cached) return cached as Awaited<ReturnType<typeof getAILedger>>;

			// Fetch from DB
			const result = await getAILedger(userId, { limit, offset, order });

			// Set cache in background
			void setCachedAiLedger(cacheOpts, result).catch(() => {});

			return result;
		}),
};
