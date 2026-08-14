import { describe, test, expect, beforeEach } from "bun:test";
import { createTestDb, seedWorkspace, seedNote, type TestDb } from "./setup";
import { setTestDb } from "../../db";
import { createAsset, deleteAsset, fetchAllAssets } from "../assets";

let testDb: TestDb;
let workspaceId: string;
let noteId1: string;
let noteId2: string;

beforeEach(() => {
  testDb = createTestDb();
  setTestDb(testDb.db);
  workspaceId = seedWorkspace(testDb.db);
  const note1 = seedNote(testDb.db, workspaceId, { name: "Note 1" });
  noteId1 = note1.id;
  const note2 = seedNote(testDb.db, workspaceId, { name: "Note 2" });
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
    await expect(
      createAsset({
        noteId: noteId1,
        // missing name, mimeType, size
      } as any)
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
    
    // Newest first
    expect(result[0]!.name).toBe("new.png");
    expect(result[0]!.noteName).toBe("Note 2");
    
    expect(result[1]!.name).toBe("old.png");
    expect(result[1]!.noteName).toBe("Note 1");
  });

  test("filters by mimeType", async () => {
    await createAsset({
      noteId: noteId1,
      name: "doc.pdf",
      mimeType: "application/pdf",
      size: 100,
    });

    await createAsset({
      noteId: noteId1,
      name: "img.png",
      mimeType: "image/png",
      size: 200,
    });

    const pdfs = await fetchAllAssets(20, 0, "application/pdf");
    expect(pdfs).toHaveLength(1);
    expect(pdfs[0]!.name).toBe("doc.pdf");

    const pngs = await fetchAllAssets(20, 0, "image/png");
    expect(pngs).toHaveLength(1);
    expect(pngs[0]!.name).toBe("img.png");
  });

  test("respects limit and offset", async () => {
    for (let i = 0; i < 5; i++) {
      await createAsset({
        noteId: noteId1,
        name: `asset${i}.txt`,
        mimeType: "text/plain",
        size: 10,
        createdAt: new Date(Date.now() + i * 1000), // Newer as i increases
      });
    }

    // Newest first: asset4, asset3, asset2, asset1, asset0
    const page1 = await fetchAllAssets(2, 0);
    expect(page1).toHaveLength(2);
    expect(page1[0]!.name).toBe("asset4.txt");
    expect(page1[1]!.name).toBe("asset3.txt");

    const page2 = await fetchAllAssets(2, 2);
    expect(page2).toHaveLength(2);
    expect(page2[0]!.name).toBe("asset2.txt");
    expect(page2[1]!.name).toBe("asset1.txt");
  });
});
