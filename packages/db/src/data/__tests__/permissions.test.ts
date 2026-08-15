import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { getNoteUserPermission } from "../permissions";
import { createTestUser, createTestWorkspace, cleanupTestData } from "./setup";
import { createNotes } from "../notes";
import { db } from "../../index";
import { noteGuests } from "../../schema/app";

describe("Database - Permissions", () => {
  const ownerId = "test_perm_owner";
  const guestId = "test_perm_guest";
  const unrelatedId = "test_perm_unrelated";
  const workspaceId = "test_perm_workspace";
  const noteId = "test_perm_note";

  beforeAll(async () => {
    await cleanupTestData();
    
    // Create users
    await createTestUser(ownerId, "Owner");
    await createTestUser(guestId, "Guest");
    await createTestUser(unrelatedId, "Unrelated");

    // Create workspace and note
    await createTestWorkspace(workspaceId, ownerId, "Perm Workspace");
    await createNotes({
      id: noteId,
      workspaceId,
      ownerId: ownerId,
      name: "Perm Note",
      content: Buffer.from("data"),
    });

    // Add guest to noteGuests
    await db.insert(noteGuests).values({
      noteId,
      userId: guestId,
      role: "editor",
      invitedBy: ownerId,
    });
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  test("getNoteUserPermission for owner", async () => {
    const perm = await getNoteUserPermission(noteId, ownerId);
    expect(perm).not.toBeNull();
    expect(perm!.isOwner).toBeTrue();
    // Usually owner won't have a guest row, but it checks isOwner cleanly
  });

  test("getNoteUserPermission for guest", async () => {
    const perm = await getNoteUserPermission(noteId, guestId);
    expect(perm).not.toBeNull();
    expect(perm!.isOwner).toBeFalse();
    expect(perm!.role).toBe("editor");
  });

  test("getNoteUserPermission for unrelated user", async () => {
    const perm = await getNoteUserPermission(noteId, unrelatedId);
    // Left join returns a row because note exists, but role is null and isOwner is false
    // Note: getNoteUserPermission returns `{ isOwner: false, role: null }` if user has no access but note exists!
    expect(perm).not.toBeNull();
    expect(perm!.isOwner).toBeFalse();
    expect(perm!.role).toBeNull();
  });

  test("getNoteUserPermission for non-existent note", async () => {
    const perm = await getNoteUserPermission("invalid_note", ownerId);
    expect(perm).toBeNull();
  });
});
