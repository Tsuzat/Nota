import { describe, test, expect, beforeEach } from "bun:test";
import { createTestDb, seedWorkspace, seedNote, type TestDb } from "./setup";
import { setTestDb } from "../../db";
import {
  getSnapshots,
  createSnapshot,
  mayCreateSnapshot,
  getSnapshotContent,
} from "../note_snapshot";
import { notesSnapshot } from "../../schema/index";

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
    // Ensure contentCompressed is omitted from metadata
    expect((result as any).contentCompressed).toBeUndefined();
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
    // Newest first (11:00 before 10:00)
    expect(result[0]!.contentHash).toBe("hash2");
    expect(result[1]!.contentHash).toBe("hash1");
  });

  test("respects limit and offset for pagination", async () => {
    for (let i = 0; i < 5; i++) {
      await createSnapshot({
        noteId,
        kind: "auto",
        contentCompressed: DUMMY_BUFFER,
        contentHash: `hash${i}`,
        size: 10,
        createdAt: new Date(Date.now() + i * 1000), // Newer as i increases
      });
    }

    // Newest first: hash4, hash3, hash2, hash1, hash0
    const page1 = await getSnapshots(noteId, 2, 0);
    expect(page1).toHaveLength(2);
    expect(page1[0]!.contentHash).toBe("hash4");
    expect(page1[1]!.contentHash).toBe("hash3");

    const page2 = await getSnapshots(noteId, 2, 2);
    expect(page2).toHaveLength(2);
    expect(page2[0]!.contentHash).toBe("hash2");
    expect(page2[1]!.contentHash).toBe("hash1");
  });
});

describe("getSnapshotContent", () => {
  test("retrieves the compressed buffer", async () => {
    const snapshot = await createSnapshot({
      noteId,
      kind: "pinned",
      contentCompressed: DUMMY_BUFFER,
      contentHash: "hash",
      size: DUMMY_BUFFER.length,
    });

    const content = await getSnapshotContent(snapshot.id);
    expect(content).toEqual(DUMMY_BUFFER);
  });

  test("throws if snapshot not found", async () => {
    await expect(getSnapshotContent("nonexistent")).rejects.toThrow();
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
    expect(result!.kind).toBe("auto");
    expect(result!.contentHash).toBe("hash-first");
  });

  test("skips creation if last auto snapshot was within 10 minutes", async () => {
    const now = new Date();
    
    // Create an auto snapshot exactly now
    await mayCreateSnapshot({
      noteId,
      contentCompressed: DUMMY_BUFFER,
      contentHash: "hash1",
      size: 10,
      createdAt: now,
    });

    // Try creating another 5 minutes later
    const fiveMinutesLater = new Date(now.getTime() + 5 * 60 * 1000);
    const skippedResult = await mayCreateSnapshot({
      noteId,
      contentCompressed: DUMMY_BUFFER,
      contentHash: "hash2",
      size: 10,
      createdAt: fiveMinutesLater,
    });

    expect(skippedResult).toBeNull();
    
    const all = await getSnapshots(noteId);
    expect(all).toHaveLength(1);
    expect(all[0]!.contentHash).toBe("hash1");
  });

  test("creates snapshot if last auto snapshot is older than 10 minutes", async () => {
    const now = new Date();
    
    await mayCreateSnapshot({
      noteId,
      contentCompressed: DUMMY_BUFFER,
      contentHash: "hash1",
      size: 10,
      createdAt: now,
    });

    // Try creating another 11 minutes later
    const elevenMinutesLater = new Date(now.getTime() + 11 * 60 * 1000);
    const createdResult = await mayCreateSnapshot({
      noteId,
      contentCompressed: DUMMY_BUFFER,
      contentHash: "hash2",
      size: 10,
      createdAt: elevenMinutesLater,
    });

    expect(createdResult).not.toBeNull();
    
    const all = await getSnapshots(noteId);
    expect(all).toHaveLength(2);
  });

  test("manual and pinned snapshots do not affect the 10-minute rule for auto", async () => {
    const now = new Date();
    
    // Create a manual snapshot exactly now
    await createSnapshot({
      noteId,
      kind: "manual",
      contentCompressed: DUMMY_BUFFER,
      contentHash: "manual-hash",
      size: 10,
      createdAt: now,
    });

    // Try creating an auto snapshot 1 minute later
    const oneMinuteLater = new Date(now.getTime() + 1 * 60 * 1000);
    const createdResult = await mayCreateSnapshot({
      noteId,
      contentCompressed: DUMMY_BUFFER,
      contentHash: "auto-hash",
      size: 10,
      createdAt: oneMinuteLater,
    });

    expect(createdResult).not.toBeNull();
  });

  test("enforces max limit of 100 auto snapshots, deleting the oldest", async () => {
    // Seed 150 auto snapshots manually to bypass the 10-minute check for speed
    const baseTime = Date.now() - 200 * 60 * 1000;
    
    for (let i = 0; i < 150; i++) {
      await testDb.db.insert(notesSnapshot).values({
        noteId,
        kind: "auto",
        contentCompressed: DUMMY_BUFFER,
        contentHash: `seeded-${i}`,
        size: 10,
        createdAt: new Date(baseTime + i * 11 * 60 * 1000), // Spaced by 11 mins
      });
    }

    const allBefore = await getSnapshots(noteId, 200);
    expect(allBefore).toHaveLength(150);
    
    // Add one more using mayCreateSnapshot (which triggers cleanup)
    const latestTime = new Date(baseTime + 150 * 11 * 60 * 1000);
    await mayCreateSnapshot({
      noteId,
      contentCompressed: DUMMY_BUFFER,
      contentHash: "hash-new",
      size: 10,
      createdAt: latestTime,
    });

    // Count should still be exactly 100
    const allAfter = await getSnapshots(noteId, 200);
    expect(allAfter).toHaveLength(100);
    
    // The newest should be our new one
    expect(allAfter[0]!.contentHash).toBe("hash-new");
    // The oldest 51 seeded should be deleted. We had seeded-0 to seeded-149.
    // So the oldest remaining is seeded-51 (since hash-new takes 1 spot, leaving 99 spots for seeded)
    expect(allAfter[99]!.contentHash).toBe("seeded-51");
  });
});
