// src/lib/auth-session.svelte.ts
import { createQuery } from "@tanstack/svelte-query";
import { get } from "svelte/store";
import { authClient } from "./auth-client";
import { orpc } from "./orpc";

import { secureStorage } from "./platform/securestorage";
import { ISDESKTOP } from "./utils";

const sessionStore = authClient.useSession();

let session = $state(get(sessionStore));

sessionStore.subscribe((value) => {
	session = value;
	if (ISDESKTOP && value?.data?.session?.token) {
		void secureStorage
			.setItem("access_token", value.data.session.token)
			.catch(console.error);
	}
});

const signedIn = $derived(!!session.data?.user);

/**
 * True if the user is signed in.
 */
export function isSignedIn() {
	return signedIn;
}

/**
 * True if the initial session check is still loading.
 */
export function isAuthPending() {
	return session.isPending;
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
