import { getUserQuota, selectUserQuotaSchema } from "@nota/db/data/user_quota";
import type { UserQuota } from "@nota/db/types";
import { cache } from ".";

const USER_QUOTA_CACHE_PREFIX = "user_quota";
const USER_QUOTA_CACHE_TTL_SECONDS = 60 * 60 * 24; // 24 hours

const getUserQuotaCacheKey = (userId: string) =>
	`${USER_QUOTA_CACHE_PREFIX}:${userId}`;

/**
 * Get cached user quota
 * @param userId User ID
 * @returns UserQuota or null if cache miss / invalid
 */
export const getCachedUserQuota = async (
	userId: string,
): Promise<UserQuota | null> => {
	const key = getUserQuotaCacheKey(userId);
	const data = await cache.get<UserQuota>(key);
	if (!data) return null;
	try {
		const parsed = {
			...data,
			updatedAt: new Date(data.updatedAt),
		};
		return selectUserQuotaSchema.parse(parsed);
	} catch (error) {
		console.error("Failed to parse user quota cache:", error);
		return null;
	}
};

/**
 * Set cached user quota
 * @param userId User ID
 * @param quota UserQuota to cache
 * @param ttlSeconds Optional TTL in seconds (defaults to 24 hours)
 */
export const setCachedUserQuota = async (
	userId: string,
	quota: UserQuota,
	ttlSeconds: number = USER_QUOTA_CACHE_TTL_SECONDS,
): Promise<void> => {
	const key = getUserQuotaCacheKey(userId);
	try {
		const validated = selectUserQuotaSchema.parse(quota);
		await cache.set(key, validated, ttlSeconds);
	} catch (error) {
		console.error("Failed to cache user quota:", error);
	}
};

/**
 * Delete cached user quota
 * @param userId User ID
 */
export const deleteCachedUserQuota = async (userId: string): Promise<void> => {
	const key = getUserQuotaCacheKey(userId);
	await cache.del(key);
};

/**
 * Get user quota using cache-aside strategy:
 * 1. Checks Redis cache
 * 2. On miss, queries DB and populates cache asynchronously
 */
export const getUserQuotaWithCache = async (
	userId: string,
): Promise<UserQuota | null> => {
	const cached = await getCachedUserQuota(userId);
	if (cached) return cached;

	const quota = await getUserQuota(userId);
	if (quota) {
		void setCachedUserQuota(userId, quota).catch(console.error);
		return quota;
	}
	return null;
};

/**
 * Check if a user has a Pro plan using cache-aside optimization (Redis first, then DB).
 */
export const isUserPro = async (userId: string): Promise<boolean> => {
	const quota = await getUserQuotaWithCache(userId);
	return quota?.planTier === "pro";
};

const WEBHOOK_EVENT_CACHE_PREFIX = "polar:event";
const WEBHOOK_EVENT_TTL_SECONDS = 60 * 60 * 24; // 24 hours

/**
 * Acquire an atomic lock for a webhook event to ensure idempotency.
 * Returns true if this is the first time the event is being processed.
 * Returns false if the event has already been processed or is currently being processed.
 * @param eventId Unique identifier for the event (e.g. order.id or subscription.id + action)
 * @param ttlSeconds TTL in seconds (default: 24 hours)
 */
export const acquireWebhookEventLock = async (
	eventId: string,
	ttlSeconds: number = WEBHOOK_EVENT_TTL_SECONDS,
): Promise<boolean> => {
	try {
		const key = `${WEBHOOK_EVENT_CACHE_PREFIX}:${eventId}`;
		const { redis } = await import("bun");
		const nxRes = await redis.set(key, "1", "EX", ttlSeconds.toString(), "NX");
		return nxRes === "OK";
	} catch (error) {
		console.error(
			`Failed to acquire webhook lock for event ${eventId}:`,
			error,
		);
		return true;
	}
};
