import { eq, sql } from "drizzle-orm";
import { db, type UserQuota } from "..";
import { userQuota } from "../schema/app";

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
export const isUserPro = async (userId: string) => {
	const userQuota = await db.query.userQuota.findFirst({
		where: { userId },
		columns: { planTier: true },
	});
	return userQuota?.planTier === "pro";
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

	// Hardlock if they are free tier and exceed assigned storage.
	// You might also want to hardlock pro tier if they have a cap, or assume it's unlimited / capped later.
	// We'll enforce the limit regardless of tier if it exceeds assignedStorageBytes, since assignedStorageBytes can be larger for Pro.
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
