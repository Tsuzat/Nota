import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../../index";
import { noteSnapshots, notes, userQuota, workspace } from "../../schema/app";
import { user } from "../../schema/auth";
import {
	createCloudSnapshot,
	deleteCloudSnapshot,
	getSnapshotById,
	getSnapshotContent,
	getSnapshotsForWorkspace,
} from "../note_snapshots";
import { createNotes } from "../notes";
import { createTestUser, createTestWorkspace } from "./setup";

describe("Database - Note Snapshots", () => {
	const userId = `test_snap_user_${Math.random().toString(36).slice(2, 8)}`;
	const workspaceId = `test_snap_ws_${Math.random().toString(36).slice(2, 8)}`;
	const noteId = `test_snap_note_${Math.random().toString(36).slice(2, 8)}`;
	let snapshotId: string;
	const dummyContent = Buffer.from("Hello Yjs update binary snapshot data");

	beforeAll(async () => {
		await createTestUser(userId, "Snapshot User");
		await createTestWorkspace(workspaceId, userId, "Snapshot Workspace");
		await createNotes({
			id: noteId,
			workspaceId,
			ownerId: userId,
			name: "Snapshot Note",
			icon: "lucide:file-text",
			content: dummyContent,
		});
	});

	afterAll(async () => {
		await db.delete(noteSnapshots).where(eq(noteSnapshots.createdBy, userId));
		await db.delete(notes).where(eq(notes.ownerId, userId));
		await db.delete(workspace).where(eq(workspace.ownerId, userId));
		await db.delete(userQuota).where(eq(userQuota.userId, userId));
		await db.delete(user).where(eq(user.id, userId));
	});

	test("createCloudSnapshot should compress and store a snapshot", async () => {
		const snapshot = await createCloudSnapshot({
			noteId,
			userId,
			yjsState: dummyContent,
			kind: "manual",
			label: "Manual v1",
		});

		expect(snapshot).toBeDefined();
		expect(snapshot.id).toBeString();
		expect(snapshot.noteId).toBe(noteId);
		expect(snapshot.createdBy).toBe(userId);
		expect(snapshot.kind).toBe("manual");
		expect(snapshot.label).toBe("Manual v1");
		expect(snapshot.size).toBeGreaterThan(0);
		expect(snapshot.contentHash).toBeString();

		snapshotId = snapshot.id;
	});

	test("getSnapshotById should retrieve snapshot metadata", async () => {
		const meta = await getSnapshotById(snapshotId);
		expect(meta).not.toBeNull();
		expect(meta?.id).toBe(snapshotId);
		expect(meta?.label).toBe("Manual v1");
	});

	test("getSnapshotContent should decompress and return original content", async () => {
		const content = await getSnapshotContent(snapshotId);
		expect(content).toBeInstanceOf(Buffer);
		expect(content.toString()).toBe(dummyContent.toString());
	});

	test("getSnapshotsForWorkspace should return snapshots with joined note/workspace info", async () => {
		const res = await getSnapshotsForWorkspace(workspaceId, {
			userId,
		});

		expect(res.total).toBe(1);
		expect(res.items).toHaveLength(1);
		expect(res.items[0]?.id).toBe(snapshotId);
		expect(res.items[0]?.noteName).toBe("Snapshot Note");
		expect(res.items[0]?.noteIcon).toBe("lucide:file-text");
		expect(res.items[0]?.workspaceId).toBe(workspaceId);
		expect(res.items[0]?.workspaceName).toBe("Snapshot Workspace");
	});

	test("deleteCloudSnapshot should remove the snapshot", async () => {
		const deleted = await deleteCloudSnapshot(snapshotId);
		expect(deleted).toBe(true);

		const remaining = await getSnapshotsForWorkspace(workspaceId, { userId });
		expect(remaining.total).toBe(0);
	});
});
