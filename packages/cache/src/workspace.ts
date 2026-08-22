/// This file holds all the cache utilities for workspace

import { selectWorkspaceSchema } from "@nota/db/data/workspace";
import type { Workspace } from "@nota/db/types";
import { cache } from ".";

const USER_WORKSPACE_CACHE_PREFIX = "user_workspaces";
const USER_WORKSPACE_CACHE_TTL_SECONDS = 60 * 60 * 24;

const getUserWorkspaceCacheKey = (userId: string) =>
	`${USER_WORKSPACE_CACHE_PREFIX}:${userId}`;

/**
 * Get cached user workspaces
 * @param userId User ID
 * @returns Array of workspaces or null if cache miss / invalid
 */
export const getCachedUserWorkspaces = async (
	userId: string,
): Promise<Workspace[] | null> => {
	const key = getUserWorkspaceCacheKey(userId);
	const data = await cache.get<Workspace[]>(key);
	if (!data) {
		return null;
	}
	try {
		const parsed = data.map((item) => ({
			...item,
			createdAt: new Date(item.createdAt),
			updatedAt: new Date(item.updatedAt),
		}));
		return selectWorkspaceSchema.array().parse(parsed);
	} catch (error) {
		console.error("Failed to parse user workspaces cache:", error);
		return null;
	}
};

/**
 * Set cached user workspaces
 * @param userId User ID
 * @param workspaces Workspaces array to cache
 * @param ttlSeconds Optional TTL in seconds (defaults to 24 hours)
 */
export const setCachedUserWorkspaces = async (
	userId: string,
	workspaces: Workspace[],
	ttlSeconds: number = USER_WORKSPACE_CACHE_TTL_SECONDS,
): Promise<void> => {
	const key = getUserWorkspaceCacheKey(userId);
	try {
		const validated = selectWorkspaceSchema.array().parse(workspaces);
		await cache.set(key, validated, ttlSeconds);
	} catch (error) {
		console.error("Failed to cache user workspaces:", error);
	}
};

/**
 * Delete cached user workspaces
 * @param userId User ID
 */
export const deleteCachedUserWorkspaces = async (
	userId: string,
): Promise<void> => {
	const key = getUserWorkspaceCacheKey(userId);
	await cache.del(key);
};
