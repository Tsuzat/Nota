import { describe, test, expect, beforeEach,  } from "bun:test";
import { createTestDb, seedWorkspace, type TestDb } from "./setup";

import { setTestDb } from "../../db";

const { fetchWorkspace, createWorkspace, updateWorkspace, deleteWorkspace } =
  await import("../workspace");

// ─── Tests ───────────────────────────────────────────────────

let testDb: TestDb;

beforeEach(() => {
  testDb = createTestDb();
  setTestDb(testDb.db);
});

// ─── fetchWorkspace ──────────────────────────────────────────

describe("fetchWorkspace", () => {
  test("returns empty array when no workspaces exist", async () => {
    const result = await fetchWorkspace();
    expect(result).toEqual([]);
  });

  test("returns all workspaces", async () => {
    seedWorkspace(testDb.db);
    seedWorkspace(testDb.db);

    const result = await fetchWorkspace();

    expect(result).toHaveLength(2);
  });

  test("returns workspaces with correct shape", async () => {
    seedWorkspace(testDb.db);

    const result = await fetchWorkspace();

    expect(result).toHaveLength(1);
    const ws = result[0]!;
    expect(ws.id).toBeString();
    expect(ws.icon).toBe("📓");
    expect(ws.name).toBe("Test Workspace");
    expect(ws.description).toBe("A test workspace");
    expect(ws.createdAt).toBeInstanceOf(Date);
    expect(ws.updatedAt).toBeInstanceOf(Date);
  });
});

// ─── createWorkspace ─────────────────────────────────────────

describe("createWorkspace", () => {
  test("creates a workspace and returns it", async () => {
    const result = await createWorkspace({
      icon: "🏠",
      name: "My Workspace",
      description: "A brand new workspace",
    });

    expect(result).toBeDefined();
    expect(result.id).toBeString();
    expect(result.icon).toBe("🏠");
    expect(result.name).toBe("My Workspace");
    expect(result.description).toBe("A brand new workspace");
  });

  test("auto-generates an ID", async () => {
    const result = await createWorkspace({
      icon: "📁",
      name: "Auto ID",
    });

    expect(result.id).toBeString();
    expect(result.id.length).toBeGreaterThan(0);
  });

  test("workspace is retrievable after creation", async () => {
    await createWorkspace({
      icon: "📁",
      name: "Persistent",
    });

    const all = await fetchWorkspace();
    expect(all).toHaveLength(1);
    expect(all[0]!.name).toBe("Persistent");
  });

  test("throws on invalid input", async () => {
    await expect(createWorkspace({} as any)).rejects.toThrow();
  });
});

// ─── updateWorkspace ─────────────────────────────────────────

describe("updateWorkspace", () => {
  test("updates workspace name", async () => {
    const created = await createWorkspace({
      icon: "📁",
      name: "Original",
    });

    const result = await updateWorkspace({
      id: created.id,
      name: "Updated",
    });

    expect(result.name).toBe("Updated");
    expect(result.icon).toBe("📁"); // unchanged
  });

  test("updates workspace icon", async () => {
    const created = await createWorkspace({
      icon: "📁",
      name: "Icon Test",
    });

    const result = await updateWorkspace({
      id: created.id,
      icon: "🎯",
    });

    expect(result.icon).toBe("🎯");
  });

  test("updates workspace description", async () => {
    const created = await createWorkspace({
      icon: "📁",
      name: "Desc Test",
      description: "old",
    });

    const result = await updateWorkspace({
      id: created.id,
      description: "new description",
    });

    expect(result.description).toBe("new description");
  });
});

// ─── deleteWorkspace ─────────────────────────────────────────

describe("deleteWorkspace", () => {
  test("returns true when workspace is deleted", async () => {
    const id = seedWorkspace(testDb.db);

    const result = await deleteWorkspace(id);

    expect(result).toBe(true);
  });

  test("returns false when workspace does not exist", async () => {
    const result = await deleteWorkspace("nonexistent-id");

    expect(result).toBe(false);
  });

  test("workspace is no longer retrievable after deletion", async () => {
    const id = seedWorkspace(testDb.db);
    await deleteWorkspace(id);

    const all = await fetchWorkspace();
    expect(all).toHaveLength(0);
  });
});
