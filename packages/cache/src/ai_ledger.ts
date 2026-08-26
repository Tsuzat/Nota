import { cache } from ".";

export interface AiLedgerCacheOpts {
	userId: string;
	limit: number;
	offset: number;
}

const keyFor = (opts: AiLedgerCacheOpts) =>
	`ai_ledger:${opts.userId}:${opts.limit}:${opts.offset}`;

const TTL_SECONDS = 30;

/**
 * Simple short-lived cache for getAILedger pagination.
 * Ledger is append-mostly; 30s TTL is safe.
 */
export const getCachedAiLedger = async <T>(
	opts: AiLedgerCacheOpts,
): Promise<T | null> => {
	return cache.get<T>(keyFor(opts));
};

export const setCachedAiLedger = async <T>(
	opts: AiLedgerCacheOpts,
	data: T,
) => {
	await cache.set(keyFor(opts), data, TTL_SECONDS);
};

export const invalidateAiLedgerCache = async (userId: string) => {
	// delete common paginated keys best-effort (avoids needing SCAN)
	const { redis } = await import("bun");
	try {
		// bun redis doesn't expose scan helper, do pattern del via keys if available
		// fallback: delete first few pages explicitly
		const pattern = `ai_ledger:${userId}:*`;
		if (typeof (redis as unknown as { keys?: unknown }).keys === "function") {
			const keys =
				(await (
					redis as unknown as { keys: (p: string) => Promise<string[]> }
				).keys(pattern)) ?? [];
			for (const k of keys) await redis.del(k);
		} else {
			// best-effort first 10 pages
			for (let off = 0; off < 200; off += 20) {
				await cache.del(`ai_ledger:${userId}:20:${off}`);
			}
		}
	} catch {
		// ignore
	}
};
