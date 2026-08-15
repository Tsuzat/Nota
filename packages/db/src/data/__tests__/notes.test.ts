import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import {
  createNotes,
  deleteNotes,
  getNotesByWorkspace,
  getNotesMeta,
  updateContent,
  updateNotesMeta,
} from "../notes";
import { createTestUser, createTestWorkspace, cleanupTestData } from "./setup";

describe("Database - Notes", () => {
  const userId = "test_owner_user";
  const workspaceId = "test_notes_workspace";
  const noteId = "test_note_1";

  beforeAll(async () => {
    await cleanupTestData();
    await createTestUser(userId, "Note Owner");
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
    expect((note as any).content).toBeUndefined();
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
    expect(meta!.id).toBe(noteId);
  });

  test("updateNotesMeta should update metadata", async () => {
    const updated = await updateNotesMeta({
      id: noteId,
      name: "Updated Name",
      description: "Updated description",
    });
    expect(updated).not.toBeNull();
    expect(updated!.name).toBe("Updated Name");
    expect(updated!.description).toBe("Updated description");
  });

  test("updateContent should update binary content", async () => {
    const success = await updateContent(
      noteId,
      Buffer.from("updated binary"),
      "updated text",
    );
    expect(success).toBeTrue();
  });

  test("deleteNotes should delete the note", async () => {
    const success = await deleteNotes(noteId);
    expect(success).toBeTrue();

    const meta = await getNotesMeta(noteId);
    expect(meta).toBeNull();
  });
});
