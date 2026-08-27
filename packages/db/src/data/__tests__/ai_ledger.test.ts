import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../../index";
import { userQuota } from "../../schema/app";
import {
	getAILedger,
	insertAILedger,
	recordAiUsageAndDeduct,
} from "../ai_ledger";
import { getUserQuota } from "../user_quota";
import { cleanupTestData, createTestUser } from "./setup";

describe("Database - AI Ledger", () => {
	const userId = "test_ai_ledger_user_1";

	beforeAll(async () => {
		await cleanupTestData();
		await createTestUser(userId, "AI Ledger User");
		// Give user some initial AI credits (1000 cents = $10)
		await db
			.update(userQuota)
			.set({ aiCreditBalanceCents: "1000.000000" as unknown as string })
			.where(eq(userQuota.userId, userId));
	});

	afterAll(async () => {
		await cleanupTestData();
	});

	test("insertAILedger should insert a ledger row", async () => {
		const result = await insertAILedger({
			userId,
			inputTokens: 100,
			outputTokens: 200,
			usedInputCost: "0.010000",
			usedOutputCost: "0.030000",
			totalCostCents: "0.040000",
			description: "Test insertion",
		});

		expect(result).toBeDefined();
		expect(result.userId).toBe(userId);
		expect(result.inputTokens).toBe(100);
		expect(result.outputTokens).toBe(200);
		expect(result.totalCostCents).toBe("0.040000");
		expect(result.description).toBe("Test insertion");
	});

	test("getAILedger should retrieve paginated rows", async () => {
		// Insert another to test multiple
		await insertAILedger({
			userId,
			inputTokens: 50,
			outputTokens: 50,
			usedInputCost: "0.005000",
			usedOutputCost: "0.007500",
			totalCostCents: "0.012500",
			description: "Second insertion",
		});

		const result = await getAILedger(userId, {
			limit: 10,
			offset: 0,
			order: "desc",
		});
		expect(result.items.length).toBe(2);
		expect(result.total).toBe(2);
		expect(result.limit).toBe(10);
		expect(result.offset).toBe(0);
		// With desc order, the newest (Second insertion) should be first
		expect(result.items[0]?.description).toBe("Second insertion");
		expect(result.items[1]?.description).toBe("Test insertion");
	});

	test("recordAiUsageAndDeduct should atomically insert and deduct credits", async () => {
		const initialQuota = await getUserQuota(userId);
		expect(initialQuota?.aiCreditBalanceCents).toBe("1000.000000");

		const result = await recordAiUsageAndDeduct({
			userId,
			inputTokens: 1000,
			outputTokens: 2000,
			usedInputCost: "0.200000",
			usedOutputCost: "0.600000",
			totalCostCents: "0.800000",
			description: "Atomic deduction",
		});

		expect(result).toBeDefined();
		expect(result.description).toBe("Atomic deduction");

		const updatedQuota = await getUserQuota(userId);
		// 1000 - 0.8 = 999.2
		expect(updatedQuota?.aiCreditBalanceCents).toBe("999.200000");
	});
});
