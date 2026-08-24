import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createNotes } from "../notes";
import {
	createPublish,
	deletePublish,
	getPublishByNoteId,
	getPublishBySlug,
	getPublishBySlugOrId,
	getPublishMetaByNoteId,
	incrementPublishViewCount,
	isSlugTaken,
	updatePublish,
} from "../publish";
import { cleanupTestData, createTestUser, createTestWorkspace } from "./setup";

describe("Database - Publish", () => {
	const userId = "test_publish_owner_user";
	const workspaceId = "test_publish_workspace";
	const noteId = "test_publish_note_1";

	beforeAll(async () => {
		await cleanupTestData();
		await createTestUser(userId, "Publish Owner");
		await createTestWorkspace(workspaceId, userId, "Publish Workspace");
		await createNotes({
			id: noteId,
			workspaceId,
			ownerId: userId,
			name: "Publish Test Note",
			content: Buffer.from("test content"),
		});
	});

	afterAll(async () => {
		await cleanupTestData();
	});

	test("createPublish should publish a note", async () => {
		const published = await createPublish({
			id: noteId,
			slug: "test-slug-123",
			title: "Publish Test Note",
			contentHtml: "<p>Hello World</p>",
			publishedBy: userId,
			status: "published",
		});

		expect(published.id).toBe(noteId);
		expect(published.slug).toBe("test-slug-123");
		expect(published.title).toBe("Publish Test Note");
		expect(published.contentHtml).toBe("<p>Hello World</p>");
	});

	test("isSlugTaken should accurately detect taken slugs", async () => {
		const taken = await isSlugTaken("test-slug-123");
		expect(taken).toBe(true);

		const takenWithExclude = await isSlugTaken("test-slug-123", noteId);
		expect(takenWithExclude).toBe(false);

		const notTaken = await isSlugTaken("non-existent-slug");
		expect(notTaken).toBe(false);
	});

	test("getPublishMetaByNoteId should retrieve metadata without contentHtml", async () => {
		const meta = await getPublishMetaByNoteId(noteId);
		expect(meta).toBeDefined();
		expect(meta?.id).toBe(noteId);
		expect(meta?.slug).toBe("test-slug-123");
		expect((meta as Record<string, unknown>).contentHtml).toBeUndefined();
	});

	test("getPublishByNoteId should retrieve the full published note by note ID", async () => {
		const note = await getPublishByNoteId(noteId);
		expect(note).toBeDefined();
		expect(note?.id).toBe(noteId);
		expect(note?.contentHtml).toBe("<p>Hello World</p>");
	});

	test("getPublishBySlug should retrieve the full published note", async () => {
		const note = await getPublishBySlug("test-slug-123");
		expect(note).toBeDefined();
		expect(note?.id).toBe(noteId);
		expect(note?.contentHtml).toBe("<p>Hello World</p>");
	});

	test("getPublishBySlugOrId should retrieve note with author by slug and by noteId", async () => {
		const bySlug = await getPublishBySlugOrId("test-slug-123");
		expect(bySlug).toBeDefined();
		expect(bySlug?.id).toBe(noteId);
		expect(bySlug?.author?.name).toBe("Publish Owner");

		const byId = await getPublishBySlugOrId(noteId);
		expect(byId).toBeDefined();
		expect(byId?.slug).toBe("test-slug-123");
		expect(byId?.author?.name).toBe("Publish Owner");
	});

	test("incrementPublishViewCount should increment view count", async () => {
		await incrementPublishViewCount(noteId);
		const note = await getPublishBySlugOrId(noteId);
		expect(note?.viewCount).toBe(1);
	});

	test("updatePublish should update slug and content", async () => {
		const updated = await updatePublish(noteId, {
			slug: "updated-slug-456",
			contentHtml: "<h1>Updated Title</h1>",
		});

		expect(updated).toBeDefined();
		expect(updated?.slug).toBe("updated-slug-456");
		expect(updated?.contentHtml).toBe("<h1>Updated Title</h1>");
	});

	test("deletePublish should remove published note", async () => {
		const success = await deletePublish(noteId);
		expect(success).toBe(true);

		const meta = await getPublishMetaByNoteId(noteId);
		expect(meta).toBeUndefined();
	});
});
