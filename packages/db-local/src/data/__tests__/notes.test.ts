import { beforeEach, describe, expect, test } from "bun:test";
import { setTestDb } from "../../db";
import { createTestDb, seedNote, seedWorkspace, type TestDb } from "./setup";

// Import AFTER mock is set up
const {
	fetchNotesByWorkspace,
	fetchNotesMeta,
	updateNotesMeta,
	deleteNotes,
	saveNotesContent,
	searchInNotes,
	exportNotes,
	createNotes,
} = await import("../notes");

// ─── Tests ───────────────────────────────────────────────────

let workspaceId: string;
let testDb: TestDb;

beforeEach(() => {
	testDb = createTestDb();
	setTestDb(testDb.db);
	workspaceId = seedWorkspace(testDb.db);
});

// ─── createNotes ─────────────────────────────────────────────

describe("createNotes", () => {
	test("creates a note and returns full LocalNote", async () => {
		const result = await createNotes({
			workspaceId,
			icon: "📝",
			name: "My Note",
			content: { type: "doc", content: [] },
			contentText: "hello world",
		});

		expect(result).toBeDefined();
		expect(result.id).toBeString();
		expect(result.name).toBe("My Note");
		expect(result.icon).toBe("📝");
		expect(result.workspaceId).toBe(workspaceId);
		expect(result.contentText).toBe("hello world");
		expect(result.content).toEqual({ type: "doc", content: [] });
		expect(result.starred).toBe(false);
		expect(result.createdAt).toBeInstanceOf(Date);
		expect(result.updatedAt).toBeInstanceOf(Date);
	});

	test("auto-generates an ID when none is provided", async () => {
		const result = await createNotes({
			workspaceId,
			icon: "📝",
			name: "Auto ID Note",
			content: { type: "doc" },
		});

		expect(result.id).toBeString();
		expect(result.id.length).toBeGreaterThan(0);
	});

	test("throws on invalid input (missing required fields)", async () => {
		await expect(createNotes({} as never)).rejects.toThrow();
	});
});

// ─── fetchNotesByWorkspace ───────────────────────────────────

describe("fetchNotesByWorkspace", () => {
	test("returns empty array when no notes exist", async () => {
		const result = await fetchNotesByWorkspace(workspaceId);
		expect(result).toEqual([]);
	});

	test("returns metadata for all notes in a workspace", async () => {
		seedNote(testDb.db, workspaceId, { name: "Note 1" });
		seedNote(testDb.db, workspaceId, { name: "Note 2" });

		const result = await fetchNotesByWorkspace(workspaceId);

		expect(result).toHaveLength(2);
		const names = result.map((n) => n.name);
		expect(names).toContain("Note 1");
		expect(names).toContain("Note 2");
	});

	test("excludes content and contentText from results", async () => {
		seedNote(testDb.db, workspaceId, {
			name: "Content Note",
			contentText: "should not appear",
		});

		const result = await fetchNotesByWorkspace(workspaceId);

		expect(result).toHaveLength(1);
		expect(result[0]).not.toHaveProperty("content");
		expect(result[0]).not.toHaveProperty("contentText");
	});

	test("does not return notes from other workspaces", async () => {
		const otherWorkspaceId = seedWorkspace(testDb.db);
		seedNote(testDb.db, workspaceId, { name: "Mine" });
		seedNote(testDb.db, otherWorkspaceId, { name: "Theirs" });

		const result = await fetchNotesByWorkspace(workspaceId);

		expect(result).toHaveLength(1);
		expect(result[0]?.name).toBe("Mine");
	});
});

// ─── fetchNotesMeta ──────────────────────────────────────────

describe("fetchNotesMeta", () => {
	test("returns null when note does not exist", async () => {
		const result = await fetchNotesMeta("nonexistent-id");
		expect(result).toBeNull();
	});

	test("returns metadata for an existing note", async () => {
		const seeded = seedNote(testDb.db, workspaceId, {
			name: "Fetch Me",
			icon: "🔍",
		});

		const result = await fetchNotesMeta(seeded.id);

		expect(result).not.toBeNull();
		expect(result?.id).toBe(seeded.id);
		expect(result?.name).toBe("Fetch Me");
		expect(result?.icon).toBe("🔍");
	});

	test("excludes content and contentText", async () => {
		const seeded = seedNote(testDb.db, workspaceId, {
			contentText: "secret text",
		});

		const result = await fetchNotesMeta(seeded.id);

		expect(result).not.toBeNull();
		expect(result).not.toHaveProperty("content");
		expect(result).not.toHaveProperty("contentText");
	});
});

// ─── updateNotesMeta ─────────────────────────────────────────

describe("updateNotesMeta", () => {
	test("updates the name of a note", async () => {
		const seeded = seedNote(testDb.db, workspaceId, { name: "Old Name" });

		const result = await updateNotesMeta({
			id: seeded.id,
			name: "New Name",
		});

		expect(result.name).toBe("New Name");
	});

	test("updates the icon of a note", async () => {
		const seeded = seedNote(testDb.db, workspaceId, { icon: "📝" });

		const result = await updateNotesMeta({
			id: seeded.id,
			icon: "🚀",
		});

		expect(result.icon).toBe("🚀");
	});

	test("updates the description of a note", async () => {
		const seeded = seedNote(testDb.db, workspaceId);

		const result = await updateNotesMeta({
			id: seeded.id,
			description: "Updated description",
		});

		expect(result.description).toBe("Updated description");
	});

	test("throws when note ID is not provided", async () => {
		await expect(updateNotesMeta({ id: "", name: "No ID" })).rejects.toThrow();
	});

	test("throws when note does not exist", async () => {
		await expect(
			updateNotesMeta({ id: "nonexistent-id", name: "Ghost" }),
		).rejects.toThrow();
	});
});

