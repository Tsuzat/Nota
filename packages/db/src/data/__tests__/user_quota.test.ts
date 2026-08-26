import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
	AI_CREDIT_TOPUP_CENTS,
	addAiCredits,
	DEFAULT_FREE_STORAGE_BYTES,
	decrementUserStorage,
	findUserIdByCustomerOrEmail,
	getUserQuota,
	incrementUserStorage,
	isUserPro,
	PRO_STORAGE_BYTES,
	setUserPlanTier,
} from "../user_quota";
import { cleanupTestData, createTestUser } from "./setup";

describe("Database - User Quota", () => {
	const userId = "test_quota_user_1";
	const userEmail = "test_quota_user_1@test.com";

	beforeAll(async () => {
		await cleanupTestData();
		await createTestUser(userId, "Quota Test User");
	});

	afterAll(async () => {
		await cleanupTestData();
	});

	test("getUserQuota should retrieve initial user quota", async () => {
		const quota = await getUserQuota(userId);
		expect(quota).toBeDefined();
		expect(quota?.userId).toBe(userId);
		expect(quota?.planTier).toBe("free");
		expect(quota?.assignedStorageBytes).toBe(DEFAULT_FREE_STORAGE_BYTES);
		expect(quota?.usedStorageBytes).toBe(0);
		expect(quota?.aiCreditBalanceCents).toBe(0);
	});

	test("isUserPro should return false for free user", async () => {
		const isPro = await isUserPro(userId);
		expect(isPro).toBe(false);
	});

	test("incrementUserStorage and decrementUserStorage should modify storage correctly", async () => {
		// Increment by 1000 bytes
		await incrementUserStorage(userId, 1000);
		let quota = await getUserQuota(userId);
		expect(quota?.usedStorageBytes).toBe(1000);

		// Decrement by 400 bytes
		await decrementUserStorage(userId, 400);
		quota = await getUserQuota(userId);
		expect(quota?.usedStorageBytes).toBe(600);

		// Decrementing more than used storage should floor at 0
		await decrementUserStorage(userId, 2000);
		quota = await getUserQuota(userId);
		expect(quota?.usedStorageBytes).toBe(0);
	});

	test("incrementUserStorage should throw error when storage limit is exceeded", async () => {
		// Attempt to allocate more than assigned 500MB
		expect(
			incrementUserStorage(userId, DEFAULT_FREE_STORAGE_BYTES + 1),
		).rejects.toThrow("Storage limit exceeded");
	});

	test("addAiCredits should atomically add credits", async () => {
		const result1 = await addAiCredits(userId, AI_CREDIT_TOPUP_CENTS);
		expect(result1.aiCreditBalanceCents).toBe(500);

		const result2 = await addAiCredits(userId, AI_CREDIT_TOPUP_CENTS);
		expect(result2.aiCreditBalanceCents).toBe(1000);

		const quota = await getUserQuota(userId);
		expect(quota?.aiCreditBalanceCents).toBe(1000);
	});

	test("setUserPlanTier should upgrade user to Pro and set 5GB storage", async () => {
		const proQuota = await setUserPlanTier(userId, "pro");
		expect(proQuota.planTier).toBe("pro");
		expect(proQuota.assignedStorageBytes).toBe(PRO_STORAGE_BYTES);

		const isPro = await isUserPro(userId);
		expect(isPro).toBe(true);
	});

	test("setUserPlanTier should downgrade user to Free and reset to 500MB storage", async () => {
		const freeQuota = await setUserPlanTier(userId, "free");
		expect(freeQuota.planTier).toBe("free");
		expect(freeQuota.assignedStorageBytes).toBe(DEFAULT_FREE_STORAGE_BYTES);

		const isPro = await isUserPro(userId);
		expect(isPro).toBe(false);
	});

	test("findUserIdByCustomerOrEmail should locate user by external ID or email", async () => {
		const foundById = await findUserIdByCustomerOrEmail(userId, null);
		expect(foundById).toBe(userId);

		const foundByEmail = await findUserIdByCustomerOrEmail(null, userEmail);
		expect(foundByEmail).toBe(userId);

		const notFound = await findUserIdByCustomerOrEmail(
			"nonexistent_id",
			"nonexistent@test.com",
		);
		expect(notFound).toBeNull();
	});
});
