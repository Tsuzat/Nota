import { beforeEach, describe, expect, test } from "bun:test";
import { setTestDb } from "../../db";
import { notesSnapshot } from "../../schema/index";
import {
	createSnapshot,
	deleteSnapshot,
	getSnapshots,
	getWorkspaceSnapshots,
	mayCreateSnapshot,
} from "../note_snapshot";
import { createTestDb, seedNote, seedWorkspace, type TestDb } from "./setup";

let testDb: TestDb;
let workspaceId: string;
let noteId: string;

beforeEach(() => {
	testDb = createTestDb();
	setTestDb(testDb.db);
	workspaceId = seedWorkspace(testDb.db);
	const note = seedNote(testDb.db, workspaceId);
	noteId = note.id;
});

// Dummy content buffer for tests
const DUMMY_BUFFER = Buffer.from("compressed content data");

describe("createSnapshot", () => {
	test("creates a snapshot and returns metadata", async () => {
		const result = await createSnapshot({
			noteId,
			kind: "manual",
			label: "My Snapshot",
			contentCompressed: DUMMY_BUFFER,
			contentHash: "hash123",
			size: DUMMY_BUFFER.length,
		});

		expect(result.id).toBeString();
		expect(result.noteId).toBe(noteId);
		expect(result.kind).toBe("manual");
		expect(result.label).toBe("My Snapshot");
		expect(result.contentHash).toBe("hash123");
		expect(result.size).toBe(DUMMY_BUFFER.length);
		expect(result.createdAt).toBeInstanceOf(Date);
		expect(
			(result as Record<string, unknown>).contentCompressed,
		).toBeUndefined();
	});
});

describe("getSnapshots", () => {
	test("returns empty array if no snapshots", async () => {
		const result = await getSnapshots(noteId);
		expect(result).toEqual([]);
	});

	test("returns snapshots ordered by newest first", async () => {
		await createSnapshot({
			noteId,
			kind: "auto",
			contentCompressed: DUMMY_BUFFER,
			contentHash: "hash1",
			size: 10,
			createdAt: new Date("2024-01-01T10:00:00Z"),
		});

		await createSnapshot({
			noteId,
			kind: "manual",
			contentCompressed: DUMMY_BUFFER,
			contentHash: "hash2",
			size: 20,
			createdAt: new Date("2024-01-01T11:00:00Z"),
		});

		const result = await getSnapshots(noteId);
		expect(result).toHaveLength(2);
		expect(result[0]?.contentHash).toBe("hash2");
		expect(result[1]?.contentHash).toBe("hash1");
	});
});

describe("getWorkspaceSnapshots", () => {
	test("retrieves snapshots with joined note name and icon", async () => {
		await createSnapshot({
			noteId,
			kind: "manual",
			label: "Workspace Snapshot",
			contentCompressed: DUMMY_BUFFER,
			contentHash: "ws-hash-1",
			size: 25,
		});

		const result = await getWorkspaceSnapshots(workspaceId);
		expect(result.total).toBe(1);
		expect(result.items).toHaveLength(1);
		expect(result.items[0]?.noteName).toBeString();
		expect(result.items[0]?.contentHash).toBe("ws-hash-1");
	});
});

describe("deleteSnapshot", () => {
	test("deletes a snapshot by id", async () => {
		const snapshot = await createSnapshot({
			noteId,
			kind: "manual",
			contentCompressed: DUMMY_BUFFER,
			contentHash: "del-hash",
			size: 10,
		});

		const deleted = await deleteSnapshot(snapshot.id);
		expect(deleted).toBe(true);

		const remaining = await getSnapshots(noteId);
		expect(remaining).toHaveLength(0);
	});
});

