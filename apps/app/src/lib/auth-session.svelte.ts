// src/lib/auth-session.svelte.ts
import { createQuery } from "@tanstack/svelte-query";
import { get } from "svelte/store";
import { authClient } from "./auth-client";
import { orpc } from "./orpc";

const sessionStore = authClient.useSession();

let session = $state(get(sessionStore));

sessionStore.subscribe((value) => {
	session = value;
});

const signedIn = $derived(
	!!session.data?.user && !session.isPending && !session.isRefetching,
);

/**
 * True if the user is signed in.
 */
export function isSignedIn() {
	return signedIn;
}

export function getUserQuota() {
	return createQuery(() => ({
		...orpc.userquota.getQuota.queryOptions(),
		enabled: isSignedIn(),
	}));
}

export function getAuthSession() {
	return {
		get data() {
			return session.data;
		},
		get user() {
			return session.data?.user;
		},
		get isPending() {
			return session.isPending;
		},
		get isRefetching() {
			return session.isRefetching;
		},
		get error() {
			return session.error;
		},
		refetch: () => {
			const current = sessionStore.get ? sessionStore.get() : get(sessionStore);
			return current?.refetch?.();
		},
	};
}
