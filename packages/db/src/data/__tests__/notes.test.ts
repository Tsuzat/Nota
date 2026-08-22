import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { addNoteGuest } from "../guests";
import {
	createNotes,
	deleteNotes,
	getCollabNotes,
	getNotesByWorkspace,
	getNotesMeta,
	updateContent,
	updateNotesMeta,
} from "../notes";
import { cleanupTestData, createTestUser, createTestWorkspace } from "./setup";

describe("Database - Notes", () => {
	const userId = "test_owner_user";
	const guestUserId = "test_shared_guest_user";
	const workspaceId = "test_notes_workspace";
	const noteId = "test_note_1";

	beforeAll(async () => {
		await cleanupTestData();
		await createTestUser(userId, "Note Owner");
		await createTestUser(guestUserId, "Guest User");
		await createTestWorkspace(workspaceId, userId, "Note Workspace");
	});

	afterAll(async () => {
		await cleanupTestData();
	});

	test("createNotes should insert a note successfully", async () => {
		const note = await createNotes({
			id: noteId,
			workspaceId,
			ownerId: userId,
			name: "My DB Test Note",
			content: Buffer.from("test content"),
		});

		expect(note.id).toBe(noteId);
		expect(note.name).toBe("My DB Test Note");
		expect(note.workspaceId).toBe(workspaceId);
		// NoteMeta shouldn't have content
		expect((note as Record<string, unknown>).content).toBeUndefined();
	});

	test("getNotesByWorkspace should return notes for workspace owner", async () => {
		const notes = await getNotesByWorkspace(workspaceId, userId);
		expect(notes.length).toBeGreaterThan(0);
		expect(notes[0]?.id).toBe(noteId);
	});

	test("getNotesByWorkspace should return empty for non-owner", async () => {
		const notes = await getNotesByWorkspace(workspaceId, "random_user");
		expect(notes.length).toBe(0);
	});

	test("getNotesMeta should retrieve note meta", async () => {
		const meta = await getNotesMeta(noteId);
		expect(meta).not.toBeNull();
		expect(meta?.id).toBe(noteId);
	});

	test("updateNotesMeta should update metadata", async () => {
		const updated = await updateNotesMeta({
			id: noteId,
			name: "Updated Name",
			description: "Updated description",
		});
		expect(updated).not.toBeNull();
		expect(updated?.name).toBe("Updated Name");
		expect(updated?.description).toBe("Updated description");
	});

	test("updateContent should update binary content", async () => {
		const success = await updateContent(
			noteId,
			Buffer.from("updated binary"),
			"updated text",
		);
		expect(success).toBeTrue();
	});

	test("getSharedNotes and getSharedNoted should return notes user is a guest of", async () => {
		await addNoteGuest({
			noteId,
			email: `${guestUserId}@test.com`,
			role: "editor",
			actorUserId: userId,
		});

		const sharedNotes = await getCollabNotes(guestUserId);
		expect(sharedNotes.length).toBe(1);
		expect(sharedNotes[0]?.id).toBe(noteId);
		expect(sharedNotes[0]?.role).toBe("editor");

		const aliasNotes = await getCollabNotes(guestUserId);
		expect(aliasNotes.length).toBe(1);
		expect(aliasNotes[0]?.id).toBe(noteId);
	});

	test("getNoteUserPermission and getNoteGuests should work for owner and guest", async () => {
		const { getNoteUserPermission } = await import("../permissions");
		const { getNoteGuests } = await import("../guests");

		const ownerPerm = await getNoteUserPermission(noteId, userId);
		expect(ownerPerm).not.toBeNull();
		expect(ownerPerm?.isOwner).toBeTrue();

		const guestPerm = await getNoteUserPermission(noteId, guestUserId);
		expect(guestPerm).not.toBeNull();
		expect(guestPerm?.isOwner).toBeFalse();
		expect(guestPerm?.role).toBe("editor");

		const guestsData = await getNoteGuests(noteId);
		expect(guestsData.owner).not.toBeNull();
		expect(guestsData.owner?.id).toBe(userId);
		expect(guestsData.guests.length).toBe(1);
		expect(guestsData.guests[0]?.userId).toBe(guestUserId);
	});

	test("deleteNotes should delete the note", async () => {
		const success = await deleteNotes(noteId);
		expect(success).toBeTrue();

		const meta = await getNotesMeta(noteId);
		expect(meta).toBeNull();
	});
});
