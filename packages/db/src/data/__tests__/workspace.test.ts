import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
	createWorkspace,
	deleteWorkspace,
	fetchUserWorkspaces,
	getUserWorkspaceCount,
	getWorkspaceOwnerId,
	isWorkspaceOwner,
	updateWorkspace,
} from "../workspace";
import { cleanupTestData, createTestUser } from "./setup";

describe("Database - Workspace", () => {
	const userId = "test_ws_user_1";
	const otherUserId = "test_ws_user_2";
	let workspaceId: string;

	beforeAll(async () => {
		await cleanupTestData();
		await createTestUser(userId, "Workspace User 1");
		await createTestUser(otherUserId, "Workspace User 2");
	});

	afterAll(async () => {
		await cleanupTestData();
	});

	test("createWorkspace should insert and return workspace", async () => {
		const ws = await createWorkspace({
			ownerId: userId,
			name: "Main Test Workspace",
			icon: "emoji:🚀",
		});

		expect(ws).toBeDefined();
		expect(ws.id).toBeString();
		expect(ws.ownerId).toBe(userId);
		expect(ws.name).toBe("Main Test Workspace");
		expect(ws.icon).toBe("emoji:🚀");

		workspaceId = ws.id;
	});

	test("fetchUserWorkspaces should return all workspaces for a user", async () => {
		const list = await fetchUserWorkspaces(userId);
		expect(list.length).toBeGreaterThanOrEqual(1);
		expect(list.some((w) => w.id === workspaceId)).toBe(true);

		const otherList = await fetchUserWorkspaces(otherUserId);
		expect(otherList.length).toBe(0);
	});

	test("getUserWorkspaceCount should return the exact count", async () => {
		const count = await getUserWorkspaceCount(userId);
		expect(count).toBeGreaterThanOrEqual(1);

		const otherCount = await getUserWorkspaceCount(otherUserId);
		expect(otherCount).toBe(0);
	});

	test("isWorkspaceOwner should verify ownership accurately", async () => {
		const isOwner = await isWorkspaceOwner(workspaceId, userId);
		expect(isOwner).toBe(true);

		const isOtherOwner = await isWorkspaceOwner(workspaceId, otherUserId);
		expect(isOtherOwner).toBe(false);
	});

	test("getWorkspaceOwnerId should return owner ID", async () => {
		const ownerId = await getWorkspaceOwnerId(workspaceId);
		expect(ownerId).toBe(userId);

		const invalidOwner = await getWorkspaceOwnerId("invalid_ws_id");
		expect(invalidOwner).toBeNull();
	});

	test("updateWorkspace should modify workspace name/icon for owner", async () => {
		const updated = await updateWorkspace({
			id: workspaceId,
			ownerId: userId,
			name: "Updated Workspace Name",
			icon: "emoji:🌟",
		});

		expect(updated).not.toBeNull();
		expect(updated?.name).toBe("Updated Workspace Name");
		expect(updated?.icon).toBe("emoji:🌟");

		// Updating with wrong owner should return null
		const failUpdate = await updateWorkspace({
			id: workspaceId,
			ownerId: otherUserId,
			name: "Hacked Workspace",
		});
		expect(failUpdate).toBeNull();
	});

	test("deleteWorkspace should delete workspace for owner", async () => {
		const deleted = await deleteWorkspace(workspaceId, userId);
		expect(deleted).toBe(true);

		const list = await fetchUserWorkspaces(userId);
		expect(list.some((w) => w.id === workspaceId)).toBe(false);
	});
});
