/// This file holds all cache utilities for note permissions

import type { NoteUserPermission } from "@nota/db/data/permissions";
import { cache } from ".";

const NOTE_USER_PERMISSION_PREFIX = "permission:note";
const PERMISSION_TTL_SECONDS = 60 * 60; // 1 hour

export const getNoteUserPermissionCacheKey = (noteId: string, userId: string) =>
	`${NOTE_USER_PERMISSION_PREFIX}:${noteId}:user:${userId}`;

export const getCachedNoteUserPermission = async (
	noteId: string,
	userId: string,
): Promise<NoteUserPermission | null> => {
	const key = getNoteUserPermissionCacheKey(noteId, userId);
	const data = await cache.get<NoteUserPermission>(key);
	return data ?? null;
};

export const setCachedNoteUserPermission = async (
	noteId: string,
	userId: string,
	permission: NoteUserPermission,
	ttlSeconds: number = PERMISSION_TTL_SECONDS,
): Promise<void> => {
	const key = getNoteUserPermissionCacheKey(noteId, userId);
	try {
		await cache.set(key, permission, ttlSeconds);
	} catch (error) {
		console.error("Failed to cache note user permission:", error);
	}
};

export const invalidateNoteUserPermission = async (
	noteId: string,
	userId: string,
): Promise<void> => {
	const key = getNoteUserPermissionCacheKey(noteId, userId);
	await cache.del(key);
};
