import { beforeEach, describe, expect, test } from "bun:test";
import { setTestDb } from "../../db";
import {
	createAsset,
	deleteAsset,
	fetchAllAssets,
	getLocalAssetById,
	getLocalAssets,
} from "../assets";
import { createTestDb, seedNote, seedWorkspace, type TestDb } from "./setup";

let testDb: TestDb;
let workspaceId: string;
let noteId1: string;
let noteId2: string;

beforeEach(() => {
	testDb = createTestDb();
	setTestDb(testDb.db);
	workspaceId = seedWorkspace(testDb.db);
	const note1 = seedNote(testDb.db, workspaceId, {
		name: "Alpha Note",
		icon: "lucide:file-text",
	});
	noteId1 = note1.id;
	const note2 = seedNote(testDb.db, workspaceId, {
		name: "Beta Note",
		icon: "lucide:image",
	});
	noteId2 = note2.id;
});

describe("createAsset", () => {
	test("creates an asset and returns metadata", async () => {
		const result = await createAsset({
			noteId: noteId1,
			name: "image1.png",
			mimeType: "image/png",
			size: 1024,
		});

		expect(result.id).toBeString();
		expect(result.noteId).toBe(noteId1);
		expect(result.name).toBe("image1.png");
		expect(result.mimeType).toBe("image/png");
		expect(result.size).toBe(1024);
		expect(result.createdAt).toBeInstanceOf(Date);
	});

	test("throws on invalid input", async () => {
		expect(
			createAsset({
				noteId: noteId1,
				// missing name, mimeType, size
			} as never),
		).rejects.toThrow("Failed to create asset");
	});
});

describe("deleteAsset", () => {
	test("returns true when asset is deleted", async () => {
		const asset = await createAsset({
			noteId: noteId1,
			name: "test.jpg",
			mimeType: "image/jpeg",
			size: 500,
		});

		const deleted = await deleteAsset(asset.id);
		expect(deleted).toBe(true);

		const all = await fetchAllAssets();
		expect(all).toHaveLength(0);
	});

	test("returns false when asset does not exist", async () => {
		const deleted = await deleteAsset("nonexistent-id");
		expect(deleted).toBe(false);
	});
});

describe("getLocalAssetById", () => {
	test("returns asset with joined note and workspace details", async () => {
		const created = await createAsset({
			noteId: noteId1,
			name: "screenshot.png",
			mimeType: "image/png",
			size: 2048,
		});

		const asset = await getLocalAssetById(created.id);
		expect(asset).not.toBeNull();
		expect(asset?.id).toBe(created.id);
		expect(asset?.name).toBe("screenshot.png");
		expect(asset?.noteId).toBe(noteId1);
		expect(asset?.noteName).toBe("Alpha Note");
		expect(asset?.noteIcon).toBe("lucide:file-text");
		expect(asset?.workspaceId).toBe(workspaceId);
		expect(asset?.workspaceName).toBe("Test Workspace");
		expect(asset?.size).toBe(2048);
	});

	test("returns null for non-existent asset ID", async () => {
		const asset = await getLocalAssetById("non-existent-id");
		expect(asset).toBeNull();
	});
});

