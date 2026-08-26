import { eq, sql } from "drizzle-orm";
import { createSelectSchema } from "drizzle-orm/zod";
import { db, type UserQuota } from "..";
import { userQuota } from "../schema/app";

export const DEFAULT_FREE_STORAGE_BYTES = 524_288_000; // 500 MB (500 * 1024 * 1024)
export const PRO_STORAGE_BYTES = 5_368_709_120; // 5 GB (5 * 1024 * 1024 * 1024)
export const AI_CREDIT_TOPUP_CENTS = 500; // $5.00 in cents

export const selectUserQuotaSchema = createSelectSchema(userQuota);

/**
 * Get user quota.
 * @param userId user id
 * @returns user quota
 */
export const getUserQuota = async (
	userId: string,
): Promise<UserQuota | undefined> => {
	const quota = await db.query.userQuota.findFirst({
		where: { userId },
	});
	return quota;
};

/**
 * Check if user quota for pro plan
 * @param userId user id
 * @returns true if user is pro, false otherwise
 */
export const isUserPro = async (userId: string): Promise<boolean> => {
	const quota = await db.query.userQuota.findFirst({
		where: { userId },
		columns: { planTier: true },
	});
	return quota?.planTier === "pro";
};

/**
 * Increment the user's used storage by a given size in bytes.
 * Throws an error if the user has exceeded their storage limit.
 * @param userId user id
 * @param size bytes to add
 */
export const incrementUserStorage = async (userId: string, size: number) => {
	const quota = await db.query.userQuota.findFirst({
		where: { userId },
		columns: {
			usedStorageBytes: true,
			assignedStorageBytes: true,
			planTier: true,
		},
	});

	if (!quota) {
		throw new Error("User quota not found");
	}

	const newUsed = quota.usedStorageBytes + size;

	// Hardlock if they exceed assigned storage.
	if (newUsed > quota.assignedStorageBytes) {
		throw new Error("Storage limit exceeded. Upgrade to Pro for more storage.");
	}

	await db
		.update(userQuota)
		.set({
			usedStorageBytes: sql`${userQuota.usedStorageBytes} + ${size}`,
		})
		.where(eq(userQuota.userId, userId));
};

/**
 * Decrement the user's used storage by a given size in bytes.
 * Ensures used storage never goes below 0.
 * @param userId user id
 * @param size bytes to subtract
 */
export const decrementUserStorage = async (userId: string, size: number) => {
	await db
		.update(userQuota)
		.set({
			usedStorageBytes: sql`GREATEST(0, ${userQuota.usedStorageBytes} - ${size})`,
			updatedAt: new Date(),
		})
		.where(eq(userQuota.userId, userId));
};

/**
 * Add AI credits in cents to a user's quota balance.
 * Uses atomic SQL increment with upsert fallback.
 * @param userId User ID
 * @param amountCents Amount of credits in cents (e.g. 500 for 5 USD)
 */
export const addAiCredits = async (
	userId: string,
	amountCents: number,
): Promise<UserQuota> => {
	const [result] = await db
		.insert(userQuota)
		.values({
			userId,
			aiCreditBalanceCents: amountCents,
			planTier: "free",
			assignedStorageBytes: DEFAULT_FREE_STORAGE_BYTES,
			usedStorageBytes: 0,
			updatedAt: new Date(),
		})
		.onConflictDoUpdate({
			target: userQuota.userId,
			set: {
				aiCreditBalanceCents: sql`${userQuota.aiCreditBalanceCents} + ${amountCents}`,
				updatedAt: new Date(),
			},
		})
		.returning();

	if (!result) {
		throw new Error("Failed to add AI credits");
	}
	return result;
};

/**
 * Update user's plan tier and assigned storage limit.
 * @param userId User ID
 * @param tier "free" | "pro"
 * @param assignedStorageBytes Optional custom storage limit in bytes (defaults to 5GB for pro, 500MB for free)
 */
export const setUserPlanTier = async (
	userId: string,
	tier: "free" | "pro",
	assignedStorageBytes?: number,
): Promise<UserQuota> => {
	const storage =
		assignedStorageBytes ??
		(tier === "pro" ? PRO_STORAGE_BYTES : DEFAULT_FREE_STORAGE_BYTES);

	const [result] = await db
		.insert(userQuota)
		.values({
			userId,
			planTier: tier,
			assignedStorageBytes: storage,
			aiCreditBalanceCents: 0,
			usedStorageBytes: 0,
			updatedAt: new Date(),
		})
		.onConflictDoUpdate({
			target: userQuota.userId,
			set: {
				planTier: tier,
				assignedStorageBytes: storage,
				updatedAt: new Date(),
			},
		})
		.returning();

	if (!result) {
		throw new Error("Failed to set user plan tier");
	}
	return result;
};

/**
 * Find internal user ID given Polar customer externalId or email.
 * @param externalId Polar externalCustomerId (typically our userId)
 * @param email Customer email fallback
 */
export const findUserIdByCustomerOrEmail = async (
	externalId?: string | null,
	email?: string | null,
): Promise<string | null> => {
	if (externalId) {
		const existingUser = await db.query.user.findFirst({
			where: { id: externalId },
			columns: { id: true },
		});
		if (existingUser) return existingUser.id;
	}

	if (email) {
		const existingUser = await db.query.user.findFirst({
			where: { email },
			columns: { id: true },
		});
		if (existingUser) return existingUser.id;
	}

	return null;
};
