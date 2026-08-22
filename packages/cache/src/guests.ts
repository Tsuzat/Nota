/// This file holds all cache utilities for note guests

import type { NoteGuestsResponse } from "@nota/db/data/guests";
import { cache } from ".";

const NOTE_GUESTS_CACHE_PREFIX = "note_guests";
const NOTE_GUESTS_TTL_SECONDS = 60 * 60; // 1 hour

export const getNoteGuestsCacheKey = (noteId: string) =>
	`${NOTE_GUESTS_CACHE_PREFIX}:${noteId}`;

export const getCachedNoteGuests = async (
	noteId: string,
): Promise<NoteGuestsResponse | null> => {
	const key = getNoteGuestsCacheKey(noteId);
	const data = await cache.get<NoteGuestsResponse>(key);
	if (!data) return null;
	return {
		...data,
		guests: data.guests.map((g) => ({
			...g,
			createdAt: new Date(g.createdAt),
		})),
	};
};

export const setCachedNoteGuests = async (
	noteId: string,
	data: NoteGuestsResponse,
	ttlSeconds: number = NOTE_GUESTS_TTL_SECONDS,
): Promise<void> => {
	const key = getNoteGuestsCacheKey(noteId);
	try {
		await cache.set(key, data, ttlSeconds);
	} catch (error) {
		console.error("Failed to cache note guests:", error);
	}
};

export const deleteCachedNoteGuests = async (noteId: string): Promise<void> => {
	const key = getNoteGuestsCacheKey(noteId);
	await cache.del(key);
};