describe("getLocalAssets", () => {
	test("retrieves all assets and sums totalSizeBytes across all workspaces", async () => {
		await createAsset({
			noteId: noteId1,
			name: "photo1.png",
			mimeType: "image/png",
			size: 1000,
			createdAt: new Date("2024-01-01T10:00:00Z"),
		});

		await createAsset({
			noteId: noteId2,
			name: "photo2.png",
			mimeType: "image/png",
			size: 2500,
			createdAt: new Date("2024-01-01T11:00:00Z"),
		});

		const res = await getLocalAssets();
		expect(res.total).toBe(2);
		expect(res.totalSizeBytes).toBe(3500);
		expect(res.items).toHaveLength(2);
		expect(res.items[0]?.name).toBe("photo2.png");
		expect(res.items[0]?.noteName).toBe("Beta Note");
		expect(res.items[0]?.noteIcon).toBe("lucide:image");
		expect(res.items[0]?.workspaceId).toBe(workspaceId);
	});

	test("filters by workspaceId", async () => {
		const ws2 = seedWorkspace(testDb.db);
		const noteInWs2 = seedNote(testDb.db, ws2, { name: "Other WS Note" });

		await createAsset({
			noteId: noteId1,
			name: "file1.png",
			mimeType: "image/png",
			size: 500,
		});

		await createAsset({
			noteId: noteInWs2.id,
			name: "file2.png",
			mimeType: "image/png",
			size: 700,
		});

		const res1 = await getLocalAssets({ workspaceId });
		expect(res1.total).toBe(1);
		expect(res1.items[0]?.name).toBe("file1.png");

		const res2 = await getLocalAssets({ workspaceId: ws2 });
		expect(res2.total).toBe(1);
		expect(res2.items[0]?.name).toBe("file2.png");
	});

	test("filters by noteId and mimeType", async () => {
		await createAsset({
			noteId: noteId1,
			name: "img.jpg",
			mimeType: "image/jpeg",
			size: 300,
		});

		await createAsset({
			noteId: noteId1,
			name: "doc.pdf",
			mimeType: "application/pdf",
			size: 400,
		});

		await createAsset({
			noteId: noteId2,
			name: "other.jpg",
			mimeType: "image/jpeg",
			size: 500,
		});

		const note1Jpegs = await getLocalAssets({
			noteId: noteId1,
			mimeType: "image/jpeg",
		});
		expect(note1Jpegs.total).toBe(1);
		expect(note1Jpegs.items[0]?.name).toBe("img.jpg");
	});

	test("searches by asset name or note name", async () => {
		await createAsset({
			noteId: noteId1,
			name: "contract-v1.pdf",
			mimeType: "application/pdf",
			size: 100,
		});

		await createAsset({
			noteId: noteId2,
			name: "design.png",
			mimeType: "image/png",
			size: 200,
		});

		const searchByFileName = await getLocalAssets({ search: "contract" });
		expect(searchByFileName.total).toBe(1);
		expect(searchByFileName.items[0]?.name).toBe("contract-v1.pdf");

		const searchByNoteName = await getLocalAssets({ search: "Beta" });
		expect(searchByNoteName.total).toBe(1);
		expect(searchByNoteName.items[0]?.name).toBe("design.png");
	});

	test("sorts by name, size, and createdAt", async () => {
		await createAsset({
			noteId: noteId1,
			name: "banana.png",
			mimeType: "image/png",
			size: 5000,
			createdAt: new Date("2024-01-01T10:00:00Z"),
		});

		await createAsset({
			noteId: noteId1,
			name: "apple.png",
			mimeType: "image/png",
			size: 1000,
			createdAt: new Date("2024-01-01T12:00:00Z"),
		});

		const sortedByNameAsc = await getLocalAssets({
			sortBy: "name",
			sortOrder: "asc",
		});
		expect(sortedByNameAsc.items[0]?.name).toBe("apple.png");
		expect(sortedByNameAsc.items[1]?.name).toBe("banana.png");

		const sortedBySizeDesc = await getLocalAssets({
			sortBy: "size",
			sortOrder: "desc",
		});
		expect(sortedBySizeDesc.items[0]?.name).toBe("banana.png");
		expect(sortedBySizeDesc.items[1]?.name).toBe("apple.png");
	});

	test("paginates with limit and offset", async () => {
		for (let i = 0; i < 5; i++) {
			await createAsset({
				noteId: noteId1,
				name: `doc-${i}.pdf`,
				mimeType: "application/pdf",
				size: 100,
				createdAt: new Date(Date.now() + i * 1000),
			});
		}

		const page1 = await getLocalAssets({ limit: 2, offset: 0 });
		expect(page1.total).toBe(5);
		expect(page1.items).toHaveLength(2);
		expect(page1.items[0]?.name).toBe("doc-4.pdf");

		const page2 = await getLocalAssets({ limit: 2, offset: 2 });
		expect(page2.total).toBe(5);
		expect(page2.items).toHaveLength(2);
		expect(page2.items[0]?.name).toBe("doc-2.pdf");
	});
});

describe("fetchAllAssets", () => {
	test("returns empty array when no assets exist", async () => {
		const result = await fetchAllAssets();
		expect(result).toEqual([]);
	});

	test("returns assets ordered by newest first, joining note name", async () => {
		await createAsset({
			noteId: noteId1,
			name: "old.png",
			mimeType: "image/png",
			size: 100,
			createdAt: new Date("2024-01-01T10:00:00Z"),
		});

		await createAsset({
			noteId: noteId2,
			name: "new.png",
			mimeType: "image/png",
			size: 200,
			createdAt: new Date("2024-01-01T11:00:00Z"),
		});

		const result = await fetchAllAssets();
		expect(result).toHaveLength(2);

		expect(result[0]?.name).toBe("new.png");
		expect(result[0]?.noteName).toBe("Beta Note");

		expect(result[1]?.name).toBe("old.png");
		expect(result[1]?.noteName).toBe("Alpha Note");
	});
});
