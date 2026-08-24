import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../../index";
import { assets, notes, workspace } from "../../schema/app";
import { user } from "../../schema/auth";
import {
	createAsset,
	deleteAsset,
	getAssetById,
	getAssets,
	getStorageStats,
} from "../assets";
import { createNotes } from "../notes";
import { createTestUser, createTestWorkspace } from "./setup";

describe("Database - Assets", () => {
	const userId = `test_asset_user_${Math.random().toString(36).slice(2, 8)}`;
	const workspaceId = `test_asset_ws_${Math.random().toString(36).slice(2, 8)}`;
	const noteId = `test_asset_note_${Math.random().toString(36).slice(2, 8)}`;
	let assetId1: string;
	let assetId2: string;

	beforeAll(async () => {
		await createTestUser(userId, "Asset User");
		await createTestWorkspace(workspaceId, userId, "Asset Workspace");
		await createNotes({
			id: noteId,
			workspaceId,
			ownerId: userId,
			name: "Asset Parent Note",
			icon: "lucide:file-text",
			content: Buffer.from("test content"),
		});
	});

	afterAll(async () => {
		await db.delete(assets).where(eq(assets.uploadedBy, userId));
		await db.delete(notes).where(eq(notes.ownerId, userId));
		await db.delete(workspace).where(eq(workspace.ownerId, userId));
		await db.delete(user).where(eq(user.id, userId));
	});

	test("createAsset should insert a new asset and return it", async () => {
		const asset = await createAsset({
			noteId,
			name: "logo.png",
			mimeType: "image/png",
			size: 1024,
			uploadedBy: userId,
			path: "uploads/logo.png",
		});

		expect(asset).toBeDefined();
		expect(asset.id).toBeString();
		expect(asset.name).toBe("logo.png");
		expect(asset.mimeType).toBe("image/png");
		expect(asset.size).toBe(1024);
		expect(asset.uploadedBy).toBe(userId);
		expect(asset.path).toBe("uploads/logo.png");

		assetId1 = asset.id;
	});

	test("getAssetById should return asset with joined note and workspace meta", async () => {
		const asset = await getAssetById(assetId1);
		expect(asset).not.toBeNull();
		expect(asset?.id).toBe(assetId1);
		expect(asset?.name).toBe("logo.png");
		expect(asset?.noteName).toBe("Asset Parent Note");
		expect(asset?.workspaceId).toBe(workspaceId);
		expect(asset?.workspaceName).toBe("Asset Workspace");
	});

	test("getAssetById should return null for non-existent id", async () => {
		const asset = await getAssetById("non_existent_id");
		expect(asset).toBeNull();
	});

	test("getAssets should list assets with filters and calculate aggregates", async () => {
		const asset2 = await createAsset({
			noteId,
			name: "manual.pdf",
			mimeType: "application/pdf",
			size: 4096,
			uploadedBy: userId,
			path: "uploads/manual.pdf",
		});
		assetId2 = asset2.id;

		// 1. All assets for workspace
		const all = await getAssets({ userId, workspaceId });
		expect(all.total).toBe(2);
		expect(all.totalSizeBytes).toBe(5120);
		expect(all.items).toHaveLength(2);

		// 2. Filter by mimeType
		const images = await getAssets({
			userId,
			workspaceId,
			mimeType: "image/png",
		});
		expect(images.total).toBe(1);
		expect(images.items[0]?.name).toBe("logo.png");

		// 3. Search by term
		const searchRes = await getAssets({
			userId,
			workspaceId,
			searchTerm: "manual",
		});
		expect(searchRes.total).toBe(1);
		expect(searchRes.items[0]?.name).toBe("manual.pdf");

		// 4. Sort by size descending
		const sorted = await getAssets({
			userId,
			workspaceId,
			sortBy: "size",
			sortOrder: "desc",
		});
		expect(sorted.items[0]?.name).toBe("manual.pdf");
		expect(sorted.items[1]?.name).toBe("logo.png");
	});

	test("getStorageStats should calculate storage used by user assets and quota", async () => {
		const stats = await getStorageStats(userId, workspaceId);
		expect(stats.media.count).toBe(2);
		expect(stats.media.sizeBytes).toBe(5120);
		expect(stats.totalUsedBytes).toBeGreaterThanOrEqual(5120);
		expect(stats.quota).toBeDefined();
	});

	test("deleteAsset should remove the asset", async () => {
		const deleted = await deleteAsset(assetId1);
		expect(deleted).toBeDefined();
		expect(deleted?.id).toBe(assetId1);

		const remaining = await getAssets({ userId, workspaceId });
		expect(remaining.total).toBe(1);
		expect(remaining.items[0]?.id).toBe(assetId2);
	});
});
