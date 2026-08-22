/// This file holds all the cache utilities for notes

import type { NoteMeta } from "@nota/db/data/notes";
import { getWorkspaceOwnerId } from "@nota/db/data/workspace";
import { cache } from ".";

const WORKSPACE_NOTES_CACHE_PREFIX = "workspace_notes";
const NOTE_META_CACHE_PREFIX = "note_meta";
const COLLAB_NOTES_CACHE_PREFIX = "collab_notes";

const TTL_SECONDS = 60 * 60 * 24; // 24 hours

export const getWorkspaceNotesCacheKey = (
	workspaceId: string,
	userId: string,
) => `${WORKSPACE_NOTES_CACHE_PREFIX}:${workspaceId}:${userId}`;

export const getNoteMetaCacheKey = (noteId: string) =>
	`${NOTE_META_CACHE_PREFIX}:${noteId}`;

export const getCollabNotesCacheKey = (userId: string) =>
	`${COLLAB_NOTES_CACHE_PREFIX}:${userId}`;

// ── Workspace Notes ─────────────────────────────────────────────────────────

export const getCachedNotesByWorkspace = async (
	workspaceId: string,
	userId: string,
): Promise<NoteMeta[] | null> => {
	const key = getWorkspaceNotesCacheKey(workspaceId, userId);
	const data = await cache.get<NoteMeta[]>(key);
	if (!data) return null;
	return data.map((item) => ({
		...item,
		createdAt: new Date(item.createdAt),
		updatedAt: new Date(item.updatedAt),
	}));
};

export const setCachedNotesByWorkspace = async (
	workspaceId: string,
	userId: string,
	notes: NoteMeta[],
	ttlSeconds: number = TTL_SECONDS,
): Promise<void> => {
	const key = getWorkspaceNotesCacheKey(workspaceId, userId);
	try {
		await cache.set(key, notes, ttlSeconds);
	} catch (error) {
		console.error("Failed to cache workspace notes:", error);
	}
};

export const deleteCachedNotesByWorkspace = async (
	workspaceId: string,
	userId: string,
): Promise<void> => {
	const key = getWorkspaceNotesCacheKey(workspaceId, userId);
	await cache.del(key);
};

// ── Note Meta ───────────────────────────────────────────────────────────────

export const getCachedNoteMeta = async (
	noteId: string,
): Promise<NoteMeta | null> => {
	const key = getNoteMetaCacheKey(noteId);
	const data = await cache.get<NoteMeta>(key);
	if (!data) return null;
	return {
		...data,
		createdAt: new Date(data.createdAt),
		updatedAt: new Date(data.updatedAt),
	};
};

export const setCachedNoteMeta = async (
	noteId: string,
	meta: NoteMeta,
	ttlSeconds: number = TTL_SECONDS,
): Promise<void> => {
	const key = getNoteMetaCacheKey(noteId);
	try {
		await cache.set(key, meta, ttlSeconds);
	} catch (error) {
		console.error("Failed to cache note meta:", error);
	}
};

export const deleteCachedNoteMeta = async (noteId: string): Promise<void> => {
	const key = getNoteMetaCacheKey(noteId);
	await cache.del(key);
};

// ── Collab Notes ────────────────────────────────────────────────────────────

export const getCachedCollabNotes = async (
	userId: string,
): Promise<(NoteMeta & { role: string })[] | null> => {
	const key = getCollabNotesCacheKey(userId);
	const data = await cache.get<(NoteMeta & { role: string })[]>(key);
	if (!data) return null;
	return data.map((item) => ({
		...item,
		createdAt: new Date(item.createdAt),
		updatedAt: new Date(item.updatedAt),
	}));
};

export const setCachedCollabNotes = async (
	userId: string,
	notes: (NoteMeta & { role: string })[],
	ttlSeconds: number = TTL_SECONDS,
): Promise<void> => {
	const key = getCollabNotesCacheKey(userId);
	try {
		await cache.set(key, notes, ttlSeconds);
	} catch (error) {
		console.error("Failed to cache collab notes:", error);
	}
};

export const deleteCachedCollabNotes = async (
	userId: string,
): Promise<void> => {
	const key = getCollabNotesCacheKey(userId);
	await cache.del(key);
};

// ── Composite Invalidation Helpers ──────────────────────────────────────────

/**
 * Invalidate cache when a note's metadata changes,
 * clearing the specific note's meta and its parent workspace's notes list.
 */
export const invalidateNoteMetaCache = async (
	noteId: string,
	workspaceId?: string,
): Promise<void> => {
	const operations: Promise<void>[] = [];
	operations.push(deleteCachedNoteMeta(noteId));
	if (workspaceId) {
		const ownerId = await getWorkspaceOwnerId(workspaceId);
		if (ownerId) {
			operations.push(deleteCachedNotesByWorkspace(workspaceId, ownerId));
		}
	}
	await Promise.all(operations);
};
