// src/lib/auth-session.svelte.ts
import { get } from "svelte/store";
import { authClient } from "./auth-client";

const sessionStore = authClient.useSession();

let session = $state(get(sessionStore));

sessionStore.subscribe((value) => {
	session = value;
});

export function getAuthSession() {
	return session;
}

const signedIn = $derived(!!session.data?.user && !session.isPending);

/**
 * True if the user is signed in.
 */
export function isSignedIn() {
	return signedIn;
}
