import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
	addNoteGuest,
	canManageGuests,
	getNoteGuests,
	removeNoteGuest,
	updateNoteGuest,
} from "../guests";
import { createNotes } from "../notes";
import { cleanupTestData, createTestUser, createTestWorkspace } from "./setup";

describe("Database - Note Guests", () => {
	const ownerId = "test_guest_owner";
	const adminGuestId = "test_guest_admin";
	const editorGuestId = "test_guest_editor";
	const viewerGuestId = "test_guest_viewer";
	const newGuestId = "test_guest_new";
	const unrelatedId = "test_guest_unrelated";

	const workspaceId = "test_guest_workspace";
	const noteId = "test_guest_note";

	beforeAll(async () => {
		await cleanupTestData();

		// Create users
		await createTestUser(ownerId, "Owner User");
		await createTestUser(adminGuestId, "Admin Guest");
		await createTestUser(editorGuestId, "Editor Guest");
		await createTestUser(viewerGuestId, "Viewer Guest");
		await createTestUser(newGuestId, "New Guest");
		await createTestUser(unrelatedId, "Unrelated User");

		// Create workspace and note
		await createTestWorkspace(workspaceId, ownerId, "Guest Workspace");
		await createNotes({
			id: noteId,
			workspaceId,
			ownerId,
			name: "Guest Note",
			content: Buffer.from("data"),
		});

		// Add initial admin & editor guests via owner
		await addNoteGuest({
			noteId,
			email: `${adminGuestId}@test.com`,
			role: "admin",
			actorUserId: ownerId,
		});

		await addNoteGuest({
			noteId,
			email: `${editorGuestId}@test.com`,
			role: "editor",
			actorUserId: ownerId,
		});
	});

	afterAll(async () => {
		await cleanupTestData();
	});

	test("canManageGuests for owner and admin", async () => {
		expect(await canManageGuests(noteId, ownerId)).toBeTrue();
		expect(await canManageGuests(noteId, adminGuestId)).toBeTrue();
		expect(await canManageGuests(noteId, editorGuestId)).toBeFalse();
		expect(await canManageGuests(noteId, unrelatedId)).toBeFalse();
	});

	test("getNoteGuests returns owner and guest list", async () => {
		const res = await getNoteGuests(noteId);
		expect(res.owner).not.toBeNull();
		expect(res.owner?.id).toBe(ownerId);
		expect(res.guests.length).toBe(2);

		const admin = res.guests.find((g) => g.userId === adminGuestId);
		expect(admin).toBeDefined();
		expect(admin?.role).toBe("admin");
		expect(admin?.user.email).toBe(`${adminGuestId}@test.com`);

		const editor = res.guests.find((g) => g.userId === editorGuestId);
		expect(editor).toBeDefined();
		expect(editor?.role).toBe("editor");
	});

	test("admin can add a new guest", async () => {
		const added = await addNoteGuest({
			noteId,
			email: `${viewerGuestId}@test.com`,
			role: "viewer",
			actorUserId: adminGuestId,
		});

		expect(added.userId).toBe(viewerGuestId);
		expect(added.role).toBe("viewer");

		const res = await getNoteGuests(noteId);
		expect(res.guests.length).toBe(3);
	});

	test("editor cannot add a guest (unauthorized)", async () => {
		expect(
			addNoteGuest({
				noteId,
				email: `${newGuestId}@test.com`,
				role: "viewer",
				actorUserId: editorGuestId,
			}),
		).rejects.toThrow("Unauthorized");
	});

	test("cannot add note owner as guest", async () => {
		expect(
			addNoteGuest({
				noteId,
				email: `${ownerId}@test.com`,
				role: "editor",
				actorUserId: adminGuestId,
			}),
		).rejects.toThrow("already the note owner");
	});

	test("cannot add self as guest", async () => {
		expect(
			addNoteGuest({
				noteId,
				email: `${adminGuestId}@test.com`,
				role: "viewer",
				actorUserId: adminGuestId,
			}),
		).rejects.toThrow("Cannot add yourself");
	});

	test("adding non-existent user email throws error", async () => {
		expect(
			addNoteGuest({
				noteId,
				email: "nonexistent@test.com",
				role: "viewer",
				actorUserId: ownerId,
			}),
		).rejects.toThrow("User with this email not found");
	});

	test("owner can update a guest role", async () => {
		const updated = await updateNoteGuest({
			noteId,
			userId: viewerGuestId,
			role: "comment",
			actorUserId: ownerId,
		});

		expect(updated.role).toBe("comment");

		const res = await getNoteGuests(noteId);
		const viewer = res.guests.find((g) => g.userId === viewerGuestId);
		expect(viewer?.role).toBe("comment");
	});

	test("user cannot update their own role (self-update disallowed)", async () => {
		expect(
			updateNoteGuest({
				noteId,
				userId: adminGuestId,
				role: "viewer",
				actorUserId: adminGuestId,
			}),
		).rejects.toThrow("Cannot modify your own");
	});

	test("editor cannot update guest role (unauthorized)", async () => {
		expect(
			updateNoteGuest({
				noteId,
				userId: viewerGuestId,
				role: "admin",
				actorUserId: editorGuestId,
			}),
		).rejects.toThrow("Unauthorized");
	});

	test("admin can remove a guest", async () => {
		const deleted = await removeNoteGuest({
			noteId,
			userId: viewerGuestId,
			actorUserId: adminGuestId,
		});

		expect(deleted.userId).toBe(viewerGuestId);

		const res = await getNoteGuests(noteId);
		expect(res.guests.some((g) => g.userId === viewerGuestId)).toBeFalse();
	});

	test("user cannot remove themselves (self-removal disallowed)", async () => {
		expect(
			removeNoteGuest({
				noteId,
				userId: adminGuestId,
				actorUserId: adminGuestId,
			}),
		).rejects.toThrow("Cannot remove yourself");
	});

	test("editor cannot remove guest (unauthorized)", async () => {
		expect(
			removeNoteGuest({
				noteId,
				userId: adminGuestId,
				actorUserId: editorGuestId,
			}),
		).rejects.toThrow("Unauthorized");
	});
});
