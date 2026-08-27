import { asc, desc, eq, sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { type AiLedger, db } from "..";
import { aiLedger, userQuota } from "../schema/app";

export const selectAiLedgerSchema = createSelectSchema(aiLedger);
export const insertAiLedgerSchema = createInsertSchema(aiLedger);

export const aiLedgerPaginationInput = z.object({
	limit: z.coerce.number().int().min(1).max(100).default(20),
	offset: z.coerce.number().int().min(0).default(0),
	order: z.enum(["asc", "desc"]).default("desc"),
});

export type AiLedgerPagination = z.infer<typeof aiLedgerPaginationInput>;

/**
 * Get paginated AI ledger rows for a user, newest first.
 */
export const getAILedger = async (
	userId: string,
	opts: Partial<AiLedgerPagination> = {},
): Promise<{
	items: AiLedger[];
	total: number;
	limit: number;
	offset: number;
}> => {
	const {
		limit = 20,
		offset = 0,
		order = "desc",
	} = aiLedgerPaginationInput.parse(opts);
	const orderFn =
		order === "asc" ? asc(aiLedger.createdAt) : desc(aiLedger.createdAt);
	const where = eq(aiLedger.userId, userId);

	const [items, totalRow] = await Promise.all([
		db
			.select()
			.from(aiLedger)
			.where(where)
			.orderBy(orderFn)
			.limit(limit)
			.offset(offset),
		db
			.select({ count: sql<number>`count(*)::int` })
			.from(aiLedger)
			.where(where)
			.then((r: { count: number }[]) => r[0]?.count ?? 0),
	]);

	return { items, total: Number(totalRow), limit, offset };
};

/**
 * Insert a single AI ledger row.
 * Expects costs as strings with up to 6 decimal places (numeric(14,6)).
 */
export const insertAILedger = async (
	data: typeof aiLedger.$inferInsert,
): Promise<AiLedger> => {
	const parsed = insertAiLedgerSchema.parse(data);
	const [row] = await db.insert(aiLedger).values(parsed).returning();
	if (!row) throw new Error("Failed to insert AI ledger");
	return row;
};

/**
 * Atomically record usage: insert ledger row and deduct user credits.
 * Deducts in a single transaction to avoid race over aiCreditBalanceCents.
 * Returns the created ledger row.
 */
export const recordAiUsageAndDeduct = async (opts: {
	userId: string;
	noteId?: string | null;
	inputTokens: number;
	outputTokens: number;
	usedInputCost: string; // numeric string 6dp
	usedOutputCost: string; // numeric string 6dp
	totalCostCents: string; // numeric string 6dp
	description?: string | null;
}): Promise<AiLedger> => {
	return await db.transaction(async (tx) => {
		const [ledger] = await tx
			.insert(aiLedger)
			.values({
				userId: opts.userId,
				noteId: opts.noteId ?? null,
				inputTokens: opts.inputTokens,
				outputTokens: opts.outputTokens,
				usedInputCost: opts.usedInputCost,
				usedOutputCost: opts.usedOutputCost,
				totalCostCents: opts.totalCostCents,
				description: opts.description ?? null,
			})
			.returning();
		if (!ledger) throw new Error("Failed to record AI usage");

		// Deduct atomically. We allow the balance to go slightly negative
		// (micro-overshoot) because the AI tokens have already been streamed
		// to the client — rolling back the ledger row would give the user
		// free output with no audit trail. The route-level pre-check already
		// blocks users with zero or negative balance from starting a new
		// generation.
		await tx
			.update(userQuota)
			.set({
				aiCreditBalanceCents: sql`${userQuota.aiCreditBalanceCents} - ${opts.totalCostCents}::numeric`,
				updatedAt: new Date(),
			})
			.where(eq(userQuota.userId, opts.userId));

		return ledger;
	});
};