describe("mayCreateSnapshot", () => {
	test("creates an auto snapshot if none exist", async () => {
		const result = await mayCreateSnapshot({
			noteId,
			contentCompressed: DUMMY_BUFFER,
			contentHash: "hash-first",
			size: 10,
		});

		expect(result).not.toBeNull();
		expect(result?.kind).toBe("auto");
		expect(result?.contentHash).toBe("hash-first");
	});

	test("skips creation if content hash matches last auto snapshot", async () => {
		const now = new Date();

		await mayCreateSnapshot({
			noteId,
			contentCompressed: DUMMY_BUFFER,
			contentHash: "identical-hash",
			size: 10,
			createdAt: now,
		});

		// 15 minutes later, but content hash is identical
		const fifteenMinutesLater = new Date(now.getTime() + 15 * 60 * 1000);
		const skipped = await mayCreateSnapshot({
			noteId,
			contentCompressed: DUMMY_BUFFER,
			contentHash: "identical-hash",
			size: 10,
			createdAt: fifteenMinutesLater,
		});

		expect(skipped).toBeNull();
	});

	test("skips creation if last auto snapshot was within 10 minutes", async () => {
		const now = new Date();

		await mayCreateSnapshot({
			noteId,
			contentCompressed: DUMMY_BUFFER,
			contentHash: "hash1",
			size: 10,
			createdAt: now,
		});

		// Try creating another 5 minutes later with different hash
		const fiveMinutesLater = new Date(now.getTime() + 5 * 60 * 1000);
		const skippedResult = await mayCreateSnapshot({
			noteId,
			contentCompressed: DUMMY_BUFFER,
			contentHash: "hash2",
			size: 10,
			createdAt: fiveMinutesLater,
		});

		expect(skippedResult).toBeNull();
	});

	test("creates snapshot if last auto snapshot is older than 10 minutes with new hash", async () => {
		const now = new Date();

		await mayCreateSnapshot({
			noteId,
			contentCompressed: DUMMY_BUFFER,
			contentHash: "hash1",
			size: 10,
			createdAt: now,
		});

		const elevenMinutesLater = new Date(now.getTime() + 11 * 60 * 1000);
		const createdResult = await mayCreateSnapshot({
			noteId,
			contentCompressed: DUMMY_BUFFER,
			contentHash: "hash2",
			size: 10,
			createdAt: elevenMinutesLater,
		});

		expect(createdResult).not.toBeNull();
		expect(createdResult?.contentHash).toBe("hash2");
	});

	test("enforces max limit of 50 auto snapshots, deleting the oldest", async () => {
		const baseTime = Date.now() - 100 * 60 * 1000;

		// Seed 60 auto snapshots manually
		for (let i = 0; i < 60; i++) {
			await testDb.db.insert(notesSnapshot).values({
				noteId,
				kind: "auto",
				contentCompressed: DUMMY_BUFFER,
				contentHash: `seeded-${i}`,
				size: 10,
				createdAt: new Date(baseTime + i * 11 * 60 * 1000),
			});
		}

		const allBefore = await getSnapshots(noteId, 100);
		expect(allBefore).toHaveLength(60);

		// Add one more using mayCreateSnapshot (triggering cleanup)
		const latestTime = new Date(baseTime + 60 * 11 * 60 * 1000);
		await mayCreateSnapshot({
			noteId,
			contentCompressed: DUMMY_BUFFER,
			contentHash: "hash-new",
			size: 10,
			createdAt: latestTime,
		});

		// Count should be capped at 50
		const allAfter = await getSnapshots(noteId, 100);
		expect(allAfter).toHaveLength(50);
		expect(allAfter[0]?.contentHash).toBe("hash-new");
	});

	test("cleans up auto snapshots older than 90 days", async () => {
		const now = Date.now();
		const ninetyOneDaysAgo = new Date(now - 91 * 24 * 60 * 60 * 1000);

		// Seed an expired snapshot
		await testDb.db.insert(notesSnapshot).values({
			noteId,
			kind: "auto",
			contentCompressed: DUMMY_BUFFER,
			contentHash: "expired-hash",
			size: 10,
			createdAt: ninetyOneDaysAgo,
		});

		// Add a new snapshot
		await mayCreateSnapshot({
			noteId,
			contentCompressed: DUMMY_BUFFER,
			contentHash: "fresh-hash",
			size: 10,
			createdAt: new Date(now),
		});

		const remaining = await getSnapshots(noteId);
		expect(remaining).toHaveLength(1);
		expect(remaining[0]?.contentHash).toBe("fresh-hash");
	});
});