// ─── deleteNotes ─────────────────────────────────────────────

describe("deleteNotes", () => {
	test("returns true when a note is deleted", async () => {
		const seeded = seedNote(testDb.db, workspaceId);

		const result = await deleteNotes(seeded.id);

		expect(result).toBe(true);
	});

	test("returns false when note does not exist", async () => {
		const result = await deleteNotes("nonexistent-id");
		expect(result).toBe(false);
	});

	test("note is no longer retrievable after deletion", async () => {
		const seeded = seedNote(testDb.db, workspaceId);
		await deleteNotes(seeded.id);

		const meta = await fetchNotesMeta(seeded.id);
		expect(meta).toBeNull();
	});
});

// ─── saveNotesContent ────────────────────────────────────────

describe("saveNotesContent", () => {
	test("updates content using positional arguments", async () => {
		const seeded = seedNote(testDb.db, workspaceId);

		const newContent = { type: "doc", content: [{ type: "paragraph" }] };
		await saveNotesContent(seeded.id, newContent, "paragraph text");

		// Re-fetch to verify
		const exported = await exportNotes(seeded.id);
		expect(exported.content).toEqual(newContent);
		expect(exported.contentText).toBe("paragraph text");
	});

	test("sets contentText to null when not provided", async () => {
		const seeded = seedNote(testDb.db, workspaceId, {
			contentText: "original text",
		});

		await saveNotesContent(seeded.id, { type: "doc" });

		const exported = await exportNotes(seeded.id);
		expect(exported.contentText).toBeNull();
	});

	test("throws when note does not exist", async () => {
		await expect(
			saveNotesContent("nonexistent-id", { type: "doc" }),
		).rejects.toThrow("Failed to save note content");
	});
});

// ─── searchInNotes ───────────────────────────────────────────

describe("searchInNotes", () => {
	test("returns empty array when nothing matches", async () => {
		seedNote(testDb.db, workspaceId, { name: "Unrelated" });

		const result = await searchInNotes("zzzzz");

		expect(result).toEqual([]);
	});

	test("finds notes matching by name", async () => {
		seedNote(testDb.db, workspaceId, { name: "Meeting Notes" });
		seedNote(testDb.db, workspaceId, { name: "Shopping List" });

		const result = await searchInNotes("Meeting");

		expect(result).toHaveLength(1);
		expect(result[0]?.name).toBe("Meeting Notes");
	});

	test("finds notes matching by description", async () => {
		seedNote(testDb.db, workspaceId, {
			name: "Note",
			description: "Contains important info",
		});

		const result = await searchInNotes("important");

		expect(result).toHaveLength(1);
	});

	test("finds notes matching by contentText", async () => {
		seedNote(testDb.db, workspaceId, {
			name: "Note",
			contentText: "This is searchable body text",
		});

		const result = await searchInNotes("searchable");

		expect(result).toHaveLength(1);
	});

	test("search is case-insensitive via LIKE", async () => {
		seedNote(testDb.db, workspaceId, { name: "UPPERCASE NOTE" });

		// SQLite LIKE is case-insensitive for ASCII by default
		const result = await searchInNotes("uppercase");

		expect(result).toHaveLength(1);
	});

	test("excludes content and contentText from results", async () => {
		seedNote(testDb.db, workspaceId, {
			name: "Searchable",
			contentText: "body",
		});

		const result = await searchInNotes("Searchable");

		expect(result).toHaveLength(1);
		expect(result[0]).not.toHaveProperty("content");
		expect(result[0]).not.toHaveProperty("contentText");
	});
});

// ─── exportNotes ─────────────────────────────────────────────

describe("exportNotes", () => {
	test("exports a note with id, name, content, and contentText", async () => {
		const content = { type: "doc", content: [{ type: "paragraph" }] };
		const seeded = seedNote(testDb.db, workspaceId, {
			name: "Export Me",
			content: content,
			contentText: "export text",
		});

		const result = await exportNotes(seeded.id);

		expect(result.id).toBe(seeded.id);
		expect(result.name).toBe("Export Me");
		expect(result.content).toEqual(content);
		expect(result.contentText).toBe("export text");
	});

	test("throws when note does not exist", async () => {
		await expect(exportNotes("nonexistent-id")).rejects.toThrow();
	});

	test("exported note only contains id, name, content, contentText", async () => {
		const seeded = seedNote(testDb.db, workspaceId);

		const result = await exportNotes(seeded.id);
		const keys = Object.keys(result);

		expect(keys).toContain("id");
		expect(keys).toContain("name");
		expect(keys).toContain("content");
		expect(keys).toContain("contentText");
		// Should NOT leak other fields
		expect(keys).not.toContain("workspaceId");
		expect(keys).not.toContain("icon");
		expect(keys).not.toContain("starred");
	});
});
